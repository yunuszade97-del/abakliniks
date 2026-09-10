'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { areaAItems, getHistoricalScores, getChildById } from '@/lib/seed';
import { getCompletedAssessment, useHasMounted } from '@/lib/storage';
import { showBackButton } from '@/lib/telegram';
import { useToast } from '@/components/Toast';

const SCORE_COLORS: Record<number, { bg: string; text: string }> = {
  0: { bg: 'var(--score-0)', text: 'var(--score-0-text)' },
  1: { bg: 'var(--score-1)', text: 'var(--score-1-text)' },
  2: { bg: 'var(--score-2)', text: 'var(--score-2-text)' },
  3: { bg: 'var(--score-3)', text: 'var(--score-3-text)' },
  4: { bg: 'var(--score-4)', text: 'var(--score-4-text)' },
};

export default function MatrixPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: childId } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const child = getChildById(childId);
  const mounted = useHasMounted();

  useEffect(() => {
    const cleanup = showBackButton(() => router.push(`/children/${childId}`));
    return cleanup;
  }, [childId, router]);

  if (!mounted || !child) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div
          className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--tg-button)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  const historicalScores = getHistoricalScores(childId);
  const completed = getCompletedAssessment(childId);
  const todayScores = completed?.scores || null;
  const todayDate = completed?.date || 'сегодня';

  // Все даты-колонки
  const dates = [...historicalScores.map((h) => h.date), todayDate];
  const allScoreSets = [...historicalScores.map((h) => h.scores), todayScores];

  // Расчёт динамики
  const lastHistorical = historicalScores[historicalScores.length - 1]?.scores || {};
  let improved = 0;
  let same = 0;
  let declined = 0;

  if (todayScores) {
    for (const item of areaAItems) {
      const prev = lastHistorical[item.code];
      const curr = todayScores[item.code];
      if (prev !== undefined && curr !== undefined) {
        if (curr > prev) improved++;
        else if (curr < prev) declined++;
        else same++;
      }
    }
  }

  const handleExportExcel = async () => {
    showToast('Формирование Excel...');
    try {
      const { exportExcel } = await import('@/lib/export-excel');
      exportExcel(child, historicalScores, todayScores, todayDate);
      showToast('Excel скачан ✓');
    } catch (err) {
      console.error(err);
      showToast('Ошибка при создании Excel');
    }
  };

  const handleExportPdf = async () => {
    showToast('Формирование PDF...');
    try {
      const { exportPdf } = await import('@/lib/export-pdf');
      await exportPdf(child, historicalScores, todayScores, todayDate);
      showToast('PDF скачан ✓');
    } catch (err) {
      console.error(err);
      showToast('Ошибка при создании PDF');
    }
  };

  return (
    <div
      className="flex-1 flex flex-col pb-8"
      style={{ minHeight: '100vh', background: 'var(--tg-secondary-bg)' }}
    >
      {/* Шапка */}
      <div className="px-4 pt-4 pb-3" style={{ background: 'var(--tg-bg)' }}>
        <h1 className="text-lg font-bold" style={{ color: 'var(--tg-text)' }}>
          Матрица срезов
        </h1>
        <div className="text-xs" style={{ color: 'var(--tg-hint)' }}>
          {child.firstName} {child.lastInitial} · Область A — Сотрудничество
        </div>
      </div>

      {/* Матрица */}
      <div className="px-4 mt-4 animate-fade-in">
        <div className="card card-lg overflow-x-auto" style={{ padding: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '3px' }}>
            <thead>
              <tr>
                <th
                  className="text-left text-xs font-medium py-1 px-1"
                  style={{ color: 'var(--tg-hint)', minWidth: 70, position: 'sticky', left: 0, background: 'var(--tg-bg)' }}
                >
                  Пункт
                </th>
                {dates.map((date, i) => {
                  const isToday = i === dates.length - 1 && todayScores;
                  return (
                    <th
                      key={i}
                      className="text-center text-xs font-medium py-1 px-1"
                      style={{
                        color: isToday ? 'var(--tg-button)' : 'var(--tg-hint)',
                        minWidth: 44,
                        fontWeight: isToday ? 700 : 500,
                      }}
                    >
                      {isToday ? '📍' : ''}{date}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {areaAItems.map((item) => (
                <tr key={item.code}>
                  <td
                    className="text-xs font-medium py-0.5 px-1"
                    style={{
                      color: 'var(--tg-text)',
                      position: 'sticky',
                      left: 0,
                      background: 'var(--tg-bg)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.code}
                  </td>
                  {allScoreSets.map((scoreSet, colIdx) => {
                    const isToday = colIdx === allScoreSets.length - 1 && todayScores;
                    const score = scoreSet?.[item.code];
                    const colors = score !== undefined ? SCORE_COLORS[score] : null;

                    return (
                      <td key={colIdx} className="py-0.5 px-0.5">
                        <div
                          className="matrix-cell"
                          style={{
                            background: colors?.bg || 'transparent',
                            color: colors?.text || 'var(--tg-hint)',
                            border: isToday ? '2px solid var(--tg-button)' : 'none',
                            fontWeight: isToday ? 700 : 600,
                          }}
                        >
                          {score !== undefined ? score : '—'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Легенда */}
        <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
          {[0, 1, 2, 3, 4].map((score) => (
            <div key={score} className="flex items-center gap-1">
              <div
                className="rounded"
                style={{
                  width: 14,
                  height: 14,
                  background: SCORE_COLORS[score].bg,
                  border: '1px solid rgba(0,0,0,0.08)',
                }}
              />
              <span className="text-xs" style={{ color: 'var(--tg-hint)' }}>{score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Сводка */}
      {todayScores && (
        <div className="px-4 mt-4 animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <div className="card">
            <div className="text-xs font-semibold mb-3" style={{ color: 'var(--tg-text)' }}>
              Динамика относительно прошлого среза
            </div>
            <div className="flex gap-3">
              <div className="flex-1 text-center py-2 rounded-lg" style={{ background: '#E8F5E9' }}>
                <div className="text-lg font-bold" style={{ color: '#2E7D32' }}>↑ {improved}</div>
                <div className="text-xs" style={{ color: '#4CAF50' }}>выросло</div>
              </div>
              <div className="flex-1 text-center py-2 rounded-lg" style={{ background: 'var(--tg-secondary-bg)' }}>
                <div className="text-lg font-bold" style={{ color: 'var(--tg-hint)' }}>= {same}</div>
                <div className="text-xs" style={{ color: 'var(--tg-hint)' }}>без изменений</div>
              </div>
              <div className="flex-1 text-center py-2 rounded-lg" style={{ background: '#FFF3E0' }}>
                <div className="text-lg font-bold" style={{ color: '#E65100' }}>↓ {declined}</div>
                <div className="text-xs" style={{ color: '#F57C00' }}>снизилось</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Кнопки выгрузки */}
      <div className="px-4 mt-4 space-y-3 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
        <button className="btn-primary" onClick={handleExportExcel}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mr-2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <polyline points="9 15 12 18 15 15" />
          </svg>
          Скачать Excel
        </button>
        <button className="btn-secondary" onClick={handleExportPdf}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mr-2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <polyline points="9 15 12 18 15 15" />
          </svg>
          PDF родителю
        </button>

        <button
          className="btn-secondary"
          onClick={() => router.push(`/children/${childId}`)}
        >
          ← Вернуться в карточку
        </button>
      </div>
    </div>
  );
}
