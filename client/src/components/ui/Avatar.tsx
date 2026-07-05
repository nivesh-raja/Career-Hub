import React from 'react';
import { cn } from '../../utils/cn.js';

interface AvatarProps {
    name: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    src?: string;
    className?: string;
    showStatus?: boolean;
    status?: 'online' | 'offline' | 'busy';
}

const sizeClasses = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-xl',
};

const statusSizes = {
    xs: 'h-1.5 w-1.5',
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
    xl: 'h-3.5 w-3.5',
};

const statusColors = {
    online: 'bg-success',
    offline: 'bg-secondary-300',
    busy: 'bg-danger',
};

const bgColors = [
    'bg-primary-100 text-primary-700 dark:bg-primary/20 dark:text-primary-300',
    'bg-accent-100 text-accent-600 dark:bg-accent/20 dark:text-accent-400',
    'bg-success-light text-success-text dark:bg-success/20 dark:text-success',
    'bg-warning-light text-warning-text dark:bg-warning/20 dark:text-warning',
    'bg-danger-light text-danger-text dark:bg-danger/20 dark:text-danger',
];

function getColorFromName(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return bgColors[Math.abs(hash) % bgColors.length];
}

export const Avatar: React.FC<AvatarProps> = ({
    name,
    size = 'md',
    src,
    className,
    showStatus = false,
    status = 'online',
}) => {
    const initials = name
        .split(' ')
        .slice(0, 2)
        .map(n => n.charAt(0).toUpperCase())
        .join('');

    return (
        <div className={cn('relative inline-flex shrink-0', className)}>
            {src ? (
                <img
                    src={src}
                    alt={name}
                    className={cn('rounded-full object-cover', sizeClasses[size])}
                />
            ) : (
                <div
                    className={cn(
                        'rounded-full flex items-center justify-center font-semibold select-none',
                        sizeClasses[size],
                        getColorFromName(name)
                    )}
                >
                    {initials}
                </div>
            )}
            {showStatus && (
                <span
                    className={cn(
                        'absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-dark-card',
                        statusSizes[size],
                        statusColors[status]
                    )}
                />
            )}
        </div>
    );
};
