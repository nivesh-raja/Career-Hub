import * as React from 'react';
import { cn } from '../../utils/cn.js';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({
    className,
    variant = 'rectangular',
    width,
    height,
    ...props
}) => {
    return (
        <div
            className={cn(
                'skeleton-shimmer animate-pulse',
                {
                    'rounded-md': variant === 'rectangular',
                    'rounded-full': variant === 'circular',
                    'rounded h-4': variant === 'text',
                },
                className
            )}
            style={{ width, height }}
            {...props}
        />
    );
};

Skeleton.displayName = 'Skeleton';

// Pre-built skeleton patterns
const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
    <div className={cn('p-6 rounded-xl border border-border dark:border-dark-border bg-white dark:bg-dark-card', className)}>
        <div className="flex items-center gap-3 mb-4">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1 space-y-2">
                <Skeleton variant="text" className="w-2/3" />
                <Skeleton variant="text" className="w-1/3 h-3" />
            </div>
        </div>
        <Skeleton className="h-20 w-full mb-3" />
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-4/5 mt-2" />
    </div>
);

const SkeletonTable: React.FC<{ rows?: number; cols?: number; className?: string }> = ({
    rows = 5,
    cols = 4,
    className,
}) => (
    <div className={cn('rounded-lg border border-border dark:border-dark-border overflow-hidden', className)}>
        <div className="bg-slate-50 dark:bg-dark-surface px-4 py-3 flex gap-4">
            {Array.from({ length: cols }).map((_, i) => (
                <Skeleton key={i} variant="text" className="flex-1 h-3" />
            ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="px-4 py-3 flex gap-4 border-t border-border/50 dark:border-dark-border/50">
                {Array.from({ length: cols }).map((_, c) => (
                    <Skeleton key={c} variant="text" className="flex-1 h-3" />
                ))}
            </div>
        ))}
    </div>
);

export { Skeleton, SkeletonCard, SkeletonTable };
