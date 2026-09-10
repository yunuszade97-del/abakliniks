// Telegram Web App хелперы с фоллбэком для обычного браузера
'use client';

function getWebApp(): typeof import('@twa-dev/sdk').default | null {
  if (typeof window === 'undefined') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const WebApp = require('@twa-dev/sdk').default;
    return WebApp;
  } catch {
    return null;
  }
}

export function isTelegram(): boolean {
  try {
    const wa = getWebApp();
    return !!wa?.initData;
  } catch {
    return false;
  }
}

export function initTelegram(): void {
  try {
    const wa = getWebApp();
    if (wa?.initData) {
      wa.ready();
      wa.expand();
    }
  } catch {
    // fallback: обычный браузер
  }
}

export function openExternalLink(url: string): boolean {
  try {
    const wa = getWebApp();
    if (wa?.initData) {
      wa.openLink(url);
      return true;
    }
  } catch {
    // fallback: обычный браузер
  }
  return false;
}

export interface TelegramTheme {
  bgColor: string;
  textColor: string;
  hintColor: string;
  buttonColor: string;
  buttonTextColor: string;
  secondaryBgColor: string;
}

const DEFAULT_THEME: TelegramTheme = {
  bgColor: '#ffffff',
  textColor: '#000000',
  hintColor: '#999999',
  buttonColor: '#2481cc',
  buttonTextColor: '#ffffff',
  secondaryBgColor: '#f0f0f0',
};

export function getTelegramTheme(): TelegramTheme {
  try {
    const wa = getWebApp();
    if (wa?.initData && wa.themeParams) {
      const tp = wa.themeParams;
      return {
        bgColor: tp.bg_color || DEFAULT_THEME.bgColor,
        textColor: tp.text_color || DEFAULT_THEME.textColor,
        hintColor: tp.hint_color || DEFAULT_THEME.hintColor,
        buttonColor: tp.button_color || DEFAULT_THEME.buttonColor,
        buttonTextColor: tp.button_text_color || DEFAULT_THEME.buttonTextColor,
        secondaryBgColor: tp.secondary_bg_color || DEFAULT_THEME.secondaryBgColor,
      };
    }
  } catch {
    // fallback
  }
  return DEFAULT_THEME;
}

export function applyThemeToCSS(theme: TelegramTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--tg-bg', theme.bgColor);
  root.style.setProperty('--tg-text', theme.textColor);
  root.style.setProperty('--tg-hint', theme.hintColor);
  root.style.setProperty('--tg-button', theme.buttonColor);
  root.style.setProperty('--tg-button-text', theme.buttonTextColor);
  root.style.setProperty('--tg-secondary-bg', theme.secondaryBgColor);
}

export function showBackButton(onClick: () => void): () => void {
  try {
    const wa = getWebApp();
    if (wa?.initData) {
      wa.BackButton.show();
      wa.BackButton.onClick(onClick);
      return () => {
        wa.BackButton.offClick(onClick);
        wa.BackButton.hide();
      };
    }
  } catch {
    // fallback
  }
  return () => {};
}

export function hideBackButton(): void {
  try {
    const wa = getWebApp();
    if (wa?.initData) {
      wa.BackButton.hide();
    }
  } catch {
    // fallback
  }
}

export function showMainButton(text: string, onClick: () => void): () => void {
  try {
    const wa = getWebApp();
    if (wa?.initData) {
      wa.MainButton.setText(text);
      wa.MainButton.show();
      wa.MainButton.onClick(onClick);
      return () => {
        wa.MainButton.offClick(onClick);
        wa.MainButton.hide();
      };
    }
  } catch {
    // fallback
  }
  return () => {};
}

export function hideMainButton(): void {
  try {
    const wa = getWebApp();
    if (wa?.initData) {
      wa.MainButton.hide();
    }
  } catch {
    // fallback
  }
}

export function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'light'): void {
  try {
    const wa = getWebApp();
    if (wa?.initData) {
      wa.HapticFeedback.impactOccurred(style);
    }
  } catch {
    // fallback
  }
}

export function hapticNotification(type: 'error' | 'success' | 'warning'): void {
  try {
    const wa = getWebApp();
    if (wa?.initData) {
      wa.HapticFeedback.notificationOccurred(type);
    }
  } catch {
    // fallback
  }
}
