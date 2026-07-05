import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn.js';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType, duration?: number) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const icons: Record<ToastType, React.FC<{ className?: string }>> = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const styles: Record<ToastType, string> = {
    success: 'bg-success-50 dark:bg-success/10 border-success/20 text-success-text dark:text-success',
    error: 'bg-danger-50 dark:bg-danger/10 border-danger/20 text-danger-text dark:text-danger',
    warning: 'bg-warning-50 dark:bg-warning/10 border-warning/20 text-warning-text dark:text-warning',
    info: 'bg-primary-50 dark:bg-primary/10 border-primary/20 text-primary-700 dark:text-primary-300',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: ToastType = 'success', duration = 4000) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setToasts(prev => [...prev, { id, message, type, duration }]);
        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }
    }, [removeToast]);

    const contextValue: ToastContextType = {
        toast: addToast,
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        warning: (msg) => addToast(msg, 'warning'),
        info: (msg) => addToast(msg, 'info'),
    };

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map(t => {
                        const Icon = icons[t.type];
                        return (
                            <motion.div
                                key={t.id}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 80, scale: 0.95 }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                                className={cn(
                                    'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border shadow-elevated text-sm font-medium',
                                    styles[t.type]
                                )}
                            >
                                <Icon className="h-5 w-5 shrink-0 mt-0.5" />
                                <span className="flex-1 leading-snug">{t.message}</span>
                                <button
                                    onClick={() => removeToast(t.id)}
                                    className="shrink-0 p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
