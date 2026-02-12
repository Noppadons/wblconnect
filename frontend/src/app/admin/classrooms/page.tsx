"use client";

import React, { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, School, Users, User, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import AppShell from '@/components/Layout/AppShell';
import KpiCard from '@/components/Dashboard/KpiCard';
import Modal from '@/components/Common/Modal';
import { ADMIN_SIDEBAR } from '@/lib/sidebar';

export default function AdminClassroomsPage() {
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClassroom, setEditingClassroom] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [formData, setFormData] = useState({ gradeLevel: '', roomNumber: '', homeroomTeacherId: '', semesterId: '2024-2', lineToken: '' });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchClassrooms();
        fetchTeachers();
    }, []);

    const fetchClassrooms = async () => {
        try { const res = await api.get('/admin/classrooms'); setClassrooms(res.data); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchTeachers = async () => {
        try { const res = await api.get('/admin/teachers'); setTeachers(res.data); }
        catch (err) { console.error(err); }
    };

    const handleOpenModal = (classroom: any = null) => {
        if (classroom) {
            setEditingClassroom(classroom);
            setFormData({ gradeLevel: classroom.grade?.level || '', roomNumber: classroom.roomNumber || '', homeroomTeacherId: classroom.homeroomTeacherId || '', semesterId: classroom.semesterId || '2024-2', lineToken: classroom.lineToken || '' });
        } else {
            setEditingClassroom(null);
            setFormData({ gradeLevel: '', roomNumber: '', homeroomTeacherId: '', semesterId: '2024-2', lineToken: '' });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('ยืนยันการลบห้องเรียนนี้?')) {
            try {
                await api.delete(`/admin/classrooms/${id}`);
                setClassrooms(classrooms.filter(c => c.id !== id));
                toast.success('ลบห้องเรียนสำเร็จ');
            } catch { toast.error('เกิดข้อผิดพลาดในการลบ'); }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const toastId = toast.loading('กำลังบันทึก...');
        try {
            if (editingClassroom) {
                await api.patch(`/admin/classrooms/${editingClassroom.id}`, formData);
                toast.success('อัปเดตเรียบร้อย', { id: toastId });
            } else {
                await api.post('/admin/classrooms', formData);
                toast.success('สร้างห้องเรียนสำเร็จ', { id: toastId });
            }
            setIsModalOpen(false);
            fetchClassrooms();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด', { id: toastId });
        }
    };

    const totalStudents = classrooms.reduce((acc, c) => acc + (c._count?.students || 0), 0);

    return (
        <AppShell role="ADMIN" sidebarItems={ADMIN_SIDEBAR} user={user} pageTitle="จัดการห้องเรียน" pageSubtitle={`ทั้งหมด ${classrooms.length} ห้อง`}
            headerActions={<button onClick={() => handleOpenModal()} className="btn-primary"><Plus size={18} /> เพิ่มห้องเรียน</button>}
        >
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* KPI */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <KpiCard title="ห้องเรียน" value={classrooms.length} icon={School} color="primary" trendLabel="ห้อง" />
                        <KpiCard title="นักเรียนทั้งหมด" value={totalStudents} icon={Users} color="success" trendLabel="คน" />
                        <KpiCard title="เฉลี่ย/ห้อง" value={classrooms.length > 0 ? (totalStudents / classrooms.length).toFixed(1) : 0} icon={Users} color="warning" trendLabel="คน" />
                        <KpiCard title="มีครูประจำชั้น" value={classrooms.filter(c => c.homeroomTeacher).length} icon={User} color="purple" trendLabel="ห้อง" />
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {classrooms.map((c) => (
                            <div key={c.id} className="card p-5 hover:shadow-card transition-shadow duration-200">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg">
                                            {c.grade?.level}/{c.roomNumber}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-text-primary">ชั้น {c.grade?.level}/{c.roomNumber}</p>
                                            <p className="text-xs text-text-muted">{c._count?.students || 0} คน</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleOpenModal(c)} className="btn-ghost p-2"><Pencil size={15} /></button>
                                        <button onClick={() => handleDelete(c.id)} className="btn-ghost p-2 text-danger hover:bg-danger-light"><Trash2 size={15} /></button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-text-secondary">ครูประจำชั้น</span>
                                        {c.homeroomTeacher ? (
                                            <span className="font-medium text-text-primary">ครู{c.homeroomTeacher.user?.firstName}</span>
                                        ) : (
                                            <span className="text-text-muted text-xs">ยังไม่กำหนด</span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-text-muted">ภาคเรียน {c.semesterId || '2024/1'}</span>
                                        {c.lineToken ? <span className="badge-success text-[10px]">LINE</span> : null}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {classrooms.length === 0 && (
                            <div className="col-span-full py-16 text-center card">
                                <School size={40} className="mx-auto text-text-muted mb-3" />
                                <p className="text-text-secondary font-semibold">ยังไม่มีห้องเรียน</p>
                                <p className="text-sm text-text-muted mt-1">กดปุ่ม "เพิ่มห้องเรียน" เพื่อเริ่มต้น</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingClassroom ? 'แก้ไขห้องเรียน' : 'เพิ่มห้องเรียนใหม่'} subtitle="กรอกข้อมูลให้ครบถ้วน">
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label">ระดับชั้น</label>
                                    <input required placeholder="เช่น ม.1" className="input-field" value={formData.gradeLevel} onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label">ห้องที่</label>
                                    <input required placeholder="เช่น 1" className="input-field" value={formData.roomNumber} onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="label">ครูประจำชั้น</label>
                                <div className="relative">
                                    <select className="select-field pr-10" value={formData.homeroomTeacherId} onChange={(e) => setFormData({ ...formData, homeroomTeacherId: e.target.value })}>
                                        <option value="">-- ยังไม่กำหนด --</option>
                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.user?.firstName} {t.user?.lastName}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
                                </div>
                            </div>

                            <div>
                                <label className="label">Line Group Token</label>
                                <div className="flex gap-2">
                                    <input placeholder="Channel / Group Token..." className="input-field" value={formData.lineToken} onChange={(e) => setFormData({ ...formData, lineToken: e.target.value })} />
                                    <button type="button" onClick={async () => {
                                        const token = formData.lineToken.trim();
                                        if (!token) return toast.error('กรุณาระบุ Token');
                                        try { await api.post('/communication/test-line', { to: token }); toast.success('ส่งทดสอบสำเร็จ'); }
                                        catch { toast.error('ส่งไม่สำเร็จ'); }
                                    }} className="btn-secondary whitespace-nowrap text-xs">ทดสอบ</button>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-border">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">ยกเลิก</button>
                                <button type="submit" className="btn-primary flex-1">{editingClassroom ? 'บันทึก' : 'สร้างห้องเรียน'}</button>
                            </div>
                        </form>
            </Modal>
        </AppShell>
    );
}
