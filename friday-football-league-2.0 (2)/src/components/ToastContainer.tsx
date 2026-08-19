import React from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type?: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2 pointer-events-none no-print">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-slate-900/95 border border-amber-500/40 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl pointer-events-auto flex items-center space-x-2.5 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : toast.type === 'info' ? (
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
