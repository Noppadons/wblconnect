"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Users, CheckCircle2, XCircle, Clock, UserCheck, Search, Save, Check, ChevronDown, School, CalendarDays, ChevronLeft, ChevronRight, MessageSquare, X, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import AppShell from '@/components/Layout/AppShell';
import KpiCard from '@/components/Dashboard/KpiCard';
import { toast } from 'sonner';
import { TEACHER_SIDEBAR } from '@/lib/sidebar';

const STATUS_CONFIG = {
    PRESENT: { icon: CheckCircle2, label: 'มาเรียน', active: 'bg-green-600 text-white', hover: 'hover:bg-green-50', color: 'text-green-600' },
    LATE: { icon: Clock, label: 'มาสาย', active: 'bg-amber-600 text-white', hover: 'hover:bg-amber-50', color: 'text-amber-600' },
    ABSENT: { icon: XCircle, label: 'ขาดเรียน', active: 'bg-red-600 text-white', hover: 'hover:bg-red-50', color: 'text-red-600' },
    LEAVE: { icon: UserCheck, label: 'ลาพัก', active: 'bg-blue-600 text-white', hover: 'hover:bg-blue-50', color: 'text-blue-600' },
};

const periods = [
    { id: 0, label: 'เข้าแถว' }, { id: 1, label: 'คาบ 1' }, { id: 2, label: 'คาบ 2' }, { id: 3, label: 'คาบ 3' },
    { id: 4, label: 'คาบ 4' }, { id: 5, label: 'คาบ 5' }, { id: 6, label: 'คาบ 6' }, { id: 7, label: 'คาบ 7' }, { id: 8, label: 'คาบ 8' },
];

function toThaiDateString(date: Date) {
    return date.toLocaleDateString('th-TH', { dateStyle: 'long' });
}

