"use client";

import React from 'react';
import { Clock, BookOpen, User as UserIcon, X } from 'lucide-react';

interface ScheduleItem {
    id: string;
    dayOfWeek: string;
    periodStart: number;
    periodEnd: number;
    subject: { name: string; code: string };
    teacher?: { user: { firstName: string } };
    classroom?: { grade: { level: string }; roomNumber: string };
}

interface TimetableProps {
    schedules: ScheduleItem[];
    type: 'STUDENT' | 'TEACHER';
    isAdmin?: boolean;
    onDelete?: (id: string) => void;
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const PERIOD_TIMES: Record<number, string> = {
    1: '08:30', 2: '09:30', 3: '10:30', 4: '11:30',
    5: '12:00', 6: '13:30', 7: '14:30', 8: '15:30',
};

const dayMap: Record<string, string> = {
    MONDAY: 'จ.', TUESDAY: 'อ.', WEDNESDAY: 'พ.', THURSDAY: 'พฤ.', FRIDAY: 'ศ.',
};

const dayMapFull: Record<string, string> = {
    MONDAY: 'จันทร์', TUESDAY: 'อังคาร', WEDNESDAY: 'พุธ', THURSDAY: 'พฤหัสบดี', FRIDAY: 'ศุกร์',
};

const SUBJECT_COLORS: Record<string, string> = {
    'ท': 'bg-blue-50 border-blue-200 text-blue-700',
    'ค': 'bg-violet-50 border-violet-200 text-violet-700',
    'ว': 'bg-emerald-50 border-emerald-200 text-emerald-700',
    'ส': 'bg-amber-50 border-amber-200 text-amber-700',
    'พ': 'bg-rose-50 border-rose-200 text-rose-700',
    'ศ': 'bg-pink-50 border-pink-200 text-pink-700',
    'ง': 'bg-orange-50 border-orange-200 text-orange-700',
    'อ': 'bg-sky-50 border-sky-200 text-sky-700',
};

function getSubjectColor(code: string) {
    return SUBJECT_COLORS[code] || 'bg-slate-50 border-slate-200 text-slate-700';
}

export default function Timetable({ schedules, type, isAdmin, onDelete }: TimetableProps) {
    const getScheduleAt = (day: string, period: number) => {
        return schedules.find(s => s.dayOfWeek === day && s.periodStart <= period && s.periodEnd >= period);
    };

    return (
        <div className="overflow-x-auto scrollbar-hide">
            <div className="min-w-[800px]">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="w-16 p-2 text-xs font-medium text-text-muted text-center">
                                <Clock size={14} className="mx-auto" />
                            </th>
                            {PERIODS.map(p => (
                                <th key={p} className="p-2 text-center">
                                    <div className="text-xs font-semibold text-text-secondary">คาบ {p}</div>
                                    <div className="text-[10px] text-text-muted">{PERIOD_TIMES[p]}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {DAYS.map(day => (
                            <tr key={day} className="border-t border-border-light">
                                <td className="p-2 text-center">
                                    <div className="text-xs font-semibold text-text-primary">{dayMap[day]}</div>
                                    <div className="text-[10px] text-text-muted hidden sm:block">{dayMapFull[day]}</div>
                                </td>
                                {PERIODS.map(period => {
                                    const sched = getScheduleAt(day, period);
                                    const isBreak = period === 5;

                                    if (!sched) {
                                        return (
                                            <td key={period} className="p-1">
                                                <div className={`h-16 rounded-lg border border-dashed flex items-center justify-center ${isBreak ? 'bg-amber-50/50 border-amber-200/50' : 'border-border-light'}`}>
                                                    {isBreak && <span className="text-[10px] text-amber-400">พัก</span>}
                                                </div>
                                            </td>
                                        );
                                    }

                                    if (period !== sched.periodStart) return null;
                                    const span = sched.periodEnd - sched.periodStart + 1;
                                    const colorClass = getSubjectColor(sched.subject.code);

                                    return (
                                        <td key={period} colSpan={span} className="p-1">
                                            <div className={`h-16 rounded-lg border p-2 flex flex-col justify-between relative group ${colorClass}`}>
                                                {isAdmin && (
                                                    <button onClick={() => onDelete?.(sched.id)}
                                                        className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] z-10">
                                                        <X size={10} />
                                                    </button>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-semibold leading-tight truncate">{sched.subject.name}</p>
                                                    {type === 'TEACHER' && sched.classroom && (
                                                        <p className="text-[10px] opacity-70 truncate">{sched.classroom.grade.level}/{sched.classroom.roomNumber}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 min-w-0">
                                                    {type === 'STUDENT' && sched.teacher ? (
                                                        <>
                                                            <UserIcon size={10} className="opacity-50 shrink-0" />
                                                            <span className="text-[10px] opacity-70 truncate">ครู{sched.teacher.user.firstName}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <BookOpen size={10} className="opacity-50 shrink-0" />
                                                            <span className="text-[10px] opacity-70 truncate">{sched.subject.code}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
