"use client";

import React from 'react';
import { Clock, BookOpen, User as UserIcon, X } from 'lucide-react';
import type { Schedule } from '@/lib/types';

interface TimetableProps {
    schedules: Schedule[];
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
    'ท': 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    'ค': 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    'ว': 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    'ส': 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    'พ': 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    'ศ': 'bg-pink-500/10 border-pink-500/20 text-pink-400',
    'ง': 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    'อ': 'bg-sky-500/10 border-sky-500/20 text-sky-400',
};

function getSubjectColor(code: string) {
    return SUBJECT_COLORS[code] || 'bg-surface-elevated border-border text-text-primary';
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
                                                <div className={`h-16 rounded-lg border border-dashed flex items-center justify-center ${isBreak ? 'bg-amber-500/10/50 border-amber-500/20/50' : 'border-border-light'}`}>
                                                    {isBreak && <span className="text-[10px] text-amber-400">พัก</span>}
                                                </div>
                                            </td>
                                        );
                                    }

                                    if (period !== sched.periodStart) return null;
                                    const span = sched.periodEnd - sched.periodStart + 1;
                                    const colorClass = getSubjectColor(sched.subject?.code || '');

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
                                                    <p className="text-[11px] font-semibold leading-tight truncate">{sched.subject?.name}</p>
                                                    {type === 'TEACHER' && sched.classroom && (
                                                        <p className="text-[10px] opacity-70 truncate">{sched.classroom?.grade?.level}/{sched.classroom?.roomNumber}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 min-w-0">
                                                    {type === 'STUDENT' && sched.teacher ? (
                                                        <>
                                                            <UserIcon size={10} className="opacity-50 shrink-0" />
                                                            <span className="text-[10px] opacity-70 truncate">ครู{sched.teacher?.user?.firstName}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <BookOpen size={10} className="opacity-50 shrink-0" />
                                                            <span className="text-[10px] opacity-70 truncate">{sched.subject?.code}</span>
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
