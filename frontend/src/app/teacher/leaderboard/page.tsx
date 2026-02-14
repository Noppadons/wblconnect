"use client";

import React, { useEffect, useState } from 'react';
import { Trophy, ClipboardCheck, Smile, GraduationCap, FileText, User } from 'lucide-react';
import AppShell from '@/components/Layout/AppShell';
import api from '@/lib/api';
import { TEACHER_SIDEBAR } from '@/lib/sidebar';
import { useUser } from '@/lib/useUser';
import { toast } from 'sonner';

type TabKey = 'attendance' | 'behavior' | 'gpa' | 'submissions';

const TABS: { key: TabKey; label: string; icon: any; color: string; bg: string }[] = [
    { key: 'attendance', label: 'เข้าเรียน', icon: ClipboardCheck, color: '#22d3ee', bg: 'rgba(34,211,238,0.12)' },
    { key: 'behavior', label: 'พฤติกรรม', icon: Smile, color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
    { key: 'gpa', label: 'เกรดเฉลี่ย', icon: GraduationCap, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
    { key: 'submissions', label: 'ส่งงาน', icon: FileText, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
];

const RANK_COLORS: Record<number, { bg: string; text: string; border: string }> = {
    1: { bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)', text: '#ffffff', border: 'rgba(251,191,36,0.4)' },
    2: { bg: 'linear-gradient(135deg, #94a3b8, #64748b)', text: '#ffffff', border: 'rgba(148,163,184,0.4)' },
    3: { bg: 'linear-gradient(135deg, #fb923c, #ea580c)', text: '#ffffff', border: 'rgba(251,146,60,0.4)' },
};

export default function TeacherLeaderboardPage() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<TabKey>('attendance');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/leaderboard/${activeTab}`, { params: { limit: 20 } });
                setData(res.data);
            } catch { toast.error('โหลดข้อมูลไม่สำเร็จ'); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [activeTab]);

    const getValueLabel = (item: any): string => {
        switch (activeTab) {
            case 'attendance': return `${item.attendanceRate}%`;
            case 'behavior': return `${item.totalPoints} คะแนน`;
            case 'gpa': return `GPA ${item.gpa?.toFixed(2)}`;
            case 'submissions': return `${item.avgScore} คะแนนเฉลี่ย`;
            default: return '';
        }
    };

    const getSubLabel = (item: any): string => {
        switch (activeTab) {
            case 'attendance': return `${item.presentDays}/${item.totalDays} วัน`;
            case 'behavior': return `+${item.positiveCount} / -${item.negativeCount}`;
            case 'gpa': return '';
            case 'submissions': return `${item.onTimeSubmissions}/${item.totalSubmissions} งาน`;
            default: return '';
        }
    };

    const activeTabInfo = TABS.find(t => t.key === activeTab)!;

    return (
        <AppShell role="TEACHER" sidebarItems={TEACHER_SIDEBAR} user={user}
            pageTitle="ลีดเดอร์บอร์ด"
            pageSubtitle="จัดอันดับนักเรียนดีเด่น"
        >
            <div className="space-y-5">
                <div className="flex gap-2">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all ${isActive ? 'text-white shadow-lg' : 'bg-surface-elevated text-text-secondary hover:text-text-primary'}`}
                                style={isActive ? { background: tab.color, boxShadow: `0 4px 16px ${tab.bg}` } : {}}>
                                <Icon size={15} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : data.length === 0 ? (
                    <div className="py-16 text-center card">
                        <Trophy size={40} className="mx-auto text-text-muted mb-3" />
                        <p className="text-text-secondary font-semibold">ยังไม่มีข้อมูล</p>
                        <p className="text-sm text-text-muted mt-1">ข้อมูลจะแสดงเมื่อมีการบันทึกกิจกรรมของนักเรียน</p>
                    </div>
                ) : (
                    <>
                        {data.length >= 3 && (
                            <div className="grid grid-cols-3 gap-4 mb-2">
                                {[1, 0, 2].map(idx => {
                                    const rank = idx === 1 ? 1 : idx === 0 ? 2 : 3;
                                    const actualItem = data[rank - 1];
                                    if (!actualItem) return null;
                                    const rankStyle = RANK_COLORS[rank];
                                    const isFirst = rank === 1;
                                    return (
                                        <div key={actualItem.id}
                                            className={`card p-5 text-center relative ${isFirst ? 'transform -translate-y-2' : ''}`}
                                            style={{ borderColor: rankStyle.border }}>
                                            <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center text-sm font-black"
                                                style={{ background: rankStyle.bg, color: rankStyle.text, boxShadow: `0 4px 12px ${rankStyle.border}` }}>
                                                {rank}
                                            </div>
                                            <div className="w-12 h-12 rounded-full mx-auto mb-2 bg-surface-elevated border-2 border-border flex items-center justify-center overflow-hidden">
                                                {actualItem.avatarUrl ? <img src={actualItem.avatarUrl} alt="" className="w-full h-full object-cover" /> : <User size={20} className="text-text-muted" />}
                                            </div>
                                            <p className="text-sm font-bold text-text-primary truncate">{actualItem.name}</p>
                                            <p className="text-[11px] text-text-muted">{actualItem.classroom}</p>
                                            <p className="text-base font-black mt-2" style={{ color: activeTabInfo.color }}>{getValueLabel(actualItem)}</p>
                                            {getSubLabel(actualItem) && <p className="text-[10px] text-text-muted mt-0.5">{getSubLabel(actualItem)}</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="card overflow-hidden">
                            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                                <Trophy size={16} style={{ color: activeTabInfo.color }} />
                                <span className="text-sm font-bold text-text-primary">อันดับทั้งหมด</span>
                            </div>
                            <div className="divide-y divide-border">
                                {data.map(item => {
                                    const rankStyle = RANK_COLORS[item.rank];
                                    return (
                                        <div key={item.id} className="flex items-center gap-4 px-5 py-3 hover:bg-surface-elevated/50 transition-colors">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black shrink-0"
                                                style={rankStyle ? { background: rankStyle.bg, color: rankStyle.text } : { background: 'rgba(148,163,184,0.1)', color: '#94a3b8' }}>
                                                {item.rank}
                                            </div>
                                            <div className="w-9 h-9 rounded-full bg-surface-elevated border border-border flex items-center justify-center overflow-hidden shrink-0">
                                                {item.avatarUrl ? <img src={item.avatarUrl} alt="" className="w-full h-full object-cover" /> : <User size={16} className="text-text-muted" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-text-primary truncate">{item.name}</p>
                                                <p className="text-[11px] text-text-muted">{item.classroom} • {item.studentCode}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-bold" style={{ color: activeTabInfo.color }}>{getValueLabel(item)}</p>
                                                {getSubLabel(item) && <p className="text-[10px] text-text-muted">{getSubLabel(item)}</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AppShell>
    );
}
