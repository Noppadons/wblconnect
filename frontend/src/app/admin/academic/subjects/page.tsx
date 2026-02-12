"use client";

import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, Search, Pencil, Trash2, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import AppShell from '@/components/Layout/AppShell';
import Modal from '@/components/Common/Modal';
import { ADMIN_SIDEBAR } from '@/lib/sidebar';

export default function AdminSubjectsPage() {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [formData, setFormData] = useState({ code: '', name: '', credit: '1.5', teacherId: '', classroomId: '' });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [subRes, teachRes, classRes] = await Promise.all([
                api.get('/school/subjects'), api.get('/admin/teachers'), api.get('/admin/classrooms')
            ]);
            setSubjects(subRes.data); setTeachers(teachRes.data); setClassrooms(classRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('ยืนยันการลบรายวิชานี้?')) return;
        try { await api.delete(`/school/subjects/${id}`); toast.success('ลบรายวิชาสำเร็จ'); fetchData(); }
        catch { toast.error('เกิดข้อผิดพลาด'); }
    };

    const handleOpenModal = (subject: any = null) => {
        if (subject) {
            setEditingSubject(subject);
            setFormData({ code: subject.code, name: subject.name, credit: String(subject.credit), teacherId: subject.teacherId || '', classroomId: subject.classroomId || '' });
        } else {
            setEditingSubject(null);
            setFormData({ code: '', name: '', credit: '1.5', teacherId: '', classroomId: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const toastId = toast.loading('กำลังบันทึก...');
        try {
            if (editingSubject) {
                await api.patch(`/school/subjects/${editingSubject.id}`, formData);
                toast.success('อัปเดตรายวิชาเรียบร้อย', { id: toastId });
            } else {
                await api.post('/school/subjects', formData);
                toast.success('เพิ่มรายวิชาเรียบร้อย', { id: toastId });
            }
            setIsModalOpen(false);
            setEditingSubject(null);
            setFormData({ code: '', name: '', credit: '1.5', teacherId: '', classroomId: '' });
            fetchData();
        } catch { toast.error('เกิดข้อผิดพลาด', { id: toastId }); }
    };

    const filteredSubjects = subjects.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AppShell role="ADMIN" sidebarItems={ADMIN_SIDEBAR} user={user} pageTitle="จัดการรายวิชา" pageSubtitle={`ทั้งหมด ${subjects.length} วิชา`}
            headerActions={<button onClick={() => handleOpenModal()} className="btn-primary"><Plus size={18} /> เพิ่มวิชา</button>}
        >
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* Search */}
                    <div className="mb-4">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                            <input type="text" placeholder="ค้นหารหัสวิชา หรือชื่อวิชา..." className="input-field pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-border bg-slate-50/50">
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary">รหัส</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary">ชื่อวิชา</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary hidden md:table-cell">หน่วยกิต</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary hidden md:table-cell">ครูผู้สอน</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary hidden lg:table-cell">ห้องเรียน</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary text-right">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light">
                                    {filteredSubjects.map((s) => (
                                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3"><span className="badge-primary text-xs">{s.code}</span></td>
                                            <td className="px-4 py-3 text-sm font-semibold text-text-primary">{s.name}</td>
                                            <td className="px-4 py-3 text-sm text-text-secondary hidden md:table-cell">{s.credit}</td>
                                            <td className="px-4 py-3 text-sm text-text-secondary hidden md:table-cell">{s.teacher?.user?.firstName || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-text-secondary hidden lg:table-cell">
                                                {s.classroom ? `${s.classroom.grade?.level}/${s.classroom.roomNumber}` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => handleOpenModal(s)} className="btn-ghost p-2"><Pencil size={15} /></button>
                                                    <button onClick={() => handleDelete(s.id)} className="btn-ghost p-2 text-danger hover:bg-danger-light"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredSubjects.length === 0 && (
                                <div className="py-16 text-center">
                                    <BookOpen size={40} className="mx-auto text-text-muted mb-3" />
                                    <p className="text-text-secondary font-semibold">ไม่พบรายวิชา</p>
                                    <p className="text-sm text-text-muted mt-1">ลองค้นหาด้วยคำอื่น หรือเพิ่มวิชาใหม่</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSubject ? 'แก้ไขรายวิชา' : 'เพิ่มรายวิชาใหม่'} subtitle="กรอกข้อมูลรายวิชา">
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label">รหัสวิชา</label>
                                    <input required placeholder="ว21101" className="input-field" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label">หน่วยกิต</label>
                                    <input required type="number" step="0.5" className="input-field" value={formData.credit} onChange={(e) => setFormData({ ...formData, credit: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="label">ชื่อวิชา</label>
                                <input required placeholder="วิทยาศาสตร์พื้นฐาน..." className="input-field" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>

                            <div>
                                <label className="label">ครูผู้สอน</label>
                                <div className="relative">
                                    <select required className="select-field pr-10" value={formData.teacherId} onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}>
                                        <option value="">-- เลือกครูผู้สอน --</option>
                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.user?.firstName} {t.user?.lastName}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-border">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">ยกเลิก</button>
                                <button type="submit" className="btn-primary flex-1">{editingSubject ? 'บันทึก' : 'เพิ่มวิชา'}</button>
                            </div>
                        </form>
            </Modal>
        </AppShell>
    );
}
