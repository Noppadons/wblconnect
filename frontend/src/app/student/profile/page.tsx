"use client";

import React, { useEffect, useState } from 'react';
import { User, Award, CheckCircle2, Clock } from 'lucide-react';
import AppShell from '@/components/Layout/AppShell';
import KpiCard from '@/components/Dashboard/KpiCard';
import AiInsights from '@/components/Analytics/AiInsights';
import api, { API_URL } from '@/lib/api';
import NotificationCenter from '@/components/Communication/NotificationCenter';
import Timetable from '@/components/Academic/Timetable';
import { STUDENT_SIDEBAR } from '@/lib/sidebar';

export default function StudentDashboard() {
    const [student, setStudent] = useState<any>(null);
    const [performance, setPerformance] = useState<any>(null);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/students/my-profile').catch(() => ({ data: null }));
                setStudent(res.data);
                if (res.data?.id) {
                    const [perfRes, scheduleRes] = await Promise.all([
                        api.get(`/assessment/performance/${res.data.id}`).catch(() => ({ data: { gpa: 'N/A' } })),
                        api.get(`/schedule/my-schedule`).catch(() => ({ data: [] })),
                    ]);
                    setPerformance(perfRes.data);
                    setSchedules(scheduleRes.data);
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchProfile();
    }, []);

    if (!loading && !student) return <div className="min-h-screen flex items-center justify-center text-text-secondary">ไม่พบข้อมูล</div>;

    return (
        <AppShell role="STUDENT" sidebarItems={STUDENT_SIDEBAR} user={student?.user}
            pageTitle={student ? `สวัสดี, ${student.user?.firstName}` : 'โปรไฟล์'}
            pageSubtitle={student ? `${student.studentCode} • ชั้น ${student.classroom?.grade?.level || '-'}/${student.classroom?.roomNumber || '-'}` : ''}
        >
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* Profile Card */}
                    <div className="card p-5 mb-6">
                        <div className="flex flex-col md:flex-row items-center gap-5">
                            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                {student.user?.avatarUrl ? (
                                    <img src={student.user.avatarUrl.startsWith('http') ? student.user.avatarUrl : `${API_URL}${student.user.avatarUrl}`} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={36} className="text-text-muted" />
                                )}
                            </div>
                            <div className="text-center md:text-left flex-1">
                                <h2 className="text-xl font-bold text-text-primary">{student.user?.firstName} {student.user?.lastName}</h2>
                                <p className="text-sm text-text-muted mt-0.5">รหัส {student.studentCode} • ชั้น {student.classroom?.grade?.level}/{student.classroom?.roomNumber}</p>
                                <p className="text-sm text-text-secondary mt-1">
                                    ครูที่ปรึกษา: {student.classroom?.homeroomTeacher ? `ครู${student.classroom.homeroomTeacher.user?.firstName} ${student.classroom.homeroomTeacher.user?.lastName}` : '-'}
                                </p>
                            </div>
                            <div className="text-center md:text-right">
                                <p className="text-xs text-text-muted">GPA</p>
                                <p className="text-3xl font-bold text-primary">{performance?.gpa || '4.00'}</p>
                            </div>
                        </div>
                    </div>

                    {/* KPI */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        <KpiCard title="การมาเรียน" value="92%" icon={CheckCircle2} color="success" />
                        <KpiCard title="ขาดเรียน" value="2 วัน" icon={Clock} color="warning" />
                        <KpiCard title="เกรดเฉลี่ย" value={performance?.gpa || '4.00'} icon={Award} color="primary" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="card p-0 overflow-hidden">
                                <NotificationCenter targetId={student.classroomId} />
                            </div>
                            <div className="card p-5">
                                <h3 className="text-base font-semibold text-text-primary mb-4">ตารางเรียน</h3>
                                <Timetable schedules={schedules} type="STUDENT" />
                            </div>
                        </div>
                        <div>
                            <AiInsights studentId={student.id} />
                        </div>
                    </div>
                </>
            )}
        </AppShell>
    );
}
