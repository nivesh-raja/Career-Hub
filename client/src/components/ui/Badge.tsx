import * as React from 'react';
import { cn } from '../../utils/cn.js';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold select-none border border-transparent transition-colors duration-150',
          {
            'bg-primary-light dark:bg-primary/15 text-primary dark:text-primary-300 border-primary/10': variant === 'primary',
            'bg-slate-100 dark:bg-dark-surface text-text-secondary dark:text-secondary-300 border-border dark:border-dark-border': variant === 'secondary',
            'bg-success-light dark:bg-success/15 text-success-text dark:text-success border-success/10': variant === 'success',
            'bg-warning-light dark:bg-warning/15 text-warning-text dark:text-warning border-warning/10': variant === 'warning',
            'bg-danger-light dark:bg-danger/15 text-danger-text dark:text-danger border-danger/10': variant === 'danger',
            'bg-primary-50 dark:bg-primary/10 text-primary-700 dark:text-primary-300 border-primary/10': variant === 'info',
            'bg-accent-light dark:bg-accent/15 text-accent-600 dark:text-accent-400 border-accent/10': variant === 'accent',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
