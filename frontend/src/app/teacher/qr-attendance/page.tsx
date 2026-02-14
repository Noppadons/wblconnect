"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { QrCode, Plus, XCircle, Clock, Users } from 'lucide-react';
import AppShell from '@/components/Layout/AppShell';
import Modal from '@/components/Common/Modal';
import api from '@/lib/api';
import { TEACHER_SIDEBAR } from '@/lib/sidebar';
import { useUser } from '@/lib/useUser';
import type { QRAttendanceSession, Classroom } from '@/lib/types';
import { toast } from 'sonner';

function formatTimeLeft(expiresAt: string) {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'หมดอายุ';
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function TeacherQRAttendancePage() {
    const { user } = useUser();
    const [sessions, setSessions] = useState<QRAttendanceSession[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [activeCode, setActiveCode] = useState<string | null>(null);
    const [, setTick] = useState(0);

    const fetchSessions = useCallback(async () => {
        try {
            const res = await api.get('/qr-attendance/sessions');
            setSessions(res.data);
        } catch { toast.error('โหลดข้อมูลไม่สำเร็จ'); }
        finally { setLoading(false); }
    }, []);

    const fetchClassrooms = useCallback(async () => {
        try {
            const res = await api.get('/teacher/my-classrooms');
            setClassrooms(res.data);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { fetchSessions(); fetchClassrooms(); }, [fetchSessions, fetchClassrooms]);

    // Countdown timer
    useEffect(() => {
        const interval = setInterval(() => setTick((t) => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        try {
            const res = await api.post('/qr-attendance/session', {
                classroomId: form.get('classroomId'),
                period: parseInt(form.get('period') as string),
                durationMinutes: parseInt(form.get('duration') as string) || 5,
            });
            toast.success('สร้าง QR Code สำเร็จ');
            setShowModal(false);
            setActiveCode(res.data.code);
            fetchSessions();
        } catch { toast.error('สร้างไม่สำเร็จ'); }
    };

    const handleDeactivate = async (id: string) => {
        try {
            await api.put(`/qr-attendance/session/${id}/deactivate`);
            toast.success('ปิด QR Code สำเร็จ');
            setActiveCode(null);
            fetchSessions();
        } catch { toast.error('ปิดไม่สำเร็จ'); }
    };

    return (
        <AppShell role="TEACHER" sidebarItems={TEACHER_SIDEBAR} user={user}
            pageTitle="QR เช็คชื่อ"
            pageSubtitle={`${sessions.length} เซสชันที่ใช้งานอยู่`}
        >
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                    <Plus className="w-4 h-4" /> สร้าง QR Code
                </button>
            </div>

            {/* Active QR Code Display */}
            {activeCode && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 p-8 mb-6 text-center">
                    <p className="text-sm text-indigo-600 font-medium mb-4">รหัสเช็คชื่อ</p>
                    <div className="text-6xl font-mono font-bold text-indigo-700 tracking-[0.3em] mb-4">
                        {activeCode}
                    </div>
                    <p className="text-sm text-gray-500">ให้นักเรียนกรอกรหัสนี้เพื่อเช็คชื่อ</p>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
            ) : sessions.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <QrCode className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">ยังไม่มี QR Session</p>
                    <p className="text-sm">กดปุ่ม &quot;สร้าง QR Code&quot; เพื่อเริ่มเช็คชื่อ</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sessions.map((s) => {
                        const expired = new Date(s.expiresAt) < new Date();
                        return (
                            <div key={s.id} className={`bg-white rounded-xl border p-5 ${expired ? 'opacity-50' : ''}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-2xl font-mono font-bold text-indigo-700 tracking-widest">{s.code}</span>
                                    {!expired && (
                                        <button onClick={() => handleDeactivate(s.id)}
                                            className="text-red-400 hover:text-red-600 p-1" title="ปิด QR">
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-1 text-sm text-gray-500">
                                    <p className="flex items-center gap-1.5">
                                        <Users className="w-4 h-4" />
                                        {s.classroom?.grade?.level}/{s.classroom?.roomNumber} • คาบ {s.period}
                                    </p>
                                    <p className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        {expired ? (
                                            <span className="text-red-500">หมดอายุแล้ว</span>
                                        ) : (
                                            <span className="text-green-600 font-medium">เหลือ {formatTimeLeft(s.expiresAt)}</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="สร้าง QR เช็คชื่อ">
                <form onSubmit={handleCreate} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ห้องเรียน *</label>
                        <select name="classroomId" required className="w-full px-3 py-2 border rounded-lg text-sm">
                            <option value="">เลือกห้องเรียน</option>
                            {classrooms.map((c) => (
                                <option key={c.id} value={c.id}>{c.grade?.level}/{c.roomNumber}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">คาบเรียน *</label>
                        <select name="period" required className="w-full px-3 py-2 border rounded-lg text-sm">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                                <option key={p} value={p}>{p === 0 ? 'เช้า (โฮมรูม)' : `คาบ ${p}`}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ระยะเวลา (นาที)</label>
                        <select name="duration" defaultValue="5" className="w-full px-3 py-2 border rounded-lg text-sm">
                            <option value="3">3 นาที</option>
                            <option value="5">5 นาที</option>
                            <option value="10">10 นาที</option>
                            <option value="15">15 นาที</option>
                            <option value="30">30 นาที</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm">ยกเลิก</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">สร้าง QR</button>
                    </div>
                </form>
            </Modal>
        </AppShell>
    );
}
