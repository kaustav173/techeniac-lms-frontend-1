import type { ToastVariant } from '@/context/ToastContext';
import { useToastContext } from '@/context/ToastContext';

export interface UseToastReturn {
  readonly toast: (message: string, variant?: ToastVariant, duration?: number) => void;
  readonly toastSuccess: (message: string, duration?: number) => void;
  readonly toastError: (message: string, duration?: number) => void;
  readonly toastWarning: (message: string, duration?: number) => void;
  readonly toastInfo: (message: string, duration?: number) => void;
}

export function useToast(): UseToastReturn {
  const { addToast } = useToastContext();

  const toast = (message: string, variant: ToastVariant = 'success', duration?: number) => {
    addToast(message, variant, duration);
  };

  const toastSuccess = (message: string, duration?: number) => {
    addToast(message, 'success', duration);
  };

  const toastError = (message: string, duration?: number) => {
    addToast(message, 'error', duration);
  };

  const toastWarning = (message: string, duration?: number) => {
    addToast(message, 'warning', duration);
  };

  const toastInfo = (message: string, duration?: number) => {
    addToast(message, 'info', duration);
  };

  return { toast, toastSuccess, toastError, toastWarning, toastInfo };
}
