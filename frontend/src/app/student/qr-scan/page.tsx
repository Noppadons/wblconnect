"use client";

import React, { useState } from 'react';
import { QrCode, CheckCircle, XCircle } from 'lucide-react';
import AppShell from '@/components/Layout/AppShell';
import api from '@/lib/api';
import { STUDENT_SIDEBAR } from '@/lib/sidebar';
import { useUser } from '@/lib/useUser';
import { toast } from 'sonner';

export default function StudentQRScanPage() {
    const { user } = useUser();
    const [code, setCode] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ success: boolean; studentName: string; period: number } | null>(null);

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;
        setSubmitting(true);
        setResult(null);
        try {
            const res = await api.post('/qr-attendance/scan', { code: code.trim().toUpperCase() });
            setResult(res.data);
            toast.success('เช็คชื่อสำเร็จ!');
            setCode('');
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'เช็คชื่อไม่สำเร็จ';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppShell role="STUDENT" sidebarItems={STUDENT_SIDEBAR} user={user}
            pageTitle="QR เช็คชื่อ"
            pageSubtitle="กรอกรหัสจากครูเพื่อเช็คชื่อ"
        >
            <div className="max-w-md mx-auto">
                <div className="bg-white rounded-2xl border p-8 text-center">
                    <QrCode className="w-16 h-16 mx-auto mb-6 text-indigo-400" />

                    <form onSubmit={handleScan} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">กรอกรหัสเช็คชื่อ</label>
                            <input
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="เช่น ABC123"
                                maxLength={6}
                                className="w-full text-center text-3xl font-mono font-bold tracking-[0.3em] px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none uppercase"
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submitting || code.length < 4}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {submitting ? 'กำลังเช็คชื่อ...' : 'เช็คชื่อ'}
                        </button>
                    </form>

                    {result && (
                        <div className={`mt-6 p-4 rounded-xl ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            {result.success ? (
                                <>
                                    <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" />
                                    <p className="font-semibold text-green-700">เช็คชื่อสำเร็จ!</p>
                                    <p className="text-sm text-green-600 mt-1">{result.studentName} • คาบ {result.period}</p>
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-10 h-10 mx-auto mb-2 text-red-500" />
                                    <p className="font-semibold text-red-700">เช็คชื่อไม่สำเร็จ</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm text-amber-700 font-medium mb-1">วิธีใช้</p>
                    <ul className="text-sm text-amber-600 space-y-1">
                        <li>1. ขอรหัส 6 หลักจากครูผู้สอน</li>
                        <li>2. กรอกรหัสในช่องด้านบน</li>
                        <li>3. กดปุ่ม &quot;เช็คชื่อ&quot;</li>
                        <li>4. รหัสมีเวลาจำกัด กรุณาเช็คชื่อให้ทันเวลา</li>
                    </ul>
                </div>
            </div>
        </AppShell>
    );
}
