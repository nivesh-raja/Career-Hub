import React from 'react';
import { cn } from '../../utils/cn.js';
import { Inbox } from 'lucide-react';
import { Button } from './Button.js';

interface EmptyStateProps {
    icon?: React.FC<{ className?: string }>;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon = Inbox,
    title,
    description,
    actionLabel,
    onAction,
    className,
}) => {
    return (
        <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-dark-surface mb-5">
                <Icon className="h-7 w-7 text-text-secondary dark:text-secondary-400" />
            </div>
            <h3 className="text-base font-semibold text-text-primary dark:text-secondary-100 mb-1.5">{title}</h3>
            {description && (
                <p className="text-sm text-text-secondary dark:text-secondary-400 max-w-sm leading-relaxed">{description}</p>
            )}
            {actionLabel && onAction && (
                <div className="mt-5">
                    <Button onClick={onAction} size="sm" variant="primary">
                        {actionLabel}
                    </Button>
                </div>
            )}
        </div>
    );
};
