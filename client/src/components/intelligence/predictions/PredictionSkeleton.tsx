import React from 'react';

export const PredictionSkeleton: React.FC = () => (
    <div className="space-y-6 animate-pulse">
        {/* Chart skeleton */}
        <div className="bg-slate-100 dark:bg-dark-surface/50 border border-border/20 rounded-xl h-56" />
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
                <div
                    key={i}
                    className="bg-slate-100 dark:bg-dark-surface/50 border border-border/20 rounded-xl h-44"
                />
            ))}
        </div>
    </div>
);