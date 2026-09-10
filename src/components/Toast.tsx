'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface ToastContextType {
  showToast: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<string | null>(null);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, duration = 2000) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setExiting(false);
    setToast(message);
    timerRef.current = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        setToast(null);
        setExiting(false);
      }, 200);
    }, duration);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 ${exiting ? 'toast-exit' : 'toast-enter'}`}
          style={{
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '10px',
            fontSize: '14px',
            maxWidth: 'calc(100% - 48px)',
            textAlign: 'center',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {toast}
        </div>
      )}
    </ToastContext.Provider>
  );
}
