"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import AppShell from '@/components/Layout/AppShell';
import api from '@/lib/api';
import { STUDENT_SIDEBAR } from '@/lib/sidebar';
import { useUser } from '@/lib/useUser';
import type { SchoolEvent, EventType } from '@/lib/types';
import { toast } from 'sonner';

const EVENT_TYPE_MAP: Record<EventType, { label: string; color: string; bg: string }> = {
    HOLIDAY: { label: 'วันหยุด', color: '#f43f5e', bg: 'rgba(244,63,94,0.15)' },
    EXAM: { label: 'สอบ', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
    ACTIVITY: { label: 'กิจกรรม', color: '#22d3ee', bg: 'rgba(34,211,238,0.15)' },
    MEETING: { label: 'ประชุม', color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
    DEADLINE: { label: 'กำหนดส่ง', color: '#fb923c', bg: 'rgba(251,146,60,0.15)' },
    OTHER: { label: 'อื่นๆ', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
};

const DAYS_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const MONTHS_TH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year: number, month: number) { return new Date(year, month, 1).getDay(); }
function formatDate(d: Date) { return d.toISOString().split('T')[0]; }

export default function StudentCalendarPage() {
    const { user } = useUser();
    const [events, setEvents] = useState<SchoolEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const fetchEvents = useCallback(async () => {
        try {
            const res = await api.get('/events', { params: { month: month + 1, year } });
            setEvents(res.data);
        } catch { toast.error('โหลดข้อมูลกิจกรรมไม่สำเร็จ'); }
        finally { setLoading(false); }
    }, [month, year]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToday = () => setCurrentDate(new Date());

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = formatDate(new Date());

    const getEventsForDay = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.filter(e => {
            const start = e.startDate.substring(0, 10);
            const end = e.endDate.substring(0, 10);
            return dateStr >= start && dateStr <= end;
        });
    };

    const handleDayClick = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setSelectedDate(dateStr);
    };

    const selectedDayEvents = selectedDate
        ? events.filter(e => {
            const start = e.startDate.substring(0, 10);
            const end = e.endDate.substring(0, 10);
            return selectedDate >= start && selectedDate <= end;
        })
        : [];

    return (
        <AppShell role="STUDENT" sidebarItems={STUDENT_SIDEBAR} user={user}
            pageTitle="ปฏิทิน"
            pageSubtitle={`${events.length} กิจกรรมในเดือนนี้`}
        >
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-5">
                    <div className="flex items-center gap-3">
                        <button onClick={prevMonth} className="p-2 rounded-lg bg-surface-elevated hover:bg-primary/10 text-text-secondary hover:text-primary transition-colors">
                            <ChevronLeft size={18} />
                        </button>
                        <h2 className="text-lg font-bold text-text-primary min-w-[200px] text-center">
                            {MONTHS_TH[month]} {year + 543}
                        </h2>
                        <button onClick={nextMonth} className="p-2 rounded-lg bg-surface-elevated hover:bg-primary/10 text-text-secondary hover:text-primary transition-colors">
                            <ChevronRight size={18} />
                        </button>
                        <button onClick={goToday} className="text-xs font-semibold text-primary hover:text-primary-hover px-3 py-1.5 rounded-lg bg-primary/10 transition-colors">
                            วันนี้
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {Object.entries(EVENT_TYPE_MAP).map(([key, val]) => (
                            <span key={key} className="flex items-center gap-1.5 text-[11px] font-medium text-text-secondary">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: val.color }} />
                                {val.label}
                            </span>
                        ))}
                    </div>

                    <div className="card p-4">
                        <div className="grid grid-cols-7 gap-px mb-1">
                            {DAYS_TH.map((d, i) => (
                                <div key={i} className={`text-center text-[11px] font-bold py-2 ${i === 0 ? 'text-danger' : 'text-text-muted'}`}>{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-px">
                            {Array.from({ length: firstDay }).map((_, i) => (
                                <div key={`empty-${i}`} className="min-h-[90px] p-1.5 rounded-lg" />
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const dayEvents = getEventsForDay(day);
                                const isToday = dateStr === today;
                                const isSelected = dateStr === selectedDate;
                                return (
                                    <div key={day} onClick={() => handleDayClick(day)}
                                        className={`min-h-[90px] p-1.5 rounded-lg cursor-pointer transition-all border ${isSelected ? 'border-primary bg-primary/5' : isToday ? 'border-primary/30 bg-primary/5' : 'border-transparent hover:bg-surface-elevated'}`}>
                                        <span className={`text-[12px] font-bold inline-flex items-center justify-center w-6 h-6 rounded-full ${isToday ? 'bg-primary text-white' : 'text-text-secondary'}`}>{day}</span>
                                        <div className="mt-0.5 space-y-0.5">
                                            {dayEvents.slice(0, 3).map(e => {
                                                const typeInfo = EVENT_TYPE_MAP[e.type] || EVENT_TYPE_MAP.OTHER;
                                                return (
                                                    <div key={e.id} className="text-[10px] font-medium px-1.5 py-0.5 rounded truncate"
                                                        style={{ background: typeInfo.bg, color: typeInfo.color }}>{e.title}</div>
                                                );
                                            })}
                                            {dayEvents.length > 3 && <span className="text-[10px] text-text-muted">+{dayEvents.length - 3}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {selectedDate && (
                        <div className="card p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                                    <CalendarDays size={16} className="text-primary" />
                                    กิจกรรมวันที่ {new Date(selectedDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </h3>
                                <button onClick={() => setSelectedDate(null)} className="p-1 text-text-muted hover:text-text-primary"><X size={14} /></button>
                            </div>
                            {selectedDayEvents.length === 0 ? (
                                <p className="text-sm text-text-muted py-4 text-center">ไม่มีกิจกรรมในวันนี้</p>
                            ) : (
                                <div className="space-y-2">
                                    {selectedDayEvents.map(e => {
                                        const typeInfo = EVENT_TYPE_MAP[e.type] || EVENT_TYPE_MAP.OTHER;
                                        return (
                                            <div key={e.id} className="flex items-start gap-3 p-3 rounded-xl bg-surface-elevated border border-border">
                                                <div className="w-1 h-full min-h-[40px] rounded-full" style={{ background: typeInfo.color }} />
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: typeInfo.bg, color: typeInfo.color }}>{typeInfo.label}</span>
                                                    <p className="text-sm font-semibold text-text-primary mt-1">{e.title}</p>
                                                    {e.description && <p className="text-xs text-text-secondary mt-0.5">{e.description}</p>}
                                                    <p className="text-[11px] text-text-muted mt-1">
                                                        {new Date(e.startDate).toLocaleDateString('th-TH')} — {new Date(e.endDate).toLocaleDateString('th-TH')}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </AppShell>
    );
}
