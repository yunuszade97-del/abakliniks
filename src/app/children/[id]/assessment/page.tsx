'use client';

import { use, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { areaAItems, getHistoricalScores } from '@/lib/seed';
import {
  useAssessment, saveAssessment, deleteAssessment,
  saveCompletedAssessment, formatTime, formatShortDate,
  type AssessmentData,
} from '@/lib/storage';
import { showBackButton, hapticImpact, hapticNotification, isTelegram, showMainButton, hideMainButton } from '@/lib/telegram';

const DECLINE_REASONS = [
  'Понадобилась повторная подсказка',
  'Ребёнок отвлекался',
  'Отказ от задания',
];

export default function AssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: childId } = use(params);
  const router = useRouter();
  const assessment = useAssessment(childId);
  const [criteriaOpen, setCriteriaOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const mainBtnCleanupRef = useRef<(() => void) | null>(null);
  // true после завершения среза — гасит повторную инициализацию, пока delete долетает до ререндера
  const skipInitRef = useRef(false);

  const historicalScores = getHistoricalScores(childId);
  const lastScores = useMemo(
    () => historicalScores[historicalScores.length - 1]?.scores || {},
    [historicalScores],
  );

  const currentItem = assessment ? areaAItems[assessment.currentItemIndex] : null;
  const currentCode = currentItem?.code || '';
  const currentScore = assessment?.scores[currentCode];
  const prevScore = lastScores[currentCode];
  const isDeclined = currentScore !== undefined && prevScore !== undefined && currentScore < prevScore;
  const hasReason = !!assessment?.reasons[currentCode];
  const canProceed = currentScore !== undefined && (!isDeclined || hasReason);
  const currentItemIndex = assessment?.currentItemIndex;

  // Актуальные значения для колбэков, которым не нужно пересоздаваться на каждое нажатие клавиши.
  // Синхронизация — эффектом после рендера (react-hooks/refs запрещает запись в ref во время рендера).
  const assessmentRef = useRef(assessment);
  const currentCodeRef = useRef(currentCode);
  const noteTextRef = useRef(noteText);
  useEffect(() => {
    assessmentRef.current = assessment;
    currentCodeRef.current = currentCode;
    noteTextRef.current = noteText;
  });

  // Заметка к пункту — синхронизируем при смене текущего кода (в т.ч. при восстановлении среза)
  const [lastSyncedCode, setLastSyncedCode] = useState<string | null>(null);
  if (assessment && lastSyncedCode !== currentCode) {
    setLastSyncedCode(currentCode);
    setNoteText(assessment.notes[currentCode] || '');
  }

  // Инициализация нового среза, если сохранённого ещё нет.
  // skipInitRef защищает от гонки: после finishAssessment delete шлёт notify,
  // assessment на миг становится null ещё до ухода со страницы — новый пустой срез при этом не создаём.
  useEffect(() => {
    if (assessment || skipInitRef.current) return;
    const newAssessment: AssessmentData = {
      childId,
      currentItemIndex: 0,
      scores: {},
      reasons: {},
      notes: {},
      startedAt: new Date().toISOString(),
      lastSavedAt: new Date().toISOString(),
    };
    saveAssessment(newAssessment);
  }, [assessment, childId]);

  const goToItem = useCallback((index: number) => {
    const current = assessmentRef.current;
    if (!current) return;
    const updated = {
      ...current,
      currentItemIndex: index,
      notes: { ...current.notes, [currentCodeRef.current]: noteTextRef.current },
    };
    saveAssessment(updated);
    setCriteriaOpen(false);
  }, []);

  const setScore = useCallback((score: number) => {
    if (!assessment || !currentItem) return;
    const code = currentItem.code;
    const prev = lastScores[code];

    // Haptic
    if (prev !== undefined && score < prev) {
      hapticNotification('warning');
    } else {
      hapticImpact('light');
    }

    const updated = {
      ...assessment,
      scores: { ...assessment.scores, [code]: score },
    };

    // Если балл не ниже — убираем причину, если она была
    if (prev === undefined || score >= prev) {
      const reasons = { ...updated.reasons };
      delete reasons[code];
      updated.reasons = reasons;
    }

    saveAssessment(updated);
  }, [assessment, currentItem, lastScores]);

  const setReason = useCallback((reason: string) => {
    if (!assessment || !currentItem) return;
    hapticImpact('light');
    const updated = {
      ...assessment,
      reasons: { ...assessment.reasons, [currentItem.code]: reason },
    };
    saveAssessment(updated);
  }, [assessment, currentItem]);

  const finishAssessment = useCallback(() => {
    const current = assessmentRef.current;
    if (!current) return;
    // Сохраняем заметку текущего пункта
    const final = {
      ...current,
      notes: { ...current.notes, [currentCodeRef.current]: noteTextRef.current },
    };

    saveCompletedAssessment({
      childId,
      scores: final.scores,
      reasons: final.reasons,
      notes: final.notes,
      completedAt: new Date().toISOString(),
      date: formatShortDate(),
    });

    skipInitRef.current = true;
    deleteAssessment(childId);
    hideMainButton();
    router.push(`/children/${childId}/matrix`);
  }, [childId, router]);

  const handlePause = useCallback(() => {
    if (!assessment) return;
    const updated = {
      ...assessment,
      notes: { ...assessment.notes, [currentCode]: noteText },
    };
    saveAssessment(updated);
    hideMainButton();
    router.push(`/children/${childId}`);
  }, [assessment, childId, currentCode, noteText, router]);

  // BackButton. Зависит только от currentItemIndex — набор текста в заметке не должен
  // пересоздавать привязку (canProceed/goToItem/finishAssessment уже не меняются от noteText).
  useEffect(() => {
    if (currentItemIndex === undefined) return;
    const cleanup = showBackButton(() => {
      if (currentItemIndex > 0) {
        goToItem(currentItemIndex - 1);
      } else {
        // Пауза — возврат в карточку
        router.push(`/children/${childId}`);
      }
    });
    return cleanup;
  }, [currentItemIndex, childId, router, goToItem]);

  // MainButton Telegram. См. комментарий у BackButton — та же логика зависимостей.
  useEffect(() => {
    if (currentItemIndex === undefined) return;

    // Очистка предыдущей привязки
    if (mainBtnCleanupRef.current) {
      mainBtnCleanupRef.current();
      mainBtnCleanupRef.current = null;
    }

    if (canProceed) {
      const isLast = currentItemIndex >= areaAItems.length - 1;
      const text = isLast ? 'Завершить срез' : 'Дальше →';
      const cleanup = showMainButton(text, () => {
        if (isLast) {
          finishAssessment();
        } else {
          goToItem(currentItemIndex + 1);
        }
      });
      mainBtnCleanupRef.current = cleanup;
    } else {
      hideMainButton();
    }

    return () => {
      if (mainBtnCleanupRef.current) {
        mainBtnCleanupRef.current();
        mainBtnCleanupRef.current = null;
      }
    };
  }, [currentItemIndex, canProceed, finishAssessment, goToItem]);

  if (!assessment || !currentItem) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div
          className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--tg-button)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  const itemIndex = assessment.currentItemIndex;
  const scoredItems = Object.entries(assessment.scores);
  const lastSaved = assessment.lastSavedAt ? formatTime(assessment.lastSavedAt) : '—';
  const isLastItem = itemIndex >= areaAItems.length - 1;

  return (
    <div
      className="flex-1 flex flex-col pb-24"
      style={{ minHeight: '100vh', background: 'var(--tg-secondary-bg)' }}
    >
      {/* Шапка */}
      <div
        className="px-4 pt-3 pb-3 flex items-center justify-between"
        style={{ background: 'var(--tg-bg)' }}
      >
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--tg-text)' }}>
            Область A · Сотрудничество
          </div>
          <div className="text-xs" style={{ color: 'var(--tg-hint)' }}>
            пункт {itemIndex + 1} из {areaAItems.length}
          </div>
        </div>
        <button
          onClick={handlePause}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: 'var(--tg-secondary-bg)', color: 'var(--tg-hint)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
          Пауза
        </button>
      </div>

      {/* Прогресс-бар */}
      <div className="progress-bar-bg mx-0" style={{ borderRadius: 0, height: 3 }}>
        <div
          className="progress-bar-fill"
          style={{
            width: `${((itemIndex + 1) / areaAItems.length) * 100}%`,
            background: 'var(--tg-button)',
          }}
        />
      </div>

      {/* Карточка пункта */}
      <div className="px-4 mt-4">
        <div className="card card-lg animate-fade-in" key={currentItem.code}>
          {/* Код и название */}
          <div className="flex items-start gap-2 mb-3">
            <span
              className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded"
              style={{ background: 'var(--tg-button)', color: 'var(--tg-button-text)' }}
            >
              {currentItem.code}
            </span>
            <span className="text-sm font-semibold leading-tight" style={{ color: 'var(--tg-text)' }}>
              {currentItem.name}
            </span>
          </div>

          {/* Описание */}
          <p className="text-xs mb-3" style={{ color: 'var(--tg-hint)', lineHeight: 1.5 }}>
            {currentItem.description}
          </p>

          {/* Критерии — сворачиваемый блок */}
          <div className="mb-4">
            <button
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: 'var(--tg-button)' }}
              onClick={() => setCriteriaOpen(!criteriaOpen)}
            >
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                style={{ transform: criteriaOpen ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
              Критерии выполнения
            </button>
            <div
              className="collapsible-content"
              style={{
                maxHeight: criteriaOpen ? '300px' : '0',
                opacity: criteriaOpen ? 1 : 0,
              }}
            >
              <div className="mt-2 space-y-1.5 pl-4">
                {currentItem.criteria.map((c, i) => (
                  <div key={i} className="text-xs" style={{ color: 'var(--tg-hint)', lineHeight: 1.4 }}>
                    {c}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Кнопки баллов */}
          <div className="flex justify-between gap-2 mb-3">
            {[0, 1, 2, 3, 4].map((score) => (
              <button
                key={score}
                className={`score-btn score-btn-${score} ${currentScore === score ? 'active animate-pulse-once' : ''}`}
                onClick={() => setScore(score)}
              >
                {score}
              </button>
            ))}
          </div>

          {/* Прошлый балл */}
          {prevScore !== undefined && (
            <div className="text-xs mb-3" style={{ color: 'var(--tg-hint)' }}>
              Прошлый срез: <span className="font-semibold">{prevScore} баллов</span> · {historicalScores[historicalScores.length - 1]?.date}
            </div>
          )}

          {/* Предупреждение о снижении */}
          {isDeclined && (
            <div className="warning-banner mb-3 animate-slide-up">
              <div className="text-xs font-semibold mb-2" style={{ color: '#E65100' }}>
                ⚠ Балл ниже предыдущего — укажите причину
              </div>
              <div className="flex flex-wrap gap-2">
                {DECLINE_REASONS.map((reason) => (
                  <button
                    key={reason}
                    className={`chip ${assessment.reasons[currentCode] === reason ? 'active' : ''}`}
                    onClick={() => setReason(reason)}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Заметка */}
          <div>
            <div className="text-xs font-medium mb-1.5" style={{ color: 'var(--tg-hint)' }}>
              Заметка к пункту
            </div>
            <textarea
              className="input-field resize-none"
              rows={2}
              placeholder="Необязательно..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              style={{ fontSize: 13 }}
            />
          </div>
        </div>
      </div>

      {/* Проставлено в этом срезе */}
      {scoredItems.length > 0 && (
        <div className="px-4 mt-4 animate-fade-in">
          <div className="text-xs font-semibold mb-2" style={{ color: 'var(--tg-hint)' }}>
            Проставлено в этом срезе
          </div>
          <div className="flex flex-wrap gap-1.5">
            {scoredItems.map(([code, score]) => {
              const bgColors: Record<number, string> = {
                0: 'var(--score-0)', 1: 'var(--score-1)',
                2: 'var(--score-2)', 3: 'var(--score-3)', 4: 'var(--score-4)',
              };
              const textColors: Record<number, string> = {
                0: 'var(--score-0-text)', 1: 'var(--score-1-text)',
                2: 'var(--score-2-text)', 3: 'var(--score-3-text)', 4: 'var(--score-4-text)',
              };
              return (
                <span
                  key={code}
                  className="px-2 py-1 rounded-lg text-xs font-semibold"
                  style={{
                    background: bgColors[score as number] || 'var(--score-0)',
                    color: textColors[score as number] || 'var(--score-0-text)',
                  }}
                >
                  {code} · {score as number}
                </span>
              );
            })}
          </div>
          <div className="text-xs mt-2" style={{ color: 'var(--tg-hint)' }}>
            Сохранено на устройстве · синхронизировано {lastSaved}
          </div>
        </div>
      )}

      {/* Навигация — HTML-фоллбэк (видна если не Telegram) */}
      {!isTelegram() && (
        <div className="px-4 mt-4 flex gap-3">
          <button
            className="btn-secondary flex-1"
            onClick={() => {
              if (itemIndex > 0) goToItem(itemIndex - 1);
            }}
            disabled={itemIndex === 0}
            style={{ opacity: itemIndex === 0 ? 0.4 : 1 }}
          >
            ← Назад
          </button>
          <button
            className="btn-primary flex-1"
            disabled={!canProceed}
            onClick={() => {
              if (isLastItem) {
                finishAssessment();
              } else {
                goToItem(itemIndex + 1);
              }
            }}
          >
            {isLastItem ? 'Завершить срез' : 'Дальше →'}
          </button>
        </div>
      )}
    </div>
  );
}
