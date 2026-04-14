'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { X, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Types ─────────────────────────────────────────────── */
type DialogType = 'confirm' | 'alert' | 'danger';

interface DialogOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: DialogType;
}

interface DialogState extends DialogOptions {
  resolve: (v: boolean) => void;
}

/* ── Context ────────────────────────────────────────────── */
interface DialogCtx {
  confirm: (opts: DialogOptions) => Promise<boolean>;
  alert: (opts: Omit<DialogOptions, 'cancelText'>) => Promise<void>;
}

const DialogContext = createContext<DialogCtx | null>(null);

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used inside DialogProvider');
  return ctx;
}

/* ── Provider ───────────────────────────────────────────── */
export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const confirm = useCallback((opts: DialogOptions) =>
    new Promise<boolean>((resolve) => setDialog({ ...opts, resolve })), []);

  const alert = useCallback(async (opts: Omit<DialogOptions, 'cancelText'>) => {
    await confirm({ ...opts, cancelText: undefined });
  }, [confirm]);

  const handleClose = (result: boolean) => {
    dialog?.resolve(result);
    setDialog(null);
  };

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/25 backdrop-blur-[2px]"
          onClick={() => handleClose(false)}>
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon + Header */}
            <div className="px-5 pt-5 pb-4">
              {dialog.type === 'danger' && (
                <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
              )}
              {dialog.type === 'alert' && (
                <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center mb-3">
                  <Info className="h-5 w-5 text-primary-500" />
                </div>
              )}
              <h3 className="text-base font-semibold text-gray-900">{dialog.title}</h3>
              {dialog.message && (
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{dialog.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex border-t border-gray-100">
              {dialog.cancelText !== undefined && (
                <button
                  onClick={() => handleClose(false)}
                  className="flex-1 py-3.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors border-r border-gray-100"
                >
                  {dialog.cancelText || '취소'}
                </button>
              )}
              <button
                onClick={() => handleClose(true)}
                className={cn(
                  'flex-1 py-3.5 text-sm font-semibold transition-colors',
                  dialog.type === 'danger'
                    ? 'text-red-500 hover:bg-red-50'
                    : 'text-primary-600 hover:bg-primary-50',
                )}
              >
                {dialog.confirmText || '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
