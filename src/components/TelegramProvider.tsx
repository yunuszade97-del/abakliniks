'use client';

import { useEffect } from 'react';
import { initTelegram, getTelegramTheme, applyThemeToCSS } from '@/lib/telegram';

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initTelegram();
    const theme = getTelegramTheme();
    applyThemeToCSS(theme);
  }, []);

  return <>{children}</>;
}
