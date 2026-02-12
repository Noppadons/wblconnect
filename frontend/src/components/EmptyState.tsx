
import React from 'react';
import { Ghost } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
}

export default function EmptyState({ title, description, icon }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white/50 backdrop-blur-sm rounded-[2.5rem] border border-slate-100 premium-shadow">
            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-6">
                {icon || <Ghost size={40} />}
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
            <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto">
                {description}
            </p>
        </div>
    );
}
