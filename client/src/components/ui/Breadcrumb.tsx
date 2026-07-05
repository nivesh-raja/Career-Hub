import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn.js';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
    return (
        <nav className={cn('flex items-center gap-1 text-sm', className)} aria-label="Breadcrumb">
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                return (
                    <React.Fragment key={index}>
                        {index > 0 && (
                            <ChevronRight className="h-3.5 w-3.5 text-text-secondary/50 dark:text-secondary-500 shrink-0" />
                        )}
                        {isLast ? (
                            <span className="font-medium text-text-primary dark:text-secondary-200 truncate">
                                {item.label}
                            </span>
                        ) : (
                            <span className="text-text-secondary dark:text-secondary-400 hover:text-text-primary dark:hover:text-secondary-200 transition-colors truncate cursor-default">
                                {item.label}
                            </span>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};
