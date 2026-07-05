import * as React from 'react';
import { cn } from '../../utils/cn.js';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-text-secondary dark:text-secondary-400 select-none">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary dark:text-secondary-500">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              'flex h-10 w-full rounded-lg border border-border dark:border-dark-border bg-white dark:bg-dark-surface px-3 py-2 text-sm text-text-primary dark:text-secondary-200 placeholder:text-text-secondary/50 dark:placeholder:text-secondary-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/30 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-dark-hover disabled:text-text-secondary/60 transition-all duration-150',
              {
                'border-danger focus:border-danger focus:ring-danger/20 dark:focus:ring-danger/30': error,
                'pl-9': icon,
              },
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <span className="text-xs text-danger font-medium leading-none mt-0.5">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
