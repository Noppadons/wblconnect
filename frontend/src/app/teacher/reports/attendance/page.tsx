"use client";

import React, { useEffect, useState } from 'react';
import { FileText, Download, Users, TrendingUp, Filter, ChevronRight, Calendar, Search } from 'lucide-react';
import api from '@/lib/api';
import AppShell from '@/components/Layout/AppShell';
import KpiCard from '@/components/Dashboard/KpiCard';
import { toast } from 'sonner';
import { TEACHER_SIDEBAR } from '@/lib/sidebar';
import { useUser } from '@/lib/useUser';

export default function AttendanceReportPage() {
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [selectedClassroomId, setSelectedClassroomId] = useState('');
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAllClassrooms, setShowAllClassrooms] = useState(false);
    const { user } = useUser();

    useEffect(() => {
        const fetchClassrooms = async () => {
            try {
                setLoading(true);
                let rooms: any[] = [];
                const yearsRes = await api.get('/school/academic-years');
                let currentSemesterId = '';

                if (yearsRes.data?.length && yearsRes.data[0].semesters?.length) {
                    const semesters = yearsRes.data[0].semesters;
                    const month = new Date().getMonth();
                    const isTerm2Time = month >= 10 || month <= 2;
                    currentSemesterId = semesters[0].id;
                    if (isTerm2Time) {
                        const term2 = semesters.find((s: any) => s.term === 2);
                        if (term2) currentSemesterId = term2.id;
                    }
                }

                if (showAllClassrooms) {
                    // ดึงทุกห้องเรียนทั้งหมด (ไม่ filter semester)
                    const res = await api.get('/school/all-classrooms');
                    rooms = res.data || [];
                } else {
                    const res = await api.get('/school/my-classrooms');
                    rooms = res.data || [];
                }

                setClassrooms(rooms);
                if (rooms.length > 0) {
                    const currentExists = rooms.find((r: any) => r.id === selectedClassroomId);
                    if (!currentExists) {
                        setSelectedClassroomId(rooms[0].id);
                    }
                }
            } catch (error) {
                toast.error('โหลดข้อมูลห้องเรียนไม่สำเร็จ');
            } finally {
                setLoading(false);
            }
        };
        fetchClassrooms();
    }, [showAllClassrooms]);

    useEffect(() => {
        if (!selectedClassroomId) return;

        const fetchReport = async () => {
            setFetching(true);
            try {
                const res = await api.get(`/attendance/summary?classroomId=${selectedClassroomId}`);
                setReportData(res.data);
            } catch (error) {
                toast.error('โหลดรายงานไม่สำเร็จ');
            } finally {
                setFetching(false);
            }
        };
        fetchReport();
    }, [selectedClassroomId]);

    const exportToCSV = () => {
        if (!reportData?.studentReports) return;

        const headers = ["Student ID", "Student Name", "Present", "Absent", "Late", "Leave", "Total", "Attendance Rate (%)"];
        const rows = reportData.studentReports.map((s: any) => [
            s.studentCode,
            s.name,
            s.stats.PRESENT,
            s.stats.ABSENT,
            s.stats.LATE,
            s.stats.LEAVE,
            s.total,
            s.attendanceRate
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map((r: any) => r.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `attendance_report_${selectedClassroomId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredStudents = reportData?.studentReports?.filter((s: any) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentCode.includes(searchQuery)
    ) || [];

    const stats = reportData?.overview?.reduce((acc: any, curr: any) => {
        acc[curr.status] = curr.count;
        return acc;
    }, { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 }) || { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 };

    const totalAttendance = Object.values(stats).reduce((a: any, b: any) => a + b, 0) as number;
    const overallRate = totalAttendance > 0 ? Math.round((stats.PRESENT / totalAttendance) * 100) : 0;

    return (
        <AppShell
            role="TEACHER"
            sidebarItems={TEACHER_SIDEBAR}
            user={user}
            pageTitle="รายงานสรุปการเข้าเรียน"
            pageSubtitle="วิเคราะห์ภาพรวมการมาเรียนรายภาคเรียน"
        >
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : classrooms.length === 0 ? (
                <div className="card text-center py-20">
                    <Users size={48} className="mx-auto text-text-muted mb-4" />
                    <p className="text-lg font-bold text-text-primary">ไม่พบห้องเรียน</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Filter & Actions */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <select
                                    value={selectedClassroomId}
                                    onChange={(e) => setSelectedClassroomId(e.target.value)}
                                    className="select-field pl-10 font-bold"
                                >
                                    {classrooms.map(c => (
                                        <option key={c.id} value={c.id}>
                                            ชั้น {c.grade?.level}/{c.roomNumber}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={() => setShowAllClassrooms(!showAllClassrooms)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap border ${showAllClassrooms ? 'bg-primary text-white border-primary shadow-sm' : 'bg-surface text-text-secondary border-border hover:bg-surface-elevated'}`}
                            >
                                {showAllClassrooms ? 'แสดงห้องฉัน' : 'ดูทุกห้อง'}
                            </button>
                        </div>
                        <button
                            onClick={exportToCSV}
                            disabled={fetching || !reportData}
                            className="btn-secondary w-full md:w-auto"
                        >
                            <Download size={18} /> ส่งออกเป็น CSV
                        </button>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <KpiCard
                            title="ภาพรวมมาเรียน"
                            value={`${overallRate}%`}
                            icon={TrendingUp}
                            color="success"
                            trendLabel="ของทั้งภาคเรียน"
                        />
                        <KpiCard
                            title="นักเรียนทั้งหมด"
                            value={reportData?.studentsCount || 0}
                            icon={Users}
                            color="primary"
                            trendLabel="คน"
                        />
                        <KpiCard
                            title="เช็คชื่อแล้ว"
                            value={totalAttendance}
                            icon={Calendar}
                            color="secondary"
                            trendLabel="ครั้ง"
                        />
                    </div>

                    {/* Student List Table */}
                    <div className="card overflow-hidden">
                        <div className="p-4 border-b border-border flex justify-between items-center bg-surface-elevated/50">
                            <h3 className="font-bold text-text-primary">รายละเอียดรายบุคคล</h3>
                            <div className="relative w-64">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    type="text"
                                    placeholder="ค้นหาชื่อหรือรหัส..."
                                    className="input-field pl-9 py-1.5 text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {fetching ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-surface-elevated border-b border-border">
                                            <th className="px-6 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">รหัสนักเรียน</th>
                                            <th className="px-6 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">ชื่อ-นามสกุล</th>
                                            <th className="px-6 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider text-center">มาเรียน</th>
                                            <th className="px-6 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider text-center">ขาด</th>
                                            <th className="px-6 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider text-center">สาย</th>
                                            <th className="px-6 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider text-center">ลา</th>
                                            <th className="px-6 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">อัตราเข้าเรียน</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredStudents.map((s: any) => (
                                            <tr key={s.id} className="hover:bg-surface-elevated/50 transition-colors group">
                                                <td className="px-6 py-4 text-sm font-medium text-text-secondary">{s.studentCode}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-text-primary capitalize">{s.name}</td>
                                                <td className="px-6 py-4 text-sm text-center font-semibold text-green-600">{s.stats.PRESENT}</td>
                                                <td className="px-6 py-4 text-sm text-center font-semibold text-red-600">{s.stats.ABSENT}</td>
                                                <td className="px-6 py-4 text-sm text-center font-semibold text-amber-600">{s.stats.LATE}</td>
                                                <td className="px-6 py-4 text-sm text-center font-semibold text-blue-600">{s.stats.LEAVE}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="w-16 bg-border rounded-full h-1.5 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${s.attendanceRate >= 80 ? 'bg-green-500/100' :
                                                                    s.attendanceRate >= 60 ? 'bg-amber-500/100' : 'bg-red-500/100'
                                                                    }`}
                                                                style={{ width: `${s.attendanceRate}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm font-bold text-text-primary">{s.attendanceRate}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AppShell>
    );
}
