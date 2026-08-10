import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card.js';
import { TrendIndicator, TrendDirection } from './TrendIndicator.js';

interface HistoricalPoint {
    period: string;
    value: number;
}

export interface PredictionData {
    metric: string;
    category: string;
    description: string;
    currentValue: number;
    predictedValue: number | null;
    trend: TrendDirection;
    predictionHorizon: string;
    predictionStatus: 'VALID' | 'INSUFFICIENT_DATA';
    historicalPoints: HistoricalPoint[];
    method: string;
    lastUpdated: string;
}

interface PredictionCardProps {
    pred: PredictionData;
}

const METHOD_LABEL: Record<string, string> = {
    linear_trend: 'Linear Trend (OLS)',
    weighted_moving_average: 'Weighted MA',
    insufficient_observations: 'N/A'
};

const CATEGORY_COLOR: Record<string, string> = {
    academic: 'text-blue-600 dark:text-blue-400',
    study: 'text-violet-600 dark:text-violet-400',
    adoption: 'text-amber-600 dark:text-amber-400',
    engagement: 'text-emerald-600 dark:text-emerald-400',
    health: 'text-rose-600 dark:text-rose-400',
    content: 'text-cyan-600 dark:text-cyan-400',
    activity: 'text-indigo-600 dark:text-indigo-400',
    department: 'text-orange-600 dark:text-orange-400'
};

export const PredictionCard: React.FC<PredictionCardProps> = ({ pred }) => {
    const isInsufficient = pred.predictionStatus === 'INSUFFICIENT_DATA';
    const categoryColor = CATEGORY_COLOR[pred.category] ?? 'text-slate-500';

    return (
        <Card className="bg-white/40 dark:bg-dark-card/30 border border-border dark:border-dark-border hover:shadow-subtle transition-all">
            <CardContent className="p-4 space-y-3 text-xs flex flex-col justify-between h-full min-h-[200px]">

                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <span className="font-bold text-text-primary dark:text-gray-300 block truncate">{pred.metric}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${categoryColor}`}>
                            {pred.category}
                        </span>
                    </div>
                    <TrendIndicator trend={pred.trend} size="xs" showLabel />
                </div>

                {/* Values or Insufficient State */}
                {isInsufficient ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-4 bg-slate-500/5 dark:bg-dark-surface/30 rounded-lg border border-border/20">
                        <AlertTriangle className="h-5 w-5 text-amber-500 mb-2" />
                        <span className="text-[10px] text-text-secondary dark:text-slate-400 font-semibold block">
                            Insufficient Data
                        </span>
                        <p className="text-[9px] text-text-secondary dark:text-slate-500 mt-1 px-2 leading-relaxed">
                            Continue using Career Hub to build activity history for predictive analysis.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Current → Predicted */}
                        <div className="flex items-baseline justify-between pt-1 gap-3">
                            <div>
                                <span className="text-[10px] text-text-secondary dark:text-slate-500 block mb-0.5">Current</span>
                                <span className="text-2xl font-extrabold text-primary dark:text-primary-300">
                                    {pred.currentValue}
                                </span>
                            </div>
                            <div className="text-center text-slate-400 dark:text-slate-600 text-lg font-light">→</div>
                            <div className="text-right">
                                <span className="text-[10px] text-text-secondary dark:text-slate-500 block mb-0.5">Predicted</span>
                                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                    {pred.predictedValue}
                                </span>
                            </div>
                        </div>

                        {/* 4-week sparkline */}
                        {pred.historicalPoints && pred.historicalPoints.length > 0 && (
                            <div className="space-y-1">
                                <span className="text-[9px] text-text-secondary dark:text-slate-500 font-semibold">
                                    Historical ({pred.historicalPoints.length}-week)
                                </span>
                                <div className="flex items-end gap-1 h-8">
                                    {pred.historicalPoints.map((hp, hIdx) => {
                                        const maxVal = Math.max(...pred.historicalPoints.map(p => p.value), 1);
                                        const height = Math.max(3, (hp.value / maxVal) * 32);
                                        const isLast = hIdx === pred.historicalPoints.length - 1;
                                        return (
                                            <div
                                                key={hIdx}
                                                className="flex-1 flex flex-col items-center gap-0.5"
                                                title={`${hp.period}: ${hp.value}`}
                                            >
                                                <div
                                                    className={`w-full rounded-t-sm transition-all ${isLast
                                                        ? 'bg-primary/60 dark:bg-primary-400/50'
                                                        : 'bg-primary/25 dark:bg-primary-400/15'
                                                        }`}
                                                    style={{ height: `${height}px` }}
                                                />
                                                <span className="text-[7px] text-text-secondary dark:text-slate-500">{hp.value}</span>
                                            </div>
                                        );
                                    })}
                                    {/* Predicted bar (dashed style via opacity) */}
                                    <div className="flex-1 flex flex-col items-center gap-0.5" title={`Predicted: ${pred.predictedValue}`}>
                                        <div
                                            className="w-full rounded-t-sm border-t-2 border-dashed border-emerald-500/60 bg-emerald-500/10 dark:bg-emerald-500/5"
                                            style={{
                                                height: `${Math.max(3, ((pred.predictedValue ?? 0) / Math.max(...pred.historicalPoints.map(p => p.value), pred.predictedValue ?? 1, 1)) * 32)}px`
                                            }}
                                        />
                                        <span className="text-[7px] text-emerald-600 dark:text-emerald-400 font-bold">{pred.predictedValue}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Footer */}
                <div className="pt-1.5 border-t border-border/20 space-y-1">
                    <p className="text-[9px] text-text-secondary dark:text-slate-500 leading-relaxed line-clamp-2">
                        {pred.description}
                    </p>
                    <div className="flex items-center justify-between text-[8px] text-text-secondary dark:text-slate-500 font-semibold">
                        <span className="uppercase tracking-wider">
                            {pred.predictionHorizon === '7_DAYS' ? 'Next 7 Days' :
                                pred.predictionHorizon === '30_DAYS' ? 'Next 30 Days' :
                                    pred.predictionHorizon}
                        </span>
                        <span className="italic">
                            {METHOD_LABEL[pred.method] ?? pred.method}
                        </span>
                    </div>
                </div>

            </CardContent>
        </Card>
    );
};