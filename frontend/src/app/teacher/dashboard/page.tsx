"use client";

import React, { useEffect, useState } from 'react';
import { Users, UserX, X, CheckCircle, BookOpen, Clock, Smile, ClipboardCheck } from 'lucide-react';
import AppShell from '@/components/Layout/AppShell';
import KpiCard from '@/components/Dashboard/KpiCard';
import AiInsights from '@/components/Analytics/AiInsights';
import api from '@/lib/api';
import NotificationCenter from '@/components/Communication/NotificationCenter';
import Timetable from '@/components/Academic/Timetable';
import { TEACHER_SIDEBAR } from '@/lib/sidebar';

export default function TeacherDashboard() {
    const [user, setUser] = useState<any>(null);
    const [warnings, setWarnings] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({ totalStudents: 0, attendanceRate: 0, classroomId: null, className: '' });
    const [loading, setLoading] = useState(true);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));

        const fetchData = async () => {
            try {
                const [warningRes, scheduleRes, statsRes] = await Promise.all([
                    api.get('/assessment/early-warning').catch(() => ({ data: { highAbsence: [] } })),
                    api.get('/schedule/my-schedule').catch(() => ({ data: [] })),
                    api.get('/teacher/stats').catch(() => ({ data: { totalStudents: 0, attendanceRate: 0 } }))
                ]);
                if (warningRes.data?.highAbsence) {
                    setWarnings(warningRes.data.highAbsence.map((s: any) => ({
                        id: s.id,
                        name: s.user ? `${s.user.firstName} ${s.user.lastName}` : 'ไม่ทราบชื่อ',
                        issue: `ขาดเรียน ${s.attendance?.length || 0} ครั้ง`,
                    })));
                }
                setSchedules(scheduleRes.data);
                setStats(statsRes.data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    return (
        <AppShell role="TEACHER" sidebarItems={TEACHER_SIDEBAR} user={user}
            pageTitle={`สวัสดี, ครู${user?.firstName || ''}`}
            pageSubtitle={`วันนี้มี ${schedules.length} คาบสอน • ชั้นที่ปรึกษา ${stats.className || '-'}`}
        >
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* KPI */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <KpiCard title="นักเรียน" value={stats.totalStudents} icon={Users} color="primary" trendLabel="ในที่ปรึกษา" />
                        <KpiCard title="อัตราเข้าเรียน" value={`${stats.attendanceRate}%`} icon={CheckCircle} color="success" trendLabel="ภาคเรียนนี้" />
                        <KpiCard title="คาบสอน/สัปดาห์" value={schedules.length} icon={Clock} color="warning" trendLabel="ตารางปัจจุบัน" />
                        <KpiCard title="แจ้งเตือน" value={warnings.length} icon={UserX} color="danger" trendLabel="นักเรียนเสี่ยง" />
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        <a href="/teacher/attendance" className="card-hover p-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><ClipboardCheck size={18} /></div>
                            <span className="text-sm font-semibold text-text-primary">เช็คชื่อ</span>
                        </a>
                        <a href="/teacher/grading" className="card-hover p-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center"><BookOpen size={18} /></div>
                            <span className="text-sm font-semibold text-text-primary">คะแนน</span>
                        </a>
                        <a href="/teacher/students" className="card-hover p-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><Users size={18} /></div>
                            <span className="text-sm font-semibold text-text-primary">นักเรียน</span>
                        </a>
                        <a href="/teacher/behavior" className="card-hover p-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center"><Smile size={18} /></div>
                            <span className="text-sm font-semibold text-text-primary">พฤติกรรม</span>
                        </a>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Schedule + Warnings */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="card p-5">
                                <h3 className="text-base font-semibold text-text-primary mb-4">ตารางสอนรายสัปดาห์</h3>
                                <Timetable schedules={schedules} type="TEACHER" />
                            </div>

                            {warnings.length > 0 && (
                                <div className="card p-5">
                                    <h3 className="text-base font-semibold text-text-primary mb-3">นักเรียนที่ต้องดูแล</h3>
                                    <div className="space-y-2">
                                        {warnings.map((w, i) => (
                                            <div key={i} onClick={() => setSelectedStudentId(w.id)}
                                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                                                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0"><UserX size={16} /></div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-text-primary group-hover:text-primary truncate">{w.name}</p>
                                                    <p className="text-xs text-text-muted">{w.issue}</p>
                                                </div>
                                                <span className="badge-danger text-xs">เสี่ยง</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Notifications */}
                        <div>
                            <div className="card p-0 overflow-hidden">
                                <NotificationCenter />
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* AI Modal */}
            {selectedStudentId && (
                <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="absolute inset-0" onClick={() => setSelectedStudentId(null)} />
                    <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-modal max-h-[85vh] overflow-y-auto animate-fade-in">
                        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-10">
                            <h2 className="text-lg font-bold text-text-primary">AI Insights</h2>
                            <button onClick={() => setSelectedStudentId(null)} className="btn-ghost p-2"><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <AiInsights studentId={selectedStudentId} />
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
}
