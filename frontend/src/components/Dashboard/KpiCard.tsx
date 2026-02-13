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

const neonMap: Record<string, { bg: string; text: string; glow: string }> = {
    primary: { bg: 'rgba(59,130,246,0.1)', text: '#60a5fa', glow: 'rgba(59,130,246,0.15)' },
    success: { bg: 'rgba(34,211,238,0.1)', text: '#22d3ee', glow: 'rgba(34,211,238,0.15)' },
    warning: { bg: 'rgba(251,191,36,0.1)', text: '#fbbf24', glow: 'rgba(251,191,36,0.15)' },
    danger: { bg: 'rgba(244,63,94,0.1)', text: '#f43f5e', glow: 'rgba(244,63,94,0.15)' },
    purple: { bg: 'rgba(168,85,247,0.1)', text: '#a855f7', glow: 'rgba(168,85,247,0.15)' },
    secondary: { bg: 'rgba(148,163,184,0.08)', text: '#94a3b8', glow: 'rgba(148,163,184,0.1)' },
};

export default function KpiCard({ title, value, icon: Icon, trend, trendLabel, color = 'primary' }: KpiCardProps) {
    const isPositive = trend !== undefined && trend > 0;
    const n = neonMap[color] || neonMap.primary;

    return (
        <div className="card-hover group relative overflow-hidden">
            {/* Colored accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-all duration-300 group-hover:w-1.5"
                 style={{ background: `linear-gradient(180deg, ${n.text}, ${n.text}66)`, boxShadow: `0 0 8px ${n.glow}` }} />

            <div className="p-5 pl-5 flex items-center gap-4">
                {/* Left: Text content */}
                <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-text-muted mb-1 truncate">{title}</p>
                    <div className="flex items-baseline gap-2.5">
                        <p className="text-[28px] font-bold text-text-primary leading-none tracking-tight">{value}</p>
                        {trend !== undefined && (
                            <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md ${isPositive ? 'text-success bg-success-light' : 'text-danger bg-danger-light'}`}>
                                {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {Math.abs(trend)}%
                            </span>
                        )}
                    </div>
                    {trendLabel && <p className="text-[11px] text-text-muted mt-1">{trendLabel}</p>}
                </div>

                {/* Right: Icon */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110"
                     style={{ background: n.bg, boxShadow: `0 0 12px ${n.glow}` }}>
                    <Icon size={22} strokeWidth={1.7} style={{ color: n.text }} />
                </div>
            </div>
        </div>
    );
}
