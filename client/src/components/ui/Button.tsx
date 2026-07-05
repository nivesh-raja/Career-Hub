import * as React from 'react';
import { cn } from '../../utils/cn.js';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, icon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:focus:ring-offset-dark-bg disabled:opacity-50 disabled:pointer-events-none rounded-lg select-none',
          {
            // Variants
            'bg-primary text-white hover:bg-primary-hover shadow-subtle hover:shadow-elevated active:scale-[0.98]': variant === 'primary',
            'bg-slate-100 dark:bg-dark-surface text-text-primary dark:text-secondary-200 hover:bg-slate-200 dark:hover:bg-dark-hover': variant === 'secondary',
            'border border-border dark:border-dark-border bg-transparent text-text-primary dark:text-secondary-200 hover:bg-slate-50 dark:hover:bg-dark-hover': variant === 'outline',
            'bg-danger text-white hover:bg-red-600 active:scale-[0.98]': variant === 'danger',
            'bg-transparent text-text-secondary dark:text-secondary-400 hover:text-text-primary dark:hover:text-secondary-200 hover:bg-slate-100 dark:hover:bg-dark-hover': variant === 'ghost',

            // Sizes
            'h-8 px-3 text-xs': size === 'sm',
            'h-10 px-4 py-2 text-sm': size === 'md',
            'h-11 px-6 text-sm font-semibold': size === 'lg',
          },
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-0.5 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {!isLoading && icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
