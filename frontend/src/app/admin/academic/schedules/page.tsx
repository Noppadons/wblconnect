"use client";

import React, { useEffect, useState } from 'react';
import { Calendar, Plus, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import AppShell from '@/components/Layout/AppShell';
import Timetable from '@/components/Academic/Timetable';
import Modal from '@/components/Common/Modal';
import { ADMIN_SIDEBAR } from '@/lib/sidebar';

const DAY_LABELS = [
    { value: 'MONDAY', label: 'จันทร์' },
    { value: 'TUESDAY', label: 'อังคาร' },
    { value: 'WEDNESDAY', label: 'พุธ' },
    { value: 'THURSDAY', label: 'พฤหัสบดี' },
    { value: 'FRIDAY', label: 'ศุกร์' },
];

export default function AdminSchedulesPage() {
    const [viewType, setViewType] = useState<'CLASSROOM' | 'TEACHER'>('CLASSROOM');
    const [selectedId, setSelectedId] = useState('');
    const [schedules, setSchedules] = useState<any[]>([]);
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [formData, setFormData] = useState({ dayOfWeek: 'MONDAY', periodStart: '1', periodEnd: '1', subjectId: '', teacherId: '', classroomId: '' });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedId) fetchSchedules();
        else setSchedules([]);
    }, [selectedId, viewType]);

    const fetchInitialData = async () => {
        try {
            const [classRes, teachRes, subRes] = await Promise.all([
                api.get('/admin/classrooms'), api.get('/admin/teachers'), api.get('/school/subjects')
            ]);
            setClassrooms(classRes.data); setTeachers(teachRes.data); setSubjects(subRes.data);
            if (classRes.data.length > 0) setSelectedId(classRes.data[0].id);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchSchedules = async () => {
        try {
            const endpoint = viewType === 'CLASSROOM' ? `/schedule/classroom/${selectedId}` : `/schedule/teacher/${selectedId}`;
            const res = await api.get(endpoint);
            setSchedules(res.data);
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('ยืนยันการลบคาบเรียนนี้?')) return;
        try { await api.delete(`/schedule/${id}`); toast.success('ลบสำเร็จ'); fetchSchedules(); }
        catch { toast.error('เกิดข้อผิดพลาด'); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.subjectId) { toast.error('กรุณาเลือกรายวิชา'); return; }
        if (!formData.teacherId) { toast.error('กรุณาเลือกครูผู้สอน'); return; }
        if (!formData.classroomId) { toast.error('กรุณาเลือกห้องเรียน'); return; }
        if (Number(formData.periodEnd) < Number(formData.periodStart)) { toast.error('คาบจบต้องมากกว่าหรือเท่ากับคาบเริ่ม'); return; }
        const toastId = toast.loading('กำลังบันทึก...');
        try {
            const payload = {
                dayOfWeek: formData.dayOfWeek,
                periodStart: Number(formData.periodStart),
                periodEnd: Number(formData.periodEnd),
                subjectId: formData.subjectId,
                teacherId: formData.teacherId,
                classroomId: formData.classroomId,
            };
            await api.post('/schedule', payload);
            toast.success('เพิ่มตารางเรียนสำเร็จ', { id: toastId });
            setIsModalOpen(false);
            setFormData({ dayOfWeek: 'MONDAY', periodStart: '1', periodEnd: '1', subjectId: '', teacherId: '', classroomId: '' });
            fetchSchedules();
        } catch (err: any) {
            const msg = err.response?.data?.message;
            toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'เกิดข้อผิดพลาด', { id: toastId });
        }
    };

    return (
        <AppShell role="ADMIN" sidebarItems={ADMIN_SIDEBAR} user={user} pageTitle="จัดการตารางเรียน" pageSubtitle="Master Schedule"
            headerActions={<button onClick={() => setIsModalOpen(true)} className="btn-primary"><Plus size={18} /> เพิ่มคาบเรียน</button>}
        >
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* View Toggle + Selector */}
                    <div className="flex flex-col md:flex-row gap-3 mb-6">
                        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg max-w-xs">
                            <button onClick={() => { setViewType('CLASSROOM'); setSelectedId(classrooms[0]?.id || ''); }}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${viewType === 'CLASSROOM' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary'}`}>
                                ตามห้องเรียน
                            </button>
                            <button onClick={() => { setViewType('TEACHER'); setSelectedId(teachers[0]?.id || ''); }}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${viewType === 'TEACHER' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary'}`}>
                                ตามครูผู้สอน
                            </button>
                        </div>

                        <div className="relative min-w-[200px]">
                            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="select-field pr-10">
                                {viewType === 'CLASSROOM' ? classrooms.map((c: any) => (
                                    <option key={c.id} value={c.id}>ชั้น {c.grade.level}/{c.roomNumber}</option>
                                )) : teachers.map((t: any) => (
                                    <option key={t.id} value={t.id}>ครู{t.user.firstName} {t.user.lastName}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
                        </div>
                    </div>

                    {/* Timetable */}
                    <Timetable schedules={schedules} type={viewType === 'CLASSROOM' ? 'STUDENT' : 'TEACHER'} isAdmin={true} onDelete={handleDelete} />
                </>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="เพิ่มคาบเรียน" subtitle="กรอกข้อมูลตารางเรียน">
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label">วัน</label>
                                    <div className="relative">
                                        <select className="select-field pr-10" value={formData.dayOfWeek} onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}>
                                            {DAY_LABELS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="label">คาบเริ่ม</label>
                                        <input required type="number" min="1" max="8" className="input-field" value={formData.periodStart} onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="label">คาบจบ</label>
                                        <input required type="number" min="1" max="8" className="input-field" value={formData.periodEnd} onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="label">รายวิชา</label>
                                <div className="relative">
                                    <select required className="select-field pr-10" value={formData.subjectId} onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}>
                                        <option value="">-- เลือกวิชา --</option>
                                        {subjects.map((s: any) => <option key={s.id} value={s.id}>[{s.code}] {s.name}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label">ครูผู้สอน</label>
                                    <div className="relative">
                                        <select required className="select-field pr-10" value={formData.teacherId} onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}>
                                            <option value="">-- เลือกครู --</option>
                                            {teachers.map((t: any) => <option key={t.id} value={t.id}>ครู{t.user.firstName}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
                                    </div>
                                </div>
                                <div>
                                    <label className="label">ห้องเรียน</label>
                                    <div className="relative">
                                        <select required className="select-field pr-10" value={formData.classroomId} onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}>
                                            <option value="">-- เลือกห้อง --</option>
                                            {classrooms.map((c: any) => <option key={c.id} value={c.id}>{c.grade.level}/{c.roomNumber}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-border">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">ยกเลิก</button>
                                <button type="submit" className="btn-primary flex-1">บันทึก</button>
                            </div>
                        </form>
            </Modal>
        </AppShell>
    );
}
