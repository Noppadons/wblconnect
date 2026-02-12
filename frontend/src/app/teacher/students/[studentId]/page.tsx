"use client";

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Users, GraduationCap, CheckCircle2, XCircle, Clock, UserCheck, BookOpen, Smile, Frown, MessageSquare } from 'lucide-react';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/Layout/AppShell';
import KpiCard from '@/components/Dashboard/KpiCard';
import { TEACHER_SIDEBAR } from '@/lib/sidebar';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    PRESENT: { label: 'มาเรียน', color: 'text-green-600 bg-green-50' },
    LATE: { label: 'มาสาย', color: 'text-amber-600 bg-amber-50' },
    ABSENT: { label: 'ขาดเรียน', color: 'text-red-600 bg-red-50' },
    LEAVE: { label: 'ลา', color: 'text-blue-600 bg-blue-50' },
};

export default function StudentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const studentId = params.studentId as string;

    const [student, setStudent] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));

        const fetchData = async () => {
            try {
                const [profileRes, statsRes] = await Promise.all([
                    api.get(`/students/profile/${studentId}`),
                    api.get(`/students/stats/${studentId}`)
                ]);
                setStudent(profileRes.data);
                setStats(statsRes.data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [studentId]);

    if (loading) {
        return (
            <AppShell role="TEACHER" sidebarItems={TEACHER_SIDEBAR} user={user} pageTitle="โปรไฟล์นักเรียน">
                <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            </AppShell>
        );
    }

    if (!student) {
        return (
            <AppShell role="TEACHER" sidebarItems={TEACHER_SIDEBAR} user={user} pageTitle="โปรไฟล์นักเรียน">
                <div className="py-16 text-center card">
                    <Users size={40} className="mx-auto text-text-muted mb-3" />
                    <p className="text-text-secondary font-semibold">ไม่พบข้อมูลนักเรียน</p>
                    <button onClick={() => router.back()} className="btn-secondary mt-4"><ArrowLeft size={16} /> กลับ</button>
                </div>
            </AppShell>
        );
    }

    const name = `${student.user?.firstName} ${student.user?.lastName}`;
    const classroom = student.classroom;
    const gpa = student.gpa?.toFixed(2) || '0.00';
    const attendPercent = stats?.percentage?.toFixed(0) || '0';
    const behaviorTotal = student.behaviorLogs?.reduce((sum: number, b: any) => sum + (b.points || 0), 0) || 0;

    return (
        <AppShell role="TEACHER" sidebarItems={TEACHER_SIDEBAR} user={user}
            pageTitle={name}
            pageSubtitle={classroom ? `ชั้น ${classroom.grade?.level}/${classroom.roomNumber} • ${student.studentCode}` : student.studentCode}
            headerActions={
                <button onClick={() => router.back()} className="btn-secondary"><ArrowLeft size={16} /> กลับ</button>
            }
        >
            {/* Profile Header */}
            <div className="card p-5 mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-bold text-text-secondary overflow-hidden shrink-0">
                        {student.user?.avatarUrl ? (
                            <img src={student.user.avatarUrl.startsWith('http') ? student.user.avatarUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${student.user.avatarUrl}`} className="w-full h-full object-cover" alt="" />
                        ) : student.user?.firstName?.[0] || '?'}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">{name}</h2>
                        <p className="text-sm text-text-muted">รหัส: {student.studentCode}</p>
                        {classroom && (
                            <p className="text-sm text-text-muted">
                                ชั้น {classroom.grade?.level}/{classroom.roomNumber}
                                {classroom.homeroomTeacher && ` • ที่ปรึกษา: ครู${classroom.homeroomTeacher.user?.firstName}`}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <KpiCard title="GPA" value={gpa} icon={GraduationCap} color={parseFloat(gpa) >= 3.0 ? 'success' : parseFloat(gpa) < 2.0 ? 'danger' : 'warning'} trendLabel="เกรดเฉลี่ย" />
                <KpiCard title="มาเรียน" value={`${attendPercent}%`} icon={CheckCircle2} color="success" trendLabel={`จาก ${stats?.total || 0} ครั้ง`} />
                <KpiCard title="ขาดเรียน" value={stats?.ABSENT || 0} icon={XCircle} color="danger" trendLabel="ครั้ง" />
                <KpiCard title="คะแนนพฤติกรรม" value={behaviorTotal} icon={behaviorTotal >= 0 ? Smile : Frown} color={behaviorTotal >= 0 ? 'success' : 'danger'} trendLabel="คะแนน" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Attendance History */}
                <div className="card p-5">
                    <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-primary" /> ประวัติการเข้าเรียน (ล่าสุด)
                    </h3>
                    {student.attendance?.length > 0 ? (
                        <div className="space-y-2">
                            {student.attendance.map((a: any) => (
                                <div key={a.id} className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
                                    <div>
                                        <p className="text-sm text-text-primary">{new Date(a.date).toLocaleDateString('th-TH', { dateStyle: 'medium' })}</p>
                                        <p className="text-xs text-text-muted">คาบ {a.period}</p>
                                    </div>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${STATUS_LABELS[a.status]?.color || 'text-text-muted bg-slate-50'}`}>
                                        {STATUS_LABELS[a.status]?.label || a.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-text-muted py-4 text-center">ยังไม่มีข้อมูลการเข้าเรียน</p>
                    )}
                </div>

                {/* Behavior Logs */}
                <div className="card p-5">
                    <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                        <Smile size={16} className="text-primary" /> บันทึกพฤติกรรม (ล่าสุด)
                    </h3>
                    {student.behaviorLogs?.length > 0 ? (
                        <div className="space-y-2">
                            {student.behaviorLogs.map((b: any) => (
                                <div key={b.id} className="flex items-start justify-between py-2 border-b border-border-light last:border-0">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-text-primary">{b.content}</p>
                                        <p className="text-xs text-text-muted">{new Date(b.createdAt).toLocaleDateString('th-TH', { dateStyle: 'medium' })}</p>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ml-2 ${b.type === 'POSITIVE' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                                        {b.points > 0 ? '+' : ''}{b.points}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-text-muted py-4 text-center">ยังไม่มีบันทึกพฤติกรรม</p>
                    )}
                </div>

                {/* Submissions */}
                <div className="card p-5 lg:col-span-2">
                    <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                        <BookOpen size={16} className="text-primary" /> ผลงาน / การบ้าน (ล่าสุด)
                    </h3>
                    {student.submissions?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="px-3 py-2 text-xs font-semibold text-text-secondary">ชื่องาน</th>
                                        <th className="px-3 py-2 text-xs font-semibold text-text-secondary hidden sm:table-cell">วิชา</th>
                                        <th className="px-3 py-2 text-xs font-semibold text-text-secondary">คะแนน</th>
                                        <th className="px-3 py-2 text-xs font-semibold text-text-secondary">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light">
                                    {student.submissions.map((sub: any) => (
                                        <tr key={sub.id}>
                                            <td className="px-3 py-2.5 text-sm text-text-primary font-medium">{sub.assignment?.title}</td>
                                            <td className="px-3 py-2.5 text-xs text-text-muted hidden sm:table-cell">{sub.assignment?.subject?.name}</td>
                                            <td className="px-3 py-2.5 text-sm font-semibold">
                                                {sub.points !== null ? `${sub.points}/${sub.assignment?.maxPoints}` : '-'}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className={`text-xs font-semibold ${sub.status === 'GRADED' ? 'text-green-600' : sub.status === 'SUBMITTED' ? 'text-amber-600' : 'text-text-muted'}`}>
                                                    {sub.status === 'GRADED' ? 'ตรวจแล้ว' : sub.status === 'SUBMITTED' ? 'รอตรวจ' : 'รอส่ง'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-text-muted py-4 text-center">ยังไม่มีผลงาน</p>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
