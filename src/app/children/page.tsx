'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { children as childrenData } from '@/lib/seed';
import { ProgressRing } from '@/components/ProgressRing';
import { hideBackButton } from '@/lib/telegram';
import { useToast } from '@/components/Toast';
import { getAssessment, resetAll, useHasMounted } from '@/lib/storage';

export default function ChildrenListPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const hasMounted = useHasMounted();
  const [resetArmed, setResetArmed] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    hideBackButton();
  }, []);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const handleResetClick = () => {
    if (resetArmed) {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetAll();
      router.replace('/');
      return;
    }
    setResetArmed(true);
    resetTimerRef.current = setTimeout(() => setResetArmed(false), 4000);
  };

  const filtered = childrenData.filter((child) => {
    const q = search.toLowerCase();
    return (
      child.firstName.toLowerCase().includes(q) ||
      child.lastInitial.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col" style={{ minHeight: '100vh', background: 'var(--tg-secondary-bg)' }}>
      {/* Шапка */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold mb-3" style={{ color: 'var(--tg-text)' }}>
          Мои дети
        </h1>

        {/* Поиск */}
        <div className="relative mb-3">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2"
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="var(--tg-hint)" strokeWidth="2" strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            className="input-field pl-9"
            placeholder="Поиск по имени..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Список */}
      <div className="px-4 pb-6 space-y-3">
        {filtered.map((child, i) => {
          const initials = child.firstName[0] + child.lastInitial[0];
          const inProgress = hasMounted ? getAssessment(child.id) : null;
          const ageText = child.ageMonths > 0
            ? `${child.ageYears} г. ${child.ageMonths} мес.`
            : `${child.ageYears} лет`;

          return (
            <div
              key={child.id}
              className="card flex items-center gap-3 cursor-pointer active:opacity-80 animate-fade-in"
              style={{ animationDelay: `${i * 0.08}s`, animationFillMode: 'both' }}
              onClick={() => router.push(`/children/${child.id}`)}
            >
              {/* Аватар */}
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-white"
                style={{
                  width: 44,
                  height: 44,
                  background: child.isOverdue
                    ? 'linear-gradient(135deg, #ff9800, #f57c00)'
                    : 'linear-gradient(135deg, var(--tg-button), #5ba3d9)',
                  fontSize: 16,
                }}
              >
                {initials}
              </div>

              {/* Информация */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate">
                    {child.firstName} {child.lastInitial}
                  </span>
                  {child.isOverdue && (
                    <span
                      className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: '#FFF3E0', color: '#E65100' }}
                    >
                      срез просрочен
                    </span>
                  )}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--tg-hint)' }}>
                  {ageText} · программа {child.programDuration}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--tg-hint)' }}>
                  {inProgress ? (
                    <span style={{ color: 'var(--tg-button)' }}>
                      ● Срез в процессе
                    </span>
                  ) : (
                    <>последний срез: {child.lastAssessmentDate}</>
                  )}
                </div>
              </div>

              {/* Прогресс */}
              <div className="flex-shrink-0">
                <ProgressRing
                  progress={child.overallProgress}
                  color={child.isOverdue ? '#f57c00' : undefined}
                />
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-8" style={{ color: 'var(--tg-hint)', fontSize: 14 }}>
            Ничего не найдено
          </div>
        )}
      </div>

      {/* Кнопка «Добавить ребёнка» */}
      <div className="px-4 pb-6 space-y-3">
        <button
          className="btn-secondary"
          onClick={() => showToast('В демо недоступно')}
        >
          + Добавить ребёнка
        </button>
        <button
          className="btn-secondary"
          onClick={() => router.push('/dashboard')}
        >
          Панель руководителя
        </button>
        <button
          className="w-full text-center text-xs"
          style={{ color: resetArmed ? '#E65100' : 'var(--tg-hint)' }}
          onClick={handleResetClick}
        >
          {resetArmed ? 'Нажмите ещё раз — данные сотрутся' : 'Сбросить демо-данные'}
        </button>
      </div>
    </div>
  );
}
