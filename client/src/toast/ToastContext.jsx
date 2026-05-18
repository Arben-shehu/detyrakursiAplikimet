import { createContext, useCallback, useContext, useState } from 'react';

const ToastCtx = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((arr) => arr.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, type = 'info', durationMs = 3000) => {
    const id = nextId++;
    setToasts((arr) => [...arr, { id, message, type }]);
    if (durationMs > 0) {
      setTimeout(() => remove(id), durationMs);
    }
    return id;
  }, [remove]);

  const api = {
    show,
    remove,
    success: (msg, d) => show(msg, 'success', d),
    error:   (msg, d) => show(msg, 'error', d),
    info:    (msg, d) => show(msg, 'info', d),
    warn:    (msg, d) => show(msg, 'warn', d),
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast-wrap" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} onClick={() => remove(t.id)}>
            <span className="toast-icon">{icon(t.type)}</span>
            <span className="toast-msg">{t.message}</span>
            <button className="toast-close" aria-label="close">×</button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function icon(type) {
  switch (type) {
    case 'success': return '✓';
    case 'error':   return '✕';
    case 'warn':    return '⚠';
    default:        return 'ℹ';
  }
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast duhet brenda <ToastProvider>');
  return ctx;
}
