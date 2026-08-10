import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

export type TrendDirection = 'UP' | 'DOWN' | 'STABLE' | 'INSUFFICIENT_DATA';

interface TrendIndicatorProps {
    trend: TrendDirection;
    size?: 'xs' | 'sm';
    showLabel?: boolean;
}

const TREND_CONFIG: Record<TrendDirection, {
    icon: React.ComponentType<{ className?: string }>;
    className: string;
    label: string;
}> = {
    UP: {
        icon: TrendingUp,
        className: 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400',
        label: 'UP'
    },
    DOWN: {
        icon: TrendingDown,
        className: 'bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400',
        label: 'DOWN'
    },
    STABLE: {
        icon: Minus,
        className: 'bg-blue-500/10 border border-blue-500/25 text-blue-600 dark:text-blue-400',
        label: 'STABLE'
    },
    INSUFFICIENT_DATA: {
        icon: AlertTriangle,
        className: 'bg-slate-500/10 border border-slate-500/25 text-slate-500 dark:text-slate-400',
        label: 'NO DATA'
    }
};

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
    trend,
    size = 'xs',
    showLabel = true
}) => {
    const config = TREND_CONFIG[trend] ?? TREND_CONFIG.INSUFFICIENT_DATA;
    const Icon = config.icon;

    const sizeClasses = size === 'xs'
        ? 'text-[9px] px-1.5 py-0.5 gap-0.5'
        : 'text-[10px] px-2 py-1 gap-1';

    const iconSize = size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5';

    return (
        <span className={`inline-flex items-center rounded-full font-bold shrink-0 ${config.className} ${sizeClasses}`}>
            <Icon className={iconSize} />
            {showLabel && <span>{config.label}</span>}
        </span>
    );
};