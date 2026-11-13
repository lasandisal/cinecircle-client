import { createContext, useContext } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

/**
 * Transient, action-level feedback (e.g. "Circle deleted").
 *
 * This is intentionally separate from the bell/NotificationsDropdown, which
 * carries persistent, server-stored events that should survive a refresh.
 * Toasts are for the thing the user just did, in the tab they did it in.
 */
export const useToast = (): ToastApi => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};
