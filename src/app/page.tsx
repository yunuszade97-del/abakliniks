'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingDone, setOnboardingDone } from '@/lib/storage';
import { hideBackButton } from '@/lib/telegram';

export default function OnboardingPage() {
  const router = useRouter();
  const onboardingDone = useOnboardingDone();
  const loading = onboardingDone !== false;

  useEffect(() => {
    hideBackButton();
  }, []);

  useEffect(() => {
    if (onboardingDone) {
      router.replace('/children');
    }
  }, [onboardingDone, router]);

  const handleStart = () => {
    setOnboardingDone();
    router.push('/children');
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div
          className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--tg-button)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center px-6"
      style={{ minHeight: '100vh', background: 'var(--tg-secondary-bg)' }}
    >
      <div className="card card-lg p-8 max-w-sm w-full animate-scale-in text-center">
        {/* Иконка */}
        <div
          className="mx-auto mb-6 flex items-center justify-center rounded-full"
          style={{
            width: 72,
            height: 72,
            background: 'linear-gradient(135deg, var(--tg-button), #5ba3d9)',
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </div>

        <h1 className="text-xl font-bold mb-3" style={{ color: 'var(--tg-text)' }}>
          Демо-версия системы диагностики ABLLS-R
        </h1>

        <p
          className="text-sm mb-6 leading-relaxed"
          style={{ color: 'var(--tg-hint)' }}
        >
          Данные тестовые, ничего не сохраняется на сервере. Всё, что вы наставите,
          останется только на этом устройстве.
        </p>

        <div
          className="rounded-xl p-3 mb-6 text-left"
          style={{
            background: 'var(--tg-secondary-bg)',
            fontSize: '13px',
            color: 'var(--tg-hint)',
          }}
        >
          <span style={{ color: 'var(--tg-button)' }}>ℹ</span>{' '}
          В демо доступна область A — «Сотрудничество и подкрепления»
        </div>

        <button className="btn-primary" onClick={handleStart}>
          Начать
        </button>
      </div>
    </div>
  );
}
