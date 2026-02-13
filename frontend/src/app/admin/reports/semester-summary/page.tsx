"use client";

import React, { useEffect, useState } from 'react';
import { Users, GraduationCap, TrendingUp, AlertTriangle, ChevronDown, Search, Filter, Download, Clock, Smile, FileText, ArrowUpDown } from 'lucide-react';
import api, { API_URL } from '@/lib/api';
import { normalizeUrl } from '@/lib/url';
import { toast } from 'sonner';
import AppShell from '@/components/Layout/AppShell';
import KpiCard from '@/components/Dashboard/KpiCard';
import { ADMIN_SIDEBAR } from '@/lib/sidebar';

type SortKey = 'gpa' | 'attendance' | 'behavior' | 'risk';

export default function SemesterSummaryPage() {
    const [data, setData] = useState<any>(null);
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [filterClassroom, setFilterClassroom] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [viewTab, setViewTab] = useState<'all' | 'at-risk'>('all');
    const [sortKey, setSortKey] = useState<SortKey>('gpa');
    const [sortAsc, setSortAsc] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchClassrooms();
    }, []);

    useEffect(() => {
        fetchSummary();
    }, [filterClassroom]);

    const fetchClassrooms = async () => {
        try { const res = await api.get('/admin/classrooms'); setClassrooms(res.data); }
        catch (err) { console.error(err); }
    };

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const params = filterClassroom ? `?classroomId=${filterClassroom}` : '';
            const res = await api.get(`/admin/semester-summary${params}`);
            setData(res.data);
        } catch (err) { console.error(err); toast.error('ไม่สามารถโหลดข้อมูลได้'); }
        finally { setLoading(false); }
    };

    const handleSort = (key: SortKey) => {
        if (sortKey === key) setSortAsc(!sortAsc);
        else { setSortKey(key); setSortAsc(true); }
    };

    // Filter & sort students
    const students = data?.students || [];
    const filtered = students
        .filter((s: any) => {
            const matchSearch = `${s.firstName} ${s.lastName} ${s.studentCode}`.toLowerCase().includes(searchTerm.toLowerCase());
            const matchTab = viewTab === 'all' || s.isAtRisk;
            return matchSearch && matchTab;
        })
        .sort((a: any, b: any) => {
            let diff = 0;
            if (sortKey === 'gpa') diff = a.gpa - b.gpa;
            else if (sortKey === 'attendance') diff = a.attendance.rate - b.attendance.rate;
            else if (sortKey === 'behavior') diff = a.behavior.score - b.behavior.score;
            else if (sortKey === 'risk') diff = (b.risks.length) - (a.risks.length);
            return sortAsc ? diff : -diff;
        });

    const overview = data?.overview;

    return (
        <AppShell role="ADMIN" sidebarItems={ADMIN_SIDEBAR} user={user} pageTitle="สรุปผลภาคเรียน"
            pageSubtitle={overview ? `นักเรียน ${overview.totalStudents} คน` : 'กำลังโหลด...'}
        >
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : data && (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        <KpiCard title="นักเรียนทั้งหมด" value={overview.totalStudents} icon={Users} color="primary" trendLabel="คน" />
                        <KpiCard title="GPA เฉลี่ย" value={overview.avgGpa} icon={GraduationCap} color="success" trendLabel="ทั้งหมด" />
                        <KpiCard title="อัตราเข้าเรียน" value={`${overview.avgAttendanceRate}%`} icon={Clock} color="primary" trendLabel="เฉลี่ย" />
                        <KpiCard title="คะแนนพฤติกรรม" value={overview.avgBehaviorScore} icon={Smile} color={overview.avgBehaviorScore >= 0 ? 'success' : 'danger'} trendLabel="เฉลี่ย" />
                        <KpiCard title="นักเรียนเสี่ยง" value={overview.atRiskCount} icon={AlertTriangle} color="danger" trendLabel="คน" />
                    </div>

                    {/* GPA Distribution */}
                    <div className="card p-5 mb-6">
                        <h3 className="text-sm font-bold text-text-primary mb-4">การกระจายเกรดเฉลี่ย (GPA)</h3>
                        <div className="flex items-end gap-2 h-28">
                            <GpaBar label="≥ 3.5" count={overview.gpaDistribution.excellent} total={overview.totalStudents} color="bg-green-500" />
                            <GpaBar label="3.0-3.49" count={overview.gpaDistribution.good} total={overview.totalStudents} color="bg-blue-500" />
                            <GpaBar label="2.0-2.99" count={overview.gpaDistribution.fair} total={overview.totalStudents} color="bg-amber-500" />
                            <GpaBar label="< 2.0" count={overview.gpaDistribution.poor} total={overview.totalStudents} color="bg-red-500" />
                            <GpaBar label="ไม่มีเกรด" count={overview.gpaDistribution.none} total={overview.totalStudents} color="bg-slate-300" />
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                        <div className="relative w-full sm:w-52">
                            <select value={filterClassroom} onChange={(e) => setFilterClassroom(e.target.value)} className="select-field pr-10 font-semibold">
                                <option value="">ทุกห้องเรียน</option>
                                {classrooms.map(c => (
                                    <option key={c.id} value={c.id}>{c.grade?.level}/{c.roomNumber}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                            <input type="text" placeholder="ค้นหาชื่อ หรือรหัสนักเรียน..." className="input-field pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                            <button onClick={() => setViewTab('all')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewTab === 'all' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary'}`}>
                                ทั้งหมด ({students.length})
                            </button>
                            <button onClick={() => setViewTab('at-risk')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewTab === 'at-risk' ? 'bg-white text-danger shadow-sm' : 'text-text-secondary'}`}>
                                เสี่ยง ({students.filter((s: any) => s.isAtRisk).length})
                            </button>
                        </div>
                    </div>

                    {/* Student Table */}
                    <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-border bg-slate-50/50">
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary w-12">#</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary">นักเรียน</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary hidden md:table-cell">ชั้น</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary cursor-pointer select-none" onClick={() => handleSort('gpa')}>
                                            <span className="inline-flex items-center gap-1">GPA <ArrowUpDown size={12} /></span>
                                        </th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary hidden sm:table-cell cursor-pointer select-none" onClick={() => handleSort('attendance')}>
                                            <span className="inline-flex items-center gap-1">เข้าเรียน <ArrowUpDown size={12} /></span>
                                        </th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary hidden md:table-cell cursor-pointer select-none" onClick={() => handleSort('behavior')}>
                                            <span className="inline-flex items-center gap-1">พฤติกรรม <ArrowUpDown size={12} /></span>
                                        </th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary hidden lg:table-cell">งาน</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light">
                                    {filtered.map((s: any, i: number) => (
                                        <tr key={s.id} className={`hover:bg-slate-50/50 transition-colors ${s.isAtRisk ? 'bg-red-50/30' : ''}`}>
                                            <td className="px-4 py-3 text-sm text-text-muted">{(i + 1).toString().padStart(2, '0')}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-text-muted flex items-center justify-center text-xs font-semibold overflow-hidden border border-border">
                                                        {s.avatarUrl ? (
                                                            <img src={normalizeUrl(s.avatarUrl)} className="w-full h-full object-cover" alt="" />
                                                        ) : s.firstName?.[0] || 'S'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-text-primary">{s.firstName} {s.lastName}</p>
                                                        <p className="text-[11px] text-text-muted">#{s.studentCode}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <span className="badge-primary">{s.classroom}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-sm font-bold ${s.gpa >= 3.0 ? 'text-green-600' : s.gpa >= 2.0 ? 'text-amber-600' : s.gpa > 0 ? 'text-red-600' : 'text-text-muted'}`}>
                                                    {s.gpa > 0 ? s.gpa.toFixed(2) : '-'}
                                                </span>
                                                <span className="text-[10px] text-text-muted ml-1 hidden sm:inline">({s.gradedSubjectCount}/{s.subjectCount})</span>
                                            </td>
                                            <td className="px-4 py-3 hidden sm:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${s.attendance.rate >= 80 ? 'bg-green-500' : s.attendance.rate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                            style={{ width: `${Math.min(s.attendance.rate, 100)}%` }} />
                                                    </div>
                                                    <span className="text-xs font-medium text-text-secondary">{s.attendance.rate}%</span>
                                                </div>
                                                <p className="text-[10px] text-text-muted mt-0.5">
                                                    มา {s.attendance.present} | สาย {s.attendance.late} | ขาด {s.attendance.absent} | ลา {s.attendance.leave}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <span className={`text-sm font-semibold ${s.behavior.score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {s.behavior.score > 0 ? '+' : ''}{s.behavior.score}
                                                </span>
                                                <p className="text-[10px] text-text-muted">+{s.behavior.positive} / -{s.behavior.negative}</p>
                                            </td>
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                <span className="text-sm text-text-secondary">{s.submissions.total} ชิ้น</span>
                                                {s.submissions.avgScore > 0 && (
                                                    <p className="text-[10px] text-text-muted">เฉลี่ย {s.submissions.avgScore}%</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {s.isAtRisk ? (
                                                    <div className="space-y-1">
                                                        {s.risks.map((r: string, ri: number) => (
                                                            <span key={ri} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-600 border border-red-100 mr-1">
                                                                <AlertTriangle size={10} /> {r}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="badge-success text-[11px]">ปกติ</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filtered.length === 0 && (
                                <div className="py-16 text-center">
                                    <Users size={40} className="mx-auto text-text-muted mb-3" />
                                    <p className="text-text-secondary font-semibold">ไม่พบข้อมูลนักเรียน</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* At-Risk Summary Cards */}
                    {overview.atRiskCount > 0 && viewTab === 'all' && (
                        <div className="mt-6 card p-5">
                            <h3 className="text-sm font-bold text-danger mb-3 flex items-center gap-2">
                                <AlertTriangle size={16} /> สรุปนักเรียนกลุ่มเสี่ยง ({overview.atRiskCount} คน)
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <RiskCard label="GPA ต่ำ" count={students.filter((s: any) => s.risks.includes('GPA ต่ำ')).length} color="red" />
                                <RiskCard label="ขาดเรียนเกินเกณฑ์" count={students.filter((s: any) => s.risks.includes('ขาดเรียนเกินเกณฑ์')).length} color="orange" />
                                <RiskCard label="พฤติกรรมเสี่ยง" count={students.filter((s: any) => s.risks.includes('พฤติกรรมเสี่ยง')).length} color="amber" />
                                <RiskCard label="มีวิชาที่ไม่ผ่าน" count={students.filter((s: any) => s.risks.includes('มีวิชาที่ไม่ผ่าน')).length} color="rose" />
                            </div>
                        </div>
                    )}
                </>
            )}
        </AppShell>
    );
}

function GpaBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-text-primary">{count}</span>
            <div className="w-full bg-slate-100 rounded-t-md relative" style={{ height: '80px' }}>
                <div className={`absolute bottom-0 left-0 right-0 ${color} rounded-t-md transition-all duration-500`}
                    style={{ height: `${Math.max(pct, 4)}%` }} />
            </div>
            <span className="text-[10px] text-text-muted text-center leading-tight">{label}</span>
        </div>
    );
}

const riskColorMap: Record<string, string> = {
    red: 'bg-red-50 border-red-200 text-red-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    rose: 'bg-rose-50 border-rose-200 text-rose-700',
};

function RiskCard({ label, count, color }: { label: string; count: number; color: string }) {
    return (
        <div className={`p-3 rounded-xl border ${riskColorMap[color] || riskColorMap.red}`}>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
        </div>
    );
}
