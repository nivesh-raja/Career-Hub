import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn.js';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    children: React.ReactNode;
}

const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    size = 'md',
    children,
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className={cn(
                            'relative w-full rounded-xl bg-white dark:bg-dark-card border border-border dark:border-dark-border shadow-float overflow-hidden',
                            sizeClasses[size]
                        )}
                    >
                        {/* Header */}
                        {(title || description) && (
                            <div className="flex items-start justify-between px-6 pt-6 pb-2">
                                <div className="flex-1 min-w-0">
                                    {title && (
                                        <h2 className="text-lg font-semibold text-text-primary dark:text-secondary-100 tracking-tight">
                                            {title}
                                        </h2>
                                    )}
                                    {description && (
                                        <p className="text-sm text-text-secondary dark:text-secondary-400 mt-1">
                                            {description}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={onClose}
                                    className="shrink-0 ml-4 p-1.5 rounded-lg text-text-secondary hover:text-text-primary dark:text-secondary-400 dark:hover:text-secondary-200 hover:bg-slate-100 dark:hover:bg-dark-hover transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        {/* Body */}
                        <div className={cn('px-6 pb-6', !title && !description && 'pt-6')}>
                            {!title && !description && (
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-1.5 rounded-lg text-text-secondary hover:text-text-primary dark:text-secondary-400 dark:hover:text-secondary-200 hover:bg-slate-100 dark:hover:bg-dark-hover transition-colors z-10"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
