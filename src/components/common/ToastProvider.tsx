import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { ToastContext, type ToastApi, type ToastVariant } from '../../hooks/useToast';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

const VARIANT_STYLES: Record<ToastVariant, { border: string; icon: React.ReactNode }> = {
  success: {
    border: 'border-emerald-500/40',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />,
  },
  error: {
    border: 'border-rose-500/40',
    icon: <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />,
  },
  info: {
    border: 'border-indigo-500/40',
    icon: <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />,
  },
};

const Toast: React.FC<{ toast: ToastItem; onDismiss: (id: number) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    // Errors linger a little longer so they can actually be read.
    const timeout = window.setTimeout(() => onDismiss(toast.id), toast.variant === 'error' ? 6000 : 4000);
    return () => window.clearTimeout(timeout);
  }, [toast.id, toast.variant, onDismiss]);

  const style = VARIANT_STYLES[toast.variant];

  return (
    <div
      role={toast.variant === 'error' ? 'alert' : 'status'}
      className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border ${style.border} bg-slate-900/95 backdrop-blur-md px-3.5 py-3 text-xs font-medium text-slate-100 shadow-2xl shadow-black/60 toast-in`}
    >
      {style.icon}
      <p className="flex-1 leading-relaxed">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-slate-500 hover:text-slate-200 transition-colors shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message: string, variant: ToastVariant) => {
    const id = nextId.current++;
    // Keep the stack short; older toasts drop off rather than piling up.
    setToasts((prev) => [...prev, { id, message, variant }].slice(-3));
  }, []);

  const success = useCallback((message: string) => push(message, 'success'), [push]);
  const error = useCallback((message: string) => push(message, 'error'), [push]);
  const info = useCallback((message: string) => push(message, 'info'), [push]);

  const api = useMemo<ToastApi>(() => ({ success, error, info }), [success, error, info]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Sits above the mobile BottomNav (bottom-24) and in the corner on desktop. */}
      <div
        aria-live="polite"
        className="fixed z-[100] inset-x-4 bottom-24 md:inset-x-auto md:right-6 md:bottom-6 md:w-[22rem] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
