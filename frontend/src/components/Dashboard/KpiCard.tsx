import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: number;
    trendLabel?: string;
    color?: 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'secondary';
}

const colorMap: Record<string, string> = {
    primary: 'bg-blue-50 text-blue-600',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-rose-50 text-rose-600',
    purple: 'bg-violet-50 text-violet-600',
    secondary: 'bg-slate-100 text-slate-600',
};

export default function KpiCard({ title, value, icon: Icon, trend, trendLabel, color = 'primary' }: KpiCardProps) {
    const isPositive = trend !== undefined && trend > 0;

    return (
        <div className="card p-5 hover:shadow-card transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color] || colorMap.primary}`}>
                    <Icon size={20} strokeWidth={1.8} />
                </div>
                {trend !== undefined && (
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <p className="text-sm text-text-secondary font-medium mb-0.5">{title}</p>
            <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-text-primary tracking-tight">{value}</p>
                {trendLabel && <span className="text-xs text-text-muted">{trendLabel}</span>}
            </div>
        </div>
    );
}
