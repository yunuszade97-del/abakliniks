'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getChildById } from '@/lib/seed';
import { useAssessment } from '@/lib/storage';
import { showBackButton } from '@/lib/telegram';
import { useToast } from '@/components/Toast';

export default function ChildProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const child = getChildById(id);
  const assessment = useAssessment(id);
  const inProgress = assessment ? { currentItemIndex: assessment.currentItemIndex } : null;

  useEffect(() => {
    const cleanup = showBackButton(() => router.push('/children'));
    return cleanup;
  }, [router]);

  if (!child) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <p style={{ color: 'var(--tg-hint)' }}>Ребёнок не найден</p>
      </div>
    );
  }

  const ageText = child.ageMonths > 0
    ? `${child.ageYears} г. ${child.ageMonths} мес.`
    : `${child.ageYears} лет`;

  return (
    <div className="flex-1 flex flex-col pb-6" style={{ minHeight: '100vh', background: 'var(--tg-secondary-bg)' }}>
      {/* Шапка */}
      <div className="card card-lg mx-0 rounded-none px-4 pt-4 pb-5 animate-fade-in" style={{ borderRadius: '0 0 20px 20px' }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-white"
            style={{
              width: 52,
              height: 52,
              background: 'linear-gradient(135deg, var(--tg-button), #5ba3d9)',
              fontSize: 18,
            }}
          >
            {child.firstName[0]}{child.lastInitial[0]}
          </div>
          <div>
            <h1 className="text-lg font-bold">
              {child.firstName} {child.lastInitial}
            </h1>
            <div className="text-xs" style={{ color: 'var(--tg-hint)' }}>
              {ageText}
            </div>
          </div>
        </div>
        <div className="text-xs space-y-1" style={{ color: 'var(--tg-hint)' }}>
          <div>Куратор: <span style={{ color: 'var(--tg-text)' }}>{child.curator}</span></div>
          <div>Старт программы: <span style={{ color: 'var(--tg-text)' }}>{child.programStart}</span></div>
        </div>
      </div>

      {/* Области */}
      <div className="px-4 mt-4">
        <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--tg-hint)' }}>
          Области
        </div>
        <div className="card space-y-4 animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          {child.areas.map((area) => {
            const pct = Math.round((area.current / area.total) * 100);
            const isAvailable = area.code === 'A';

            return (
              <div
                key={area.code}
                className={`${isAvailable ? 'cursor-pointer active:opacity-80' : 'cursor-pointer'}`}
                onClick={() => {
                  if (!isAvailable) {
                    showToast('В демо доступна область A');
                  }
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded"
                      style={{
                        background: isAvailable ? 'var(--tg-button)' : 'var(--tg-secondary-bg)',
                        color: isAvailable ? 'var(--tg-button-text)' : 'var(--tg-hint)',
                      }}
                    >
                      {area.code}
                    </span>
                    <span className="text-sm font-medium" style={{ color: isAvailable ? 'var(--tg-text)' : 'var(--tg-hint)' }}>
                      {area.name}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--tg-hint)' }}>
                    {area.current}/{area.total}
                  </span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${pct}%`,
                      background: isAvailable ? 'var(--tg-button)' : 'var(--tg-hint)',
                      opacity: isAvailable ? 1 : 0.4,
                    }}
                  />
                </div>
              </div>
            );
          })}
          <div className="text-xs" style={{ color: 'var(--tg-hint)' }}>
            по данным среза от {child.lastAssessmentDate.replace(' 2026', '')}
          </div>
        </div>
      </div>

      {/* Последние срезы */}
      <div className="px-4 mt-4">
        <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--tg-hint)' }}>
          Последние срезы
        </div>
        <div className="card space-y-0 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          {child.recentAssessments.map((ra, i) => (
            <div
              key={i}
              className={`flex items-center py-3 ${i < child.recentAssessments.length - 1 ? 'border-b' : ''}`}
              style={{ borderColor: 'var(--tg-secondary-bg)' }}
            >
              <span className="text-xs font-medium" style={{ color: 'var(--tg-button)', minWidth: 52 }}>
                {ra.date}
              </span>
              <span className="text-xs flex-1" style={{ color: 'var(--tg-text)' }}>
                {ra.area} · {ra.specialist}
              </span>
              <span className="text-xs" style={{ color: 'var(--tg-hint)' }}>
                {ra.itemCount} п. · {ra.durationMinutes} мин
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Кнопки */}
      <div className="px-4 mt-4 space-y-3 animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
        {inProgress ? (
          <button
            className="btn-primary"
            onClick={() => router.push(`/children/${id}/assessment`)}
          >
            Продолжить срез (пункт {inProgress.currentItemIndex + 1} из 12)
          </button>
        ) : (
          <button
            className="btn-primary"
            onClick={() => router.push(`/children/${id}/assessment`)}
          >
            Начать срез
          </button>
        )}

        <button
          className="btn-secondary"
          onClick={() => router.push(`/children/${id}/matrix`)}
        >
          Матрица срезов
        </button>
      </div>
    </div>
  );
}
