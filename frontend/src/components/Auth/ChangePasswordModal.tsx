"use client";

import React, { useState } from 'react';
import Modal from '../Common/Modal';
import api from '@/lib/api';
import { toast } from 'sonner';
import { KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('รหัสผ่านใหม่ไม่ตรงกัน');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
            return;
        }

        setLoading(true);
        try {
            await api.patch('/users/change-password', {
                oldPassword,
                newPassword,
            });
            toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="เปลี่ยนรหัสผ่าน"
            subtitle="เพื่อความปลอดภัยกรุณาใช้รหัสผ่านที่คาดเดาได้ยาก"
        >
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="label">รหัสผ่านเดิม</label>
                        <input
                            type={showPasswords ? "text" : "password"}
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="input-field"
                            placeholder="ป้อนรหัสผ่านปัจจุบัน"
                            required
                        />
                    </div>

                    <div className="border-t border-border/30" />

                    <div className="space-y-2">
                        <label className="label">รหัสผ่านใหม่</label>
                        <input
                            type={showPasswords ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="input-field"
                            placeholder="อย่างน้อย 6 ตัวอักษร"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="label">ยืนยันรหัสผ่านใหม่</label>
                        <input
                            type={showPasswords ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="input-field"
                            placeholder="ป้อนรหัสผ่านใหม่อีกครั้ง"
                            required
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="flex items-center gap-2 text-[13px] text-text-muted hover:text-text-secondary transition-colors duration-200"
                    >
                        {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
                        {showPasswords ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    </button>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-secondary flex-1 h-12"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary flex-[2] h-12 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <KeyRound size={18} />
                        )}
                        บันทึกรหัสผ่านใหม่
                    </button>
                </div>
            </form>
        </Modal>
    );
}
