"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-lg' }: ModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={onClose} />
            <div className={`relative bg-surface w-full ${maxWidth} rounded-2xl shadow-modal max-h-[90vh] overflow-y-auto animate-fade-in-scale border border-border`}>
                <div className="sticky top-0 bg-surface px-6 py-5 flex items-center justify-between z-10 rounded-t-2xl" style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                    <div>
                        <h2 className="text-[16px] font-semibold text-text-primary tracking-tight">{title}</h2>
                        {subtitle && <p className="text-[13px] text-text-muted mt-0.5">{subtitle}</p>}
                    </div>
                    <button onClick={onClose} className="p-2 text-text-muted hover:text-primary rounded-lg transition-colors">
                        <X size={16} />
                    </button>
                </div>
                {children}
            </div>
        </div>,
        document.body
    );
}
