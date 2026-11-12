import type { ToastVariant } from '@/context/ToastContext';
import { useToastContext } from '@/context/ToastContext';

function parseToastArgs(
  titleOrDuration?: string | number,
  duration?: number,
): { title?: string | undefined; duration?: number | undefined } {
  if (typeof titleOrDuration === 'number') {
    return { duration: titleOrDuration };
  }
  return { title: titleOrDuration, duration };
}

export interface UseToastReturn {
  readonly toast: (
    message: string,
    variant?: ToastVariant,
    titleOrDuration?: string | number,
    duration?: number,
  ) => void;
  readonly toastSuccess: (
    message: string,
    titleOrDuration?: string | number,
    duration?: number,
  ) => void;
  readonly toastError: (
    message: string,
    titleOrDuration?: string | number,
    duration?: number,
  ) => void;
  readonly toastWarning: (
    message: string,
    titleOrDuration?: string | number,
    duration?: number,
  ) => void;
  readonly toastInfo: (
    message: string,
    titleOrDuration?: string | number,
    duration?: number,
  ) => void;
}

export function useToast(): UseToastReturn {
  const { addToast } = useToastContext();

  const toast = (
    message: string,
    variant: ToastVariant = 'success',
    titleOrDuration?: string | number,
    duration?: number,
  ) => {
    const parsed = parseToastArgs(titleOrDuration, duration);
    addToast(message, variant, parsed.duration, parsed.title);
  };

  const toastSuccess = (message: string, titleOrDuration?: string | number, duration?: number) => {
    const parsed = parseToastArgs(titleOrDuration, duration);
    addToast(message, 'success', parsed.duration, parsed.title);
  };

  const toastError = (message: string, titleOrDuration?: string | number, duration?: number) => {
    const parsed = parseToastArgs(titleOrDuration, duration);
    addToast(message, 'error', parsed.duration, parsed.title);
  };

  const toastWarning = (message: string, titleOrDuration?: string | number, duration?: number) => {
    const parsed = parseToastArgs(titleOrDuration, duration);
    addToast(message, 'warning', parsed.duration, parsed.title);
  };

  const toastInfo = (message: string, titleOrDuration?: string | number, duration?: number) => {
    const parsed = parseToastArgs(titleOrDuration, duration);
    addToast(message, 'info', parsed.duration, parsed.title);
  };

  return { toast, toastSuccess, toastError, toastWarning, toastInfo };
}
