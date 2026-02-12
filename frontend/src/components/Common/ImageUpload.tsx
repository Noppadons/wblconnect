"use client";

import React, { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
                className={`relative group cursor-pointer border-2 border-dashed rounded-xl transition-colors overflow-hidden flex flex-col items-center justify-center text-center p-6 ${aspectClass} ${preview ? 'border-primary/30 bg-primary-light/30' : 'border-border hover:border-primary/40 hover:bg-slate-50'} ${isUploading ? 'pointer-events-none opacity-70' : ''}`}
            >
                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept="image/*" />

                {preview ? (
                    <div className="absolute inset-0 w-full h-full">
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-white text-sm font-medium">เปลี่ยนรูปภาพ</p>
                        </div>
                        <button onClick={removeImage}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white text-text-secondary flex items-center justify-center hover:bg-danger-light hover:text-danger transition-colors shadow-sm z-10">
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 text-text-muted flex items-center justify-center">
                            <Upload size={20} />
                        </div>
                        <p className="text-sm font-medium text-text-primary">เลือกรูปภาพ</p>
                        <p className="text-xs text-text-muted">{description}</p>
                    </div>
                )}

                {isUploading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
                        <Loader2 className="text-primary animate-spin" size={24} />
                    </div>
                )}
            </div>
        </div>
    );
}
