'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { showBackButton } from '@/lib/telegram';

const stats = [
  { label: 'Детей в программе', value: 24, icon: '👶' },
  { label: 'Срезов за неделю', value: 37, icon: '📋' },
  { label: 'Просрочено', value: 3, icon: '⚠️', warn: true },
  { label: 'Специалистов', value: 5, icon: '👩‍⚕️' },
];

const signals = [
  {
    type: 'warning' as const,
    title: 'Снижение балла',
    description: 'София М. — область A, пункт A7 (Инструкция). Балл снизился с 3 до 2. Причина: понадобилась повторная подсказка.',
    time: '2 часа назад',
  },
  {
    type: 'error' as const,
    title: 'Пропущенный срез',
    description: 'Артём К. — область C (Понимание речи). Плановый срез просрочен на 5 дней.',
    time: '1 день назад',
  },
];

const recentActions = [
  { text: 'Марина П. завершила срез: Илья Б., область A', time: '14:32' },
  { text: 'Ольга С. начала срез: София М., область D', time: '13:45' },
  { text: 'Анна Д. скачала PDF отчёт: Артём К.', time: '12:10' },
  { text: 'Марина П. добавила заметку: Илья Б., A9', time: '11:55' },
  { text: 'Система: автоматический бэкап выполнен', time: '09:00' },
];

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const cleanup = showBackButton(() => router.push('/children'));
    return cleanup;
  }, [router]);

  return (
    <div
      className="flex-1 flex flex-col pb-8"
      style={{ minHeight: '100vh', background: 'var(--tg-secondary-bg)' }}
    >
      {/* Шапка */}
      <div className="px-4 pt-4 pb-3" style={{ background: 'var(--tg-bg)' }}>
        <h1 className="text-lg font-bold" style={{ color: 'var(--tg-text)' }}>
          Панель руководителя
        </h1>
        <div className="text-xs" style={{ color: 'var(--tg-hint)' }}>
          Общая статистика программ
        </div>
      </div>

      {/* Плитки */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-3 animate-fade-in">
        {stats.map((s) => (
          <div key={s.label} className="card text-center py-4">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div
              className="text-2xl font-bold"
              style={{ color: s.warn ? '#E65100' : 'var(--tg-text)' }}
            >
              {s.value}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--tg-hint)' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Сигналы */}
      <div className="px-4 mt-4">
        <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--tg-hint)' }}>
          Сигналы
        </div>
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          {signals.map((signal, i) => (
            <div key={i} className="card">
              <div className="flex items-start gap-2">
                <span
                  className="flex-shrink-0 mt-0.5"
                  style={{ fontSize: 16 }}
                >
                  {signal.type === 'warning' ? '🟡' : '🔴'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: 'var(--tg-text)' }}>
                    {signal.title}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--tg-hint)', lineHeight: 1.5 }}>
                    {signal.description}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--tg-hint)', opacity: 0.7 }}>
                    {signal.time}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Последние действия */}
      <div className="px-4 mt-4">
        <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--tg-hint)' }}>
          Последние действия
        </div>
        <div className="card animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          {recentActions.map((action, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 py-2.5 ${i < recentActions.length - 1 ? 'border-b' : ''}`}
              style={{ borderColor: 'var(--tg-secondary-bg)' }}
            >
              <span className="text-xs font-medium flex-shrink-0" style={{ color: 'var(--tg-button)', minWidth: 36 }}>
                {action.time}
              </span>
              <span className="text-xs" style={{ color: 'var(--tg-text)', lineHeight: 1.4 }}>
                {action.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
