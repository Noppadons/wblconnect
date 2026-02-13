
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    description: string;
    icon: LucideIcon;
}

export default function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="relative mb-6">
                <div className="w-18 h-18 rounded-2xl flex items-center justify-center"
                     style={{ width: 72, height: 72, background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(168,85,247,0.08) 100%)', border: '1px solid rgba(59,130,246,0.12)', boxShadow: '0 0 24px rgba(59,130,246,0.08)' }}>
                    <Icon size={30} strokeWidth={1.5} style={{ color: '#60a5fa' }} />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-pulse"
                     style={{ background: 'linear-gradient(135deg, #3b82f6, #a855f7)', boxShadow: '0 0 8px rgba(59,130,246,0.4)' }} />
            </div>
            <h3 className="text-[17px] font-bold text-text-primary mb-2 tracking-tight">{title}</h3>
            {description && <p className="text-[14px] text-text-secondary max-w-sm leading-relaxed">{description}</p>}
        </div>
    );
}
