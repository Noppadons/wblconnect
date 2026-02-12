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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={onClose} />
            <div className={`relative bg-white w-full ${maxWidth} rounded-2xl shadow-modal max-h-[90vh] overflow-y-auto animate-fade-in`}>
                <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">{title}</h2>
                        {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
                    </div>
                    <button onClick={onClose} className="btn-ghost p-2"><X size={20} /></button>
                </div>
                {children}
            </div>
        </div>,
        document.body
    );
}
