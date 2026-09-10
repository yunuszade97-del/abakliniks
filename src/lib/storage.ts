// localStorage хелперы для демо

import { useSyncExternalStore } from 'react';

const KEYS = {
  ONBOARDING: 'ablls_onboarding_done',
  ASSESSMENT_PREFIX: 'ablls_assessment_',
  COMPLETED_PREFIX: 'ablls_completed_',
} as const;

export interface AssessmentData {
  childId: string;
  currentItemIndex: number;
  scores: Record<string, number>;
  reasons: Record<string, string>;
  notes: Record<string, string>;
  startedAt: string;
  lastSavedAt: string;
}

export interface CompletedAssessment {
  childId: string;
  scores: Record<string, number>;
  reasons: Record<string, string>;
  notes: Record<string, string>;
  completedAt: string;
  date: string; // formatted short date
}

// --- Онбординг ---

export function isOnboardingDone(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(KEYS.ONBOARDING) === 'true';
}

export function setOnboardingDone(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.ONBOARDING, 'true');
}

// Хук чтения статуса онбординга без setState в эффекте.
// На сервере/до гидратации отдаёт null («ещё не знаем»).
export function useOnboardingDone(): boolean | null {
  return useSyncExternalStore(
    () => () => {},
    () => isOnboardingDone(),
    () => null,
  );
}

// --- Текущий срез (в процессе) ---

export function getAssessment(childId: string): AssessmentData | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEYS.ASSESSMENT_PREFIX + childId);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AssessmentData;
  } catch {
    return null;
  }
}

const assessmentListeners: Record<string, Set<() => void>> = {};
const assessmentCache: Record<string, { raw: string | null; value: AssessmentData | null }> = {};

function notifyAssessmentChange(childId: string): void {
  assessmentListeners[childId]?.forEach((listener) => listener());
}

function subscribeAssessment(childId: string, listener: () => void): () => void {
  const set = (assessmentListeners[childId] ??= new Set());
  set.add(listener);
  return () => set.delete(listener);
}

// Снапшот с кэшированием ссылки: пока сырые данные в localStorage не менялись,
// возвращает тот же объект — обязательное условие для useSyncExternalStore.
function getAssessmentSnapshot(childId: string): AssessmentData | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEYS.ASSESSMENT_PREFIX + childId);
  const cached = assessmentCache[childId];
  if (cached && cached.raw === raw) return cached.value;
  let value: AssessmentData | null = null;
  if (raw) {
    try {
      value = JSON.parse(raw) as AssessmentData;
    } catch {
      value = null;
    }
  }
  assessmentCache[childId] = { raw, value };
  return value;
}

// Хук чтения текущего (незавершённого) среза. Источник истины — localStorage;
// saveAssessment/deleteAssessment уведомляют подписчиков, компонент перерисовывается сам.
export function useAssessment(childId: string): AssessmentData | null {
  return useSyncExternalStore(
    (onChange) => subscribeAssessment(childId, onChange),
    () => getAssessmentSnapshot(childId),
    () => null,
  );
}

export function saveAssessment(data: AssessmentData): void {
  if (typeof window === 'undefined') return;
  data.lastSavedAt = new Date().toISOString();
  localStorage.setItem(KEYS.ASSESSMENT_PREFIX + data.childId, JSON.stringify(data));
  notifyAssessmentChange(data.childId);
}

export function deleteAssessment(childId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEYS.ASSESSMENT_PREFIX + childId);
  notifyAssessmentChange(childId);
}

// --- Завершённые срезы ---

export function getCompletedAssessment(childId: string): CompletedAssessment | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEYS.COMPLETED_PREFIX + childId);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CompletedAssessment;
  } catch {
    return null;
  }
}

export function saveCompletedAssessment(data: CompletedAssessment): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.COMPLETED_PREFIX + data.childId, JSON.stringify(data));
}

// --- Сброс ---

export function resetAll(): void {
  if (typeof window === 'undefined') return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('ablls_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
  Object.keys(assessmentListeners).forEach((childId) => notifyAssessmentChange(childId));
}

// --- Форматирование ---

export function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

// Признак «уже на клиенте, после гидратации» — без setState в эффекте.
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function formatShortDate(): string {
  const d = new Date();
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${day}.${month}`;
}
