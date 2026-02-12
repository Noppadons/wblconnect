"use client";

import React, { useEffect, useState } from 'react';
import { Users, Search, ChevronRight, ChevronDown, GraduationCap, TrendingUp, AlertTriangle, Heart, School } from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/Layout/AppShell';
import KpiCard from '@/components/Dashboard/KpiCard';
import { TEACHER_SIDEBAR } from '@/lib/sidebar';

export default function MyStudentsPage() {
    const [allClassrooms, setAllClassrooms] = useState<any[]>([]);
    const [homeroomClassroom, setHomeroomClassroom] = useState<any>(null);
    const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'homeroom' | 'all'>('homeroom');
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));

        const fetchData = async () => {
            try {
                // ดึงห้องที่ปรึกษา
                let myRooms: any[] = [];
                try {
                    const myRes = await api.get('/school/my-classrooms');
                    myRooms = myRes.data || [];
                } catch { }

                // ดึงทุกห้องเรียน
                const yearsRes = await api.get('/school/academic-years');
                let allRooms: any[] = [];
                if (yearsRes.data?.length && yearsRes.data[0].semesters?.length) {
                    const semesterId = yearsRes.data[0].semesters[0].id;
                    const classroomsRes = await api.get(`/school/classrooms?semesterId=${semesterId}`);
                    allRooms = classroomsRes.data || [];
                }

                // หาห้องที่ปรึกษา — ห้องที่ homeroomTeacher.userId ตรงกับ user ปัจจุบัน
                const storedUser = localStorage.getItem('user');
                const currentUserId = storedUser ? JSON.parse(storedUser).id : null;
                const homeroom = allRooms.find(r =>
                    r.homeroomTeacher?.userId === currentUserId || r.homeroomTeacher?.user?.id === currentUserId
                ) || (myRooms.find(r =>
                    r.homeroomTeacher?.userId === currentUserId || r.homeroomTeacher?.user?.id === currentUserId
                )) || null;

                setHomeroomClassroom(homeroom);
                setAllClassrooms(allRooms);

                // ถ้ามีห้องที่ปรึกษา → เริ่มที่ tab homeroom
                if (homeroom) {
                    setActiveTab('homeroom');
                    setStudents(homeroom.students || []);
                } else {
                    setActiveTab('all');
                    if (allRooms.length > 0) {
                        setSelectedClassroomId(allRooms[0].id);
                        setStudents(allRooms[0].students || []);
                    }
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const handleTabChange = (tab: 'homeroom' | 'all') => {
        setActiveTab(tab);
        setSearchTerm('');
        if (tab === 'homeroom' && homeroomClassroom) {
            setStudents(homeroomClassroom.students || []);
        } else if (tab === 'all') {
            const id = selectedClassroomId || allClassrooms[0]?.id || '';
            if (!selectedClassroomId && allClassrooms.length > 0) setSelectedClassroomId(allClassrooms[0].id);
            const room = allClassrooms.find(c => c.id === id);
            setStudents(room?.students || []);
        }
    };

    const handleClassroomChange = (id: string) => {
        setSelectedClassroomId(id);
        setSearchTerm('');
        const room = allClassrooms.find(c => c.id === id);
        setStudents(room?.students || []);
    };

    const currentClassroom = activeTab === 'homeroom' ? homeroomClassroom : allClassrooms.find(c => c.id === selectedClassroomId);

    const filteredStudents = students.filter((s: any) =>
        `${s.user?.firstName} ${s.user?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || s.studentCode?.includes(searchTerm)
    );

    const avgGpa = students.length > 0
        ? (students.reduce((sum: number, s: any) => sum + (s.gpa || 0), 0) / students.length).toFixed(2)
        : '0.00';
    const lowGpaCount = students.filter((s: any) => (s.gpa || 0) < 2.0).length;
    const highGpaCount = students.filter((s: any) => (s.gpa || 0) >= 3.5).length;

    return (
        <AppShell role="TEACHER" sidebarItems={TEACHER_SIDEBAR} user={user}
            pageTitle="นักเรียน"
            pageSubtitle={currentClassroom ? `ชั้น ${currentClassroom.grade?.level}/${currentClassroom.roomNumber} • ${students.length} คน` : `${students.length} คน`}
        >
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : allClassrooms.length === 0 ? (
                <div className="py-16 text-center card">
                    <Users size={40} className="mx-auto text-text-muted mb-3" />
                    <p className="text-text-secondary font-semibold">ไม่พบห้องเรียน</p>
                </div>
            ) : (
                <>
                    {/* Tabs: ห้องที่ปรึกษา / ทุกห้อง */}
                    <div className="flex gap-1 p-1 bg-slate-100 rounded-lg max-w-md mb-4">
                        {homeroomClassroom && (
                            <button onClick={() => handleTabChange('homeroom')}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'homeroom' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary'}`}>
                                <Heart size={14} /> ห้องที่ปรึกษา ({homeroomClassroom.students?.length || 0})
                            </button>
                        )}
                        <button onClick={() => handleTabChange('all')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'all' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary'}`}>
                            <School size={14} /> ทุกห้องเรียน
                        </button>
                    </div>

                    {/* KPI */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <KpiCard title="นักเรียนทั้งหมด" value={students.length} icon={Users} color="primary" trendLabel="คน" />
                        <KpiCard title="GPA เฉลี่ย" value={avgGpa} icon={GraduationCap} color="success" trendLabel="ของห้อง" />
                        <KpiCard title="GPA ≥ 3.5" value={highGpaCount} icon={TrendingUp} color="success" trendLabel="คน" />
                        <KpiCard title="GPA < 2.0" value={lowGpaCount} icon={AlertTriangle} color="danger" trendLabel="คน" />
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                        {activeTab === 'all' && (
                            <div className="relative w-full sm:w-56">
                                <select value={selectedClassroomId} onChange={(e) => handleClassroomChange(e.target.value)} className="select-field pr-10 font-semibold">
                                    {allClassrooms.map(c => (
                                        <option key={c.id} value={c.id}>
                                            ชั้น {c.grade?.level}/{c.roomNumber} ({c.students?.length || 0} คน)
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                            </div>
                        )}
                        {activeTab === 'homeroom' && homeroomClassroom && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg text-sm font-semibold text-primary">
                                <Heart size={14} />
                                ชั้น {homeroomClassroom.grade?.level}/{homeroomClassroom.roomNumber}
                            </div>
                        )}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                            <input type="text" placeholder="ค้นหาชื่อหรือรหัสนักเรียน..." className="input-field pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                    </div>

                    {/* Student Table */}
                    <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-border bg-slate-50/50">
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary w-12">#</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary">ชื่อ-นามสกุล</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary hidden md:table-cell">รหัส</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary hidden sm:table-cell">GPA</th>
                                        <th className="px-4 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light">
                                    {filteredStudents.map((student: any, i: number) => {
                                        const gpa = student.gpa?.toFixed(2) || '0.00';
                                        const gpaNum = student.gpa || 0;
                                        return (
                                            <tr key={student.id} onClick={() => router.push(`/teacher/students/${student.id}`)} className="hover:bg-slate-50/50 cursor-pointer transition-colors group">
                                                <td className="px-4 py-3 text-sm text-text-muted">{(i + 1).toString().padStart(2, '0')}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-text-secondary overflow-hidden">
                                                            {student.user?.avatarUrl ? (
                                                                <img src={student.user.avatarUrl.startsWith('http') ? student.user.avatarUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${student.user.avatarUrl}`} className="w-full h-full object-cover" alt="" />
                                                            ) : student.user?.firstName?.[0] || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-text-primary group-hover:text-primary">{student.user?.firstName} {student.user?.lastName}</p>
                                                            <p className="text-xs text-text-muted md:hidden">{student.studentCode}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-text-muted hidden md:table-cell">{student.studentCode}</td>
                                                <td className="px-4 py-3 hidden sm:table-cell">
                                                    <span className={`text-sm font-semibold ${gpaNum >= 3.0 ? 'text-green-600' : gpaNum < 2.0 ? 'text-red-600' : 'text-amber-600'}`}>{gpa}</span>
                                                </td>
                                                <td className="px-4 py-3"><ChevronRight size={16} className="text-text-muted" /></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredStudents.length === 0 && (
                                <div className="py-16 text-center">
                                    <Users size={40} className="mx-auto text-text-muted mb-3" />
                                    <p className="text-text-secondary font-semibold">ไม่พบนักเรียน</p>
                                    <p className="text-sm text-text-muted mt-1">ลองค้นหาด้วยคำอื่น</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </AppShell>
    );
}
