"use client";

import React, { useEffect, useState } from 'react';
import { Clock, Calendar, BookOpen, MapPin } from 'lucide-react';
import AppShell from '@/components/Layout/AppShell';
import api from '@/lib/api';
import Timetable from '@/components/Academic/Timetable';
import { TEACHER_SIDEBAR } from '@/lib/sidebar';

const DAY_NAMES: Record<string, string> = {
    MONDAY: 'จันทร์', TUESDAY: 'อังคาร', WEDNESDAY: 'พุธ', THURSDAY: 'พฤหัสบดี', FRIDAY: 'ศุกร์',
};

const PERIOD_TIMES: Record<number, string> = {
    1: '08:30-09:20', 2: '09:30-10:20', 3: '10:30-11:20', 4: '11:30-12:00',
    5: '12:00-13:20', 6: '13:30-14:20', 7: '14:30-15:20', 8: '15:30-16:20',
};

function getTodayDayOfWeek() {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days[new Date().getDay()];
}

export default function TeacherSchedulePage() {
    const [user, setUser] = useState<any>(null);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));

        const fetchData = async () => {
            try {
                const res = await api.get('/schedule/my-schedule').catch(() => ({ data: [] }));
                setSchedules(res.data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const todayDay = getTodayDayOfWeek();
    const todaySchedules = schedules
        .filter(s => s.dayOfWeek === todayDay)
        .sort((a, b) => a.periodStart - b.periodStart);

    const uniqueClassrooms = new Set(schedules.map(s => s.classroom?.id)).size;

    return (
        <AppShell role="TEACHER" sidebarItems={TEACHER_SIDEBAR} user={user}
            pageTitle="ตารางสอน"
            pageSubtitle={`${schedules.length} คาบ/สัปดาห์ • ${uniqueClassrooms} ห้องเรียน`}
        >
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : schedules.length === 0 ? (
                <div className="py-16 text-center card">
                    <Calendar size={40} className="mx-auto text-text-muted mb-3" />
                    <p className="text-text-secondary font-semibold">ยังไม่มีตารางสอน</p>
                    <p className="text-sm text-text-muted mt-1">กรุณาติดต่อผู้ดูแลระบบเพื่อจัดตารางสอน</p>
                </div>
            ) : (
                <>
                    {/* Today's Schedule */}
                    {todaySchedules.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                                <Clock size={16} className="text-primary" />
                                วันนี้ — วัน{DAY_NAMES[todayDay] || todayDay}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {todaySchedules.map(s => {
                                    const now = new Date();
                                    const hour = now.getHours();
                                    const periodStartHour = [0, 8, 9, 10, 11, 12, 13, 14, 15][s.periodStart] || 0;
                                    const periodEndHour = [0, 9, 10, 11, 12, 13, 14, 15, 16][s.periodEnd] || 0;
                                    const isCurrent = hour >= periodStartHour && hour < periodEndHour;

                                    return (
                                        <div key={s.id} className={`p-3 rounded-xl border-2 transition-all ${isCurrent ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-white'}`}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className={`text-xs font-bold ${isCurrent ? 'text-primary' : 'text-text-muted'}`}>
                                                    คาบ {s.periodStart}{s.periodEnd > s.periodStart ? `-${s.periodEnd}` : ''}
                                                </span>
                                                {isCurrent && (
                                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">ตอนนี้</span>
                                                )}
                                            </div>
                                            <p className="text-sm font-bold text-text-primary truncate">{s.subject?.name}</p>
                                            <div className="flex items-center justify-between mt-1.5">
                                                <span className="text-xs text-text-muted">{PERIOD_TIMES[s.periodStart] || ''}</span>
                                                {s.classroom && (
                                                    <span className="text-xs text-text-muted truncate ml-2 flex items-center gap-0.5">
                                                        <MapPin size={10} /> {s.classroom.grade?.level}/{s.classroom.roomNumber}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {todaySchedules.length === 0 && ['SATURDAY', 'SUNDAY'].includes(todayDay) && (
                        <div className="mb-6 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800 flex items-center gap-2">
                            <Calendar size={16} />
                            วันนี้เป็นวันหยุด ไม่มีคาบสอน
                        </div>
                    )}

                    {/* Full Timetable */}
                    <div className="card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                                <BookOpen size={18} /> ตารางสอนรายสัปดาห์
                            </h3>
                            <span className="badge-primary flex items-center gap-1"><Clock size={12} /> {schedules.length} คาบ</span>
                        </div>
                        <Timetable schedules={schedules} type="TEACHER" />
                    </div>
                </>
            )}
        </AppShell>
    );
}