function toISODateOnly(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isToday(date: Date) {
    const today = new Date();
    return toISODateOnly(date) === toISODateOnly(today);
}

export default function AttendanceCheckPage() {
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<number>(0);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [user, setUser] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [remarkStudentId, setRemarkStudentId] = useState<string | null>(null);
    const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
    const savedSnapshotRef = useRef<string>("");

    const selectedClassroom = classrooms.find(c => c.id === selectedClassroomId) || null;

    const getStudentsSnapshot = useCallback((studentsList: any[]) => {
        return JSON.stringify(studentsList.map(s => ({ id: s.id, status: s.status, remarks: s.remarks || '' })));
    }, []);

    const loadStudentsForClassroom = useCallback(async (classroom: any, period: number, date: Date) => {
        if (!classroom) { setStudents([]); return; }
        const studentsData = classroom.students.map((s: any) => ({
            ...s,
            name: `${s.user.firstName} ${s.user.lastName}`,
            status: 'PRESENT',
            remarks: ''
        }));

        try {
            const res = await api.get(`/attendance/classroom?classroomId=${classroom.id}&date=${date.toISOString()}`);
            const periodRecords = res.data.filter((a: any) => a.period === period);
            if (periodRecords.length > 0) {
                const merged = studentsData.map((student: any) => {
                    const record = periodRecords.find((r: any) => r.studentId === student.id);
                    return record ? { ...student, status: record.status, remarks: record.remarks || '' } : student;
                });
                setStudents(merged);
                savedSnapshotRef.current = getStudentsSnapshot(merged);
            } else {
                setStudents(studentsData);
                savedSnapshotRef.current = getStudentsSnapshot(studentsData);
            }
        } catch {
            setStudents(studentsData);
            savedSnapshotRef.current = getStudentsSnapshot(studentsData);
        }
        setHasUnsavedChanges(false);
    }, [getStudentsSnapshot]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));

        const fetchClassrooms = async () => {
            try {
                const yearsRes = await api.get('/school/academic-years');
                let rooms: any[] = [];
                if (yearsRes.data?.length && yearsRes.data[0].semesters?.length) {
                    const semesterId = yearsRes.data[0].semesters[0].id;
                    const classroomsRes = await api.get(`/school/classrooms?semesterId=${semesterId}`);
                    rooms = classroomsRes.data || [];
                }
                setClassrooms(rooms);
                if (rooms.length > 0) {
                    setSelectedClassroomId(rooms[0].id);
                }
            } catch (err: any) {
                console.error('[Attendance] Error loading classrooms:', err?.message);
                toast.error('ไม่สามารถโหลดข้อมูลห้องเรียนได้');
            }
            finally { setLoading(false); }
        };
        fetchClassrooms();
    }, []);

    useEffect(() => {
        const classroom = classrooms.find(c => c.id === selectedClassroomId);
        if (classroom) {
            loadStudentsForClassroom(classroom, selectedPeriod, selectedDate);
        }
    }, [selectedClassroomId, selectedPeriod, selectedDate, classrooms, loadStudentsForClassroom]);

    // Track unsaved changes
    useEffect(() => {
        if (students.length > 0 && savedSnapshotRef.current) {
            const current = getStudentsSnapshot(students);
            setHasUnsavedChanges(current !== savedSnapshotRef.current);
        }
    }, [students, getStudentsSnapshot]);

    // Unsaved changes guard
    const guardNavigation = useCallback((action: () => void) => {
        if (hasUnsavedChanges) {
            setPendingNavigation(() => action);
        } else {
            action();
        }
    }, [hasUnsavedChanges]);

    const handleClassroomChange = (classroomId: string) => {
        guardNavigation(() => {
            setSelectedClassroomId(classroomId);
            setSearchQuery('');
        });
    };

    const handlePeriodChange = (period: number) => {
        guardNavigation(() => setSelectedPeriod(period));
    };

    const handleDateChange = (date: Date) => {
        guardNavigation(() => setSelectedDate(date));
    };

    const prevDay = () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() - 1);
        handleDateChange(d);
    };

    const nextDay = () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + 1);
        const today = new Date();
        if (d <= today) handleDateChange(d);
    };

    const goToday = () => handleDateChange(new Date());

    const updateStatus = (id: string, newStatus: string) => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    };

    const updateRemarks = (id: string, remarks: string) => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, remarks } : s));
    };

    const markAll = (status: string) => {
        setStudents(prev => prev.map(s => ({ ...s, status })));
        const labels: Record<string, string> = { PRESENT: 'มาเรียนทั้งหมด', ABSENT: 'ขาดทั้งหมด', LATE: 'มาสายทั้งหมด', LEAVE: 'ลาทั้งหมด' };
        toast.info(labels[status] || 'อัปเดตแล้ว');
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const records = students.map(s => ({
                studentId: s.id,
                status: s.status,
                period: selectedPeriod,
                remarks: s.remarks || undefined,
                date: selectedDate.toISOString()
            }));
            await api.post('/attendance/bulk-check', { records });
            savedSnapshotRef.current = getStudentsSnapshot(students);
            setHasUnsavedChanges(false);
            toast.success('บันทึกเรียบร้อย');
        } catch { toast.error('เกิดข้อผิดพลาด'); }
        finally { setSaving(false); }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.studentCode.includes(searchQuery)
    );
    const stats = {
        present: students.filter(s => s.status === 'PRESENT').length,
        absent: students.filter(s => s.status === 'ABSENT').length,
        late: students.filter(s => s.status === 'LATE').length,
        leave: students.filter(s => s.status === 'LEAVE').length
    };

    return (
        <AppShell role="TEACHER" sidebarItems={TEACHER_SIDEBAR} user={user}
            pageTitle="เช็คชื่อรายคาบ"
            pageSubtitle={selectedClassroom
                ? `ชั้น ${selectedClassroom.grade?.level}/${selectedClassroom.roomNumber} • ${students.length} คน • ${toThaiDateString(selectedDate)}`
                : toThaiDateString(selectedDate)}
            headerActions={
                <div className="flex gap-2">
                    {hasUnsavedChanges && (
                        <span className="hidden sm:flex items-center gap-1 text-xs text-amber-600 font-medium bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
                            <AlertTriangle size={13} /> ยังไม่บันทึก
                        </span>
                    )}
                    <button onClick={handleSave} disabled={saving || students.length === 0} className="btn-primary">
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16} /> บันทึก</>}
                    </button>
                </div>
            }
        >
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : classrooms.length === 0 ? (
                <div className="py-16 text-center card">
                    <School size={40} className="mx-auto text-text-muted mb-3" />
                    <p className="text-text-secondary font-semibold">ไม่พบห้องเรียน</p>
                    <p className="text-sm text-text-muted mt-1">กรุณาติดต่อผู้ดูแลระบบเพื่อกำหนดห้องเรียน</p>
                </div>
            ) : (
                <>
                    {/* KPI */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <KpiCard title="มาเรียน" value={stats.present} icon={CheckCircle2} color="success" trendLabel={`จาก ${students.length}`} />
                        <KpiCard title="ขาดเรียน" value={stats.absent} icon={XCircle} color="danger" trendLabel="คน" />
                        <KpiCard title="มาสาย" value={stats.late} icon={Clock} color="warning" trendLabel="คน" />
                        <KpiCard title="ลา" value={stats.leave} icon={UserCheck} color="primary" trendLabel="คน" />
                    </div>

                    {/* Toolbar Row 1: Classroom + Period */}
                    <div className="flex flex-col md:flex-row gap-3 mb-3">
                        <div className="relative w-full md:w-56">
                            <select value={selectedClassroomId} onChange={(e) => handleClassroomChange(e.target.value)} className="select-field pr-10 font-semibold">
                                {classrooms.map(c => (
                                    <option key={c.id} value={c.id}>
                                        ชั้น {c.grade?.level}/{c.roomNumber} ({c._count?.students ?? c.students?.length ?? 0} คน)
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>
                        <div className="relative w-full md:w-44">
                            <select value={selectedPeriod} onChange={(e) => handlePeriodChange(Number(e.target.value))} className="select-field pr-10">
                                {periods.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>

                        {/* Date Navigator */}
                        <div className="flex items-center gap-1">
                            <button onClick={prevDay} className="btn-ghost p-2"><ChevronLeft size={18} /></button>
                            <div className="flex items-center gap-2">
                                <CalendarDays size={16} className="text-text-muted" />
                                <input
                                    type="date"
                                    value={toISODateOnly(selectedDate)}
                                    max={toISODateOnly(new Date())}
                                    onChange={(e) => { if (e.target.value) handleDateChange(new Date(e.target.value + 'T00:00:00')); }}
                                    className="input-field py-2 px-3 w-40 text-sm"
                                />
                            </div>
                            <button onClick={nextDay} disabled={isToday(selectedDate)} className="btn-ghost p-2 disabled:opacity-30"><ChevronRight size={18} /></button>
                            {!isToday(selectedDate) && (
                                <button onClick={goToday} className="text-xs font-semibold text-primary hover:underline ml-1">วันนี้</button>
                            )}
                        </div>
                    </div>

                    {/* Toolbar Row 2: Search + Quick Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                        <div className="relative flex-1 max-w-md">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input type="text" placeholder="ค้นหาชื่อหรือรหัส..." className="input-field pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                            <button onClick={() => markAll('PRESENT')} className="px-3 py-2 rounded-lg text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors">
                                <Check size={14} className="inline mr-1" />มาทั้งหมด
                            </button>
                            <button onClick={() => markAll('ABSENT')} className="px-3 py-2 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors">
                                <XCircle size={14} className="inline mr-1" />ขาดทั้งหมด
                            </button>
                            <button onClick={() => markAll('LATE')} className="px-3 py-2 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors">
                                <Clock size={14} className="inline mr-1" />สายทั้งหมด
                            </button>
                            <button onClick={() => markAll('LEAVE')} className="px-3 py-2 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors">
                                <UserCheck size={14} className="inline mr-1" />ลาทั้งหมด
                            </button>
                        </div>
                    </div>

                    {/* Not-today banner */}
                    {!isToday(selectedDate) && (
                        <div className="mb-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2 text-sm text-amber-800">
                            <CalendarDays size={16} />
                            <span>กำลังดู/แก้ไขข้อมูลวันที่ <strong>{toThaiDateString(selectedDate)}</strong> (ไม่ใช่วันนี้)</span>
                        </div>
                    )}

                    {/* Student List */}
                    <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-border bg-slate-50/50">
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary w-12">#</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary">ชื่อ-นามสกุล</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary text-center">สถานะ</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light">
                                    {filteredStudents.map((student, index) => (
                                        <React.Fragment key={student.id}>
                                            <tr className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-text-muted">{(index + 1).toString().padStart(2, '0')}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                                            student.status === 'PRESENT' ? 'bg-green-100 text-green-700' :
                                                            student.status === 'ABSENT' ? 'bg-red-100 text-red-700' :
                                                            student.status === 'LATE' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-blue-100 text-blue-700'
                                                        }`}>{student.name[0]}</div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-text-primary">{student.name}</p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-text-muted">{student.studentCode}</span>
                                                                {student.remarks && (
                                                                    <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                                                        {student.remarks.length > 20 ? student.remarks.slice(0, 20) + '...' : student.remarks}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-center gap-1">
                                                        {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map(key => {
                                                            const cfg = STATUS_CONFIG[key];
                                                            const isActive = student.status === key;
                                                            return (
                                                                <button key={key} onClick={() => updateStatus(student.id, key)}
                                                                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${isActive ? cfg.active + ' border-transparent' : 'bg-white text-text-secondary border-border ' + cfg.hover}`}>
                                                                    <cfg.icon size={14} /> <span className="hidden sm:inline">{cfg.label}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => setRemarkStudentId(remarkStudentId === student.id ? null : student.id)}
                                                        className={`btn-ghost p-1.5 ${student.remarks ? 'text-amber-600' : 'text-text-muted'}`}
                                                        title="หมายเหตุ"
                                                    >
                                                        <MessageSquare size={15} />
                                                    </button>
                                                </td>
                                            </tr>
                                            {/* Inline Remarks Row */}
                                            {remarkStudentId === student.id && (
                                                <tr className="bg-slate-50/80">
                                                    <td></td>
                                                    <td colSpan={3} className="px-4 py-2.5">
                                                        <div className="flex items-center gap-2">
                                                            <MessageSquare size={14} className="text-text-muted shrink-0" />
                                                            <input
                                                                type="text"
                                                                placeholder="พิมพ์หมายเหตุ เช่น ป่วย, ไปแข่งกีฬา..."
                                                                className="input-field py-1.5 text-sm flex-1"
                                                                value={student.remarks || ''}
                                                                onChange={(e) => updateRemarks(student.id, e.target.value)}
                                                                autoFocus
                                                            />
                                                            <button onClick={() => setRemarkStudentId(null)} className="btn-ghost p-1.5 text-text-muted">
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                            {filteredStudents.length === 0 && (
                                <div className="py-16 text-center">
                                    <Users size={40} className="mx-auto text-text-muted mb-3" />
                                    <p className="text-text-secondary font-semibold">ไม่พบนักเรียน</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Unsaved Changes Confirmation Dialog */}
            {pendingNavigation && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-modal p-6 max-w-sm w-full animate-fade-in">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <AlertTriangle size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-text-primary">มีข้อมูลที่ยังไม่บันทึก</h3>
                                <p className="text-sm text-text-muted">ต้องการดำเนินการต่อหรือไม่?</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setPendingNavigation(null)} className="btn-secondary flex-1">ยกเลิก</button>
                            <button onClick={() => { pendingNavigation(); setPendingNavigation(null); setHasUnsavedChanges(false); }} className="btn-primary flex-1 !bg-amber-600 hover:!bg-amber-700">ไม่บันทึก</button>
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
}
