/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info';

type ToastInput = {
  type?: ToastType;
  title?: string;
  message: string;
};

type ToastItem = Required<Pick<ToastInput, 'message'>> & {
  id: number;
  type: ToastType;
  title: string;
};

type ToastContextValue = {
  notify: (toast: ToastInput) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const notify = useCallback((toast: ToastInput) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const item: ToastItem = {
      id,
      type: toast.type ?? 'info',
      title: toast.title ?? (toast.type === 'error' ? 'Thất bại' : toast.type === 'success' ? 'Thành công' : 'Thông báo'),
      message: toast.message,
    };
    setItems((prev) => [...prev, item]);
    window.setTimeout(() => remove(id), 3500);
  }, [remove]);

  const value = useMemo<ToastContextValue>(() => ({
    notify,
    success: (message, title) => notify({ type: 'success', message, title }),
    error: (message, title) => notify({ type: 'error', message, title }),
    info: (message, title) => notify({ type: 'info', message, title }),
  }), [notify]);

  useEffect(() => {
    const onToast = (event: Event) => {
      const customEvent = event as CustomEvent<{ type?: ToastType; title?: string; message?: string }>;
      const detail = customEvent.detail;
      if (!detail?.message) return;
      notify({
        type: detail.type ?? 'info',
        title: detail.title,
        message: detail.message,
      });
    };
    window.addEventListener('hm:toast', onToast as EventListener);
    return () => window.removeEventListener('hm:toast', onToast as EventListener);
  }, [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {items.map((t) => (
          <div key={t.id} className={`toast-item toast-item--${t.type}`} role={t.type === 'error' ? 'alert' : 'status'}>
            <div className="toast-item__title">{t.title}</div>
            <div className="toast-item__message">{t.message}</div>
            <button type="button" className="toast-item__close" onClick={() => remove(t.id)} aria-label="Đóng thông báo">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast outside ToastProvider');
  return ctx;
}
