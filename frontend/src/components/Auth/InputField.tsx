"use client";

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon: LucideIcon;
    error?: string;
}

export default function InputField({ label, icon: Icon, error, ...props }: InputFieldProps) {
    return (
        <div className="space-y-1 group">
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors duration-500">
                    <Icon size={14} />
                </div>
                <input
                    {...props}
                    className={`w-full bg-slate-50 border ${error ? 'border-red-100 ring-4 ring-red-50/50' : 'border-slate-100 group-focus-within:border-primary/20 group-focus-within:ring-4 group-focus-within:ring-primary/5'} px-11 py-3.5 rounded-[1.2rem] focus:outline-none transition-all duration-500 font-medium text-slate-600 placeholder:text-slate-300 placeholder:font-normal text-sm`}
                />
            </div>
            {error && <p className="text-[9px] font-bold text-red-400 mt-1 ml-4 flex items-center gap-1.5 uppercase tracking-wide">
                <span className="w-1 h-1 rounded-full bg-red-400"></span>
                {error}
            </p>}
        </div>
    );
}
