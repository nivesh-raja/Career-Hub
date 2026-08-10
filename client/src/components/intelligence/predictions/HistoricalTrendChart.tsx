import React from 'react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend
} from 'recharts';

interface PredictionPoint {
    metric: string;
    currentValue: number;
    predictedValue: number | null;
    predictionStatus: string;
}

interface HistoricalTrendChartProps {
    predictions: PredictionPoint[];
}

const SHORT_LABELS: Record<string, string> = {
    'Assignment Completion': 'Assign.',
    'Platform Engagement': 'Engage.',
    'Academic Health': 'Health',
    'AI Learning Activity': 'AI Learn',
    'AI Adoption': 'AI Adopt',
    'Study Activity': 'Study',
    'Quiz Performance': 'Quiz',
    'Student Engagement': 'Stud. Eng.',
    'Study Material Activity': 'Materials',
    'Teaching Activity': 'Teaching',
    'Faculty Activity': 'Faculty',
    'Platform Activity': 'Platform',
    'Department Activity': 'Depts'
};

export const HistoricalTrendChart: React.FC<HistoricalTrendChartProps> = ({ predictions }) => {
    const validPreds = predictions.filter(p => p.predictionStatus === 'VALID');
    if (validPreds.length === 0) return null;

    const chartData = validPreds.map(pred => ({
        name: SHORT_LABELS[pred.metric] ?? pred.metric,
        Current: pred.currentValue ?? 0,
        Predicted: pred.predictedValue ?? 0
    }));

    return (
        <div className="bg-slate-500/5 dark:bg-dark-surface/50 border border-border/40 dark:border-dark-border/40 p-4 rounded-xl">
            <h4 className="text-[10px] font-bold text-text-secondary dark:text-slate-400 uppercase tracking-widest select-none mb-1">
                Current vs Predicted — Least Squares Linear Trend (Next 7 Days)
            </h4>
            <p className="text-[9px] text-text-secondary dark:text-slate-500 mb-4">
                Solid line = current week activity. Dashed = statistically predicted next week.
                Only metrics with sufficient data are shown.
            </p>
            <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                            <linearGradient id="htcColorCurrent" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="htcColorPredicted" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#64748b" opacity={0.12} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={8} tick={{ fill: '#94a3b8' }} />
                        <YAxis stroke="#64748b" fontSize={8} tick={{ fill: '#94a3b8' }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#0f172a',
                                border: '1px solid #334155',
                                fontSize: 10,
                                borderRadius: 8
                            }}
                            labelStyle={{ color: '#94a3b8', fontWeight: 700 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 9 }} />
                        <Area
                            name="Current Week"
                            type="monotone"
                            dataKey="Current"
                            stroke="#3b82f6"
                            fillOpacity={1}
                            fill="url(#htcColorCurrent)"
                            strokeWidth={2}
                        />
                        <Area
                            name="Predicted (Next 7 Days)"
                            type="monotone"
                            dataKey="Predicted"
                            stroke="#10b981"
                            fillOpacity={1}
                            fill="url(#htcColorPredicted)"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};