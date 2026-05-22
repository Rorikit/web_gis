import { useEffect } from 'react';
import { useToastStore } from '@/shared/store/toast-store';

export const ToastViewport = () => {
  const { toasts, remove } = useToastStore();

  useEffect(() => {
    const timers = toasts.map((toast) => window.setTimeout(() => remove(toast.id), 4000));
    return () => timers.forEach(window.clearTimeout);
  }, [toasts, remove]);

  return (
    <div className="toast-viewport">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.kind}`}>
          <strong>{toast.title}</strong>
          {toast.message && <span>{toast.message}</span>}
        </div>
      ))}
    </div>
  );
};
