import React from 'react';
import { Activity } from 'lucide-react';

export const PredictionEmptyState: React.FC = () => (
    <div className="py-16 text-center space-y-4">
        <div className="flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-dark-surface/60 border border-border/30 flex items-center justify-center">
                <Activity className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
        </div>
        <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-text-primary dark:text-slate-300">
                Not enough historical data
            </h4>
            <p className="text-xs text-text-secondary dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Continue using Career Hub to build enough activity history for predictive analysis.
                Predictive trends require at least 2 weeks of recorded activity.
            </p>
        </div>
    </div>
);