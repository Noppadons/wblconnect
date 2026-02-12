"use client";

import React, { useEffect, useState } from 'react';
import { BookOpen, ChevronRight, Plus, Clock, ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AppShell from '@/components/Layout/AppShell';
import Modal from '@/components/Common/Modal';
import { TEACHER_SIDEBAR } from '@/lib/sidebar';

export default function TeacherGradingOverview() {
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedClassroom, setSelectedClassroom] = useState<string | null>(null);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [formData, setFormData] = useState({ title: '', description: '', maxPoints: 10, dueDate: '', classroomId: '', subjectId: '' });
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchClassrooms(); fetchMySubjects();
    }, []);

    useEffect(() => {
        if (selectedClassroom) { fetchAssignments(selectedClassroom); setFormData(prev => ({ ...prev, classroomId: selectedClassroom })); }
    }, [selectedClassroom]);

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
            if (rooms.length > 0 && !selectedClassroom) setSelectedClassroom(rooms[0].id);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    const fetchMySubjects = async () => {
        try { const res = await api.get('/school/subjects'); setSubjects(res.data); if (res.data.length > 0) setFormData(prev => ({ ...prev, subjectId: res.data[0].id })); }
        catch (err) { console.error(err); }
    };
    const fetchAssignments = async (classroomId: string) => {
        setLoading(true);
        try { const res = await api.get(`/assessment/classroom/${classroomId}`); setAssignments(res.data); }
        catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/assessment/assignment', { ...formData, maxPoints: Number(formData.maxPoints) });
            toast.success('สร้างงานเรียบร้อย'); setIsModalOpen(false);
            setFormData({ title: '', description: '', maxPoints: 10, dueDate: '', classroomId: selectedClassroom || '', subjectId: formData.subjectId });
            if (selectedClassroom) fetchAssignments(selectedClassroom);
        } catch (err: any) { toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด'); }
    };

    const isDueSoon = (dueDate: string) => {
        if (!dueDate) return false;
        const diff = new Date(dueDate).getTime() - Date.now();
        return diff > 0 && diff < 2 * 24 * 60 * 60 * 1000;
    };
    const isOverdue = (dueDate: string) => dueDate && new Date(dueDate) < new Date();

    return (
        <AppShell role="TEACHER" sidebarItems={TEACHER_SIDEBAR} user={user} pageTitle="สั่งงาน / การบ้าน" pageSubtitle={`${assignments.length} งาน • ${classrooms.length} ห้องเรียน`}
            headerActions={<button onClick={() => setIsModalOpen(true)} className="btn-primary"><Plus size={18} /> มอบหมายงาน</button>}
        >
            {loading && classrooms.length === 0 ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* Classroom Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                        {classrooms.map(cls => (
                            <button key={cls.id} onClick={() => setSelectedClassroom(cls.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${selectedClassroom === cls.id ? 'bg-primary text-white' : 'bg-slate-100 text-text-secondary hover:bg-slate-200'}`}>
                                ชั้น {cls.grade?.level}/{cls.roomNumber}
                            </button>
                        ))}
                    </div>

                    {/* Assignments List */}
                    <div className="space-y-3">
                        {assignments.map(asm => {
                            const overdue = isOverdue(asm.dueDate);
                            const dueSoon = isDueSoon(asm.dueDate);
                            const submittedCount = asm._count?.submissions || 0;
                            const totalStudents = classrooms.find(c => c.id === selectedClassroom)?.students?.length || 0;

                            return (
                                <div key={asm.id} onClick={() => router.push(`/teacher/grading/${asm.id}`)}
                                    className="card-hover p-4 cursor-pointer group">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-sm font-bold text-text-primary group-hover:text-primary truncate">{asm.title}</h3>
                                                <span className="badge-primary text-xs shrink-0">{asm.subject?.code}</span>
                                            </div>
                                            {asm.description && (
                                                <p className="text-xs text-text-muted mb-2 line-clamp-2">{asm.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 text-xs text-text-muted">
                                                <span className="font-semibold text-text-secondary">{asm.maxPoints} คะแนน</span>
                                                {asm.dueDate && (
                                                    <span className={`flex items-center gap-1 ${overdue ? 'text-red-600 font-semibold' : dueSoon ? 'text-amber-600 font-semibold' : ''}`}>
                                                        {overdue ? <AlertCircle size={12} /> : <Clock size={12} />}
                                                        {overdue ? 'เลยกำหนด' : ''} {new Date(asm.dueDate).toLocaleDateString('th-TH')}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <CheckCircle2 size={12} className={submittedCount > 0 ? 'text-green-600' : ''} />
                                                    ส่งแล้ว {submittedCount}{totalStudents > 0 ? `/${totalStudents}` : ''} คน
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-text-muted shrink-0 mt-1 group-hover:text-primary" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {!loading && assignments.length === 0 && (
                        <div className="py-16 text-center card">
                            <BookOpen size={40} className="mx-auto text-text-muted mb-3" />
                            <p className="text-text-secondary font-semibold">ยังไม่มีงานในห้องเรียนนี้</p>
                            <p className="text-sm text-text-muted mt-1">กดปุ่ม "มอบหมายงาน" เพื่อสร้างงานแรก</p>
                            <button onClick={() => setIsModalOpen(true)} className="btn-primary mt-4"><Plus size={16} /> สร้างงานแรก</button>
                        </div>
                    )}
                    {loading && assignments.length === 0 && (
                        <div className="py-16 flex justify-center">
                            <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                        </div>
                    )}
                </>
            )}

            {/* Create Assignment Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="มอบหมายงานใหม่" subtitle="กรอกรายละเอียดงาน">
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="label">ชื่องาน</label>
                        <input required placeholder="เช่น ทำแบบฝึกหัดบทที่ 5..." className="input-field" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                    </div>
                    <div>
                        <label className="label">รายละเอียด (ไม่บังคับ)</label>
                        <textarea placeholder="อธิบายรายละเอียดงาน เงื่อนไข หรือคำแนะนำ..." className="input-field h-24 resize-none"
                            value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">คะแนนเต็ม</label>
                            <input required type="number" min={1} className="input-field" value={formData.maxPoints} onChange={(e) => setFormData({ ...formData, maxPoints: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label className="label">กำหนดส่ง</label>
                            <input required type="date" className="input-field" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="label">วิชา</label>
                        <div className="relative">
                            <select required className="select-field pr-10" value={formData.subjectId} onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-border">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">ยกเลิก</button>
                        <button type="submit" className="btn-primary flex-1">สร้างงาน</button>
                    </div>
                </form>
            </Modal>
        </AppShell>
    );
}
