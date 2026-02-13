"use client";

import React, { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { API_URL } from '@/lib/api';
import { normalizeUrl } from '@/lib/url';

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    label?: string;
    description?: string;
    className?: string;
    aspectRatio?: 'square' | 'video' | 'any';
}

export default function ImageUpload({
    value,
    onChange,
    label = "อัปโหลดรูปภาพ",
    description = "รองรับ PNG, JPG, WebP (สูงสุด 5MB)",
    className,
    aspectRatio = 'square'
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(value || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_URL}/upload/image`, {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            let data: any = {};
            try {
                const text = await response.text();
                data = text ? JSON.parse(text) : {};
            } catch {
                throw new Error(`เซิร์ฟเวอร์ตอบกลับผิดปกติ (${response.status})`);
            }

            if (!response.ok) {
                const msg = data.message || (Array.isArray(data.message) ? data.message.join(', ') : null) || `อัปโหลดไม่สำเร็จ (${response.status})`;
                throw new Error(msg);
            }

            onChange(data.url);
            toast.success('อัปโหลดรูปภาพสำเร็จ');
        } catch (err: any) {
            console.error('Upload error:', err);
            toast.error(err.message || 'ไม่สามารถอัปโหลดรูปภาพได้');
            setPreview(value || null);
        } finally {
            setIsUploading(false);
        }
    };

    const removeImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(null);
        onChange("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const aspectClass = aspectRatio === 'square' ? 'aspect-square' : aspectRatio === 'video' ? 'aspect-video' : '';

    return (
        <div className={`space-y-2 ${className || ''}`}>
            {label && <label className="label">{label}</label>}

            <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative group cursor-pointer border-2 border-dashed rounded-2xl transition-all duration-200 overflow-hidden flex flex-col items-center justify-center text-center p-8 ${aspectClass} ${preview ? 'border-primary/25 bg-primary-light/20' : 'border-border/60 hover:border-primary/30 hover:bg-secondary/50'} ${isUploading ? 'pointer-events-none opacity-70' : ''}`}
            >
                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept="image/*" />

                {preview ? (
                    <div className="absolute inset-0 w-full h-full">
                        <img src={normalizeUrl(preview)} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                            <p className="text-white text-sm font-semibold">เปลี่ยนรูปภาพ</p>
                        </div>
                        <button onClick={removeImage}
                            className="absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center hover:bg-danger-light hover:text-danger transition-all duration-200 z-10"
                            style={{ background: 'rgba(17,24,39,0.8)', color: '#94a3b8' }}>
                            <X size={15} />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-secondary text-text-muted flex items-center justify-center">
                            <Upload size={20} strokeWidth={1.7} />
                        </div>
                        <p className="text-[14px] font-semibold text-text-primary">เลือกรูปภาพ</p>
                        <p className="text-[12px] text-text-muted">{description}</p>
                    </div>
                )}

                {isUploading && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20">
                        <Loader2 className="text-primary animate-spin" size={22} />
                    </div>
                )}
            </div>
        </div>
    );
}
