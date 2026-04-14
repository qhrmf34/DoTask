'use client';

import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error';
}

interface ToastContextValue {
  toast: (toast: Omit<Toast, 'id'>) => void;
}

const ToastContext = React.createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return React.useContext(ToastContext);
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            className={cn(
              'flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg bg-white',
              'data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full',
              'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-full',
              t.variant === 'error' && 'border-red-200',
              t.variant === 'success' && 'border-green-200',
              (!t.variant || t.variant === 'default') && 'border-gray-200',
            )}
          >
            <div className="flex-1">
              {t.title && <ToastPrimitive.Title className="text-sm font-semibold text-gray-900">{t.title}</ToastPrimitive.Title>}
              {t.description && <ToastPrimitive.Description className="text-sm text-gray-500 mt-0.5">{t.description}</ToastPrimitive.Description>}
            </div>
            <ToastPrimitive.Close className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
