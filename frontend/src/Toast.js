import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, opts = {}) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, ...opts };
    setToasts(t => [...t, toast]);
    if (!opts?.persist) {
      setTimeout(() => {
        setToasts(t => t.filter(x => x.id !== id));
      }, opts.duration || 3500);
    }
    return id;
  }, []);

  const hide = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);

  return (
    <ToastContext.Provider value={{ show, hide }}>
      {children}
      <div className="toast-root">
        {toasts.map(t => (
          <div key={t.id} role="status" aria-live="polite" className="toast-item">
            <div style={{ fontSize: 14, color: '#0f172a' }}>{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  // Return a safe no-op object if provider is missing to avoid runtime crashes in tests
  if (!ctx) return { show: () => {}, hide: () => {} };
  return ctx;
}

export default ToastProvider;
