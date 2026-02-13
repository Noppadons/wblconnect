"use client";

import React, { useEffect, useState } from 'react';
import { Briefcase, Plus, Search, Pencil, Trash2 } from 'lucide-react';
import api, { API_URL } from '@/lib/api';
import { normalizeUrl } from '@/lib/url';
import { toast } from 'sonner';
import AppShell from '@/components/Layout/AppShell';
import ImageUpload from '@/components/Common/ImageUpload';
import Modal from '@/components/Common/Modal';
import { ADMIN_SIDEBAR } from '@/lib/sidebar';

export default function AdminTeachersPage() {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<any>(null);
    const [user, setUser] = useState<any>(null);

    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', avatarUrl: '' });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try { const res = await api.get('/admin/teachers'); setTeachers(res.data); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleOpenModal = (teacher: any = null) => {
        if (teacher) {
            setEditingTeacher(teacher);
            setFormData({ firstName: teacher.user?.firstName || '', lastName: teacher.user?.lastName || '', email: teacher.user?.email || '', password: '', avatarUrl: teacher.user?.avatarUrl || '' });
        } else {
            setEditingTeacher(null);
            setFormData({ firstName: '', lastName: '', email: '', password: '', avatarUrl: '' });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('ยืนยันการลบบุคลากรครูท่านนี้?')) {
            try {
                await api.delete(`/admin/teachers/${id}`);
                setTeachers(teachers.filter(t => t.id !== id));
                toast.success('ลบข้อมูลครูเรียบร้อย');
            } catch { toast.error('เกิดข้อผิดพลาดในการลบข้อมูล'); }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const toastId = toast.loading('กำลังบันทึก...');
        const payload = {
            ...formData,
            avatarUrl: formData.avatarUrl || undefined,
            password: formData.password || undefined,
        };
        try {
            if (editingTeacher) {
                await api.patch(`/admin/teachers/${editingTeacher.id}`, payload);
                toast.success('อัปเดตข้อมูลเรียบร้อย', { id: toastId });
            } else {
                await api.post('/admin/teachers', payload);
                toast.success('เพิ่มบุคลากรเรียบร้อย', { id: toastId });
            }
            setIsModalOpen(false);
            fetchTeachers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด', { id: toastId });
        }
    };

    const filteredTeachers = teachers.filter(t =>
        `${t.user?.firstName} ${t.user?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AppShell role="ADMIN" sidebarItems={ADMIN_SIDEBAR} user={user} pageTitle="จัดการบุคลากร" pageSubtitle={`ทั้งหมด ${teachers.length} คน`}
            headerActions={
                <button onClick={() => handleOpenModal()} className="btn-primary">
                    <Plus size={18} /> เพิ่มบุคลากร
                </button>
            }
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
                            <input type="text" placeholder="ค้นหาชื่อ หรืออีเมล..." className="input-field pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-border bg-slate-50/50">
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary">บุคลากร</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary">ประจำชั้น</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary hidden md:table-cell">อีเมล</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary text-right">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light">
                                    {filteredTeachers.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-semibold overflow-hidden border border-blue-100">
                                                        {t.user?.avatarUrl ? (
                                                            <img src={normalizeUrl(t.user.avatarUrl)} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            t.user?.firstName?.[0] || 'T'
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-text-primary">{t.user?.firstName} {t.user?.lastName}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {t.homeroomClass ? (
                                                    <span className="badge-primary">{t.homeroomClass.grade?.level}/{t.homeroomClass.roomNumber}</span>
                                                ) : (
                                                    <span className="text-xs text-text-muted">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <span className="text-sm text-text-secondary">{t.user?.email || '-'}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => handleOpenModal(t)} className="btn-ghost p-2" title="แก้ไข"><Pencil size={16} /></button>
                                                    <button onClick={() => handleDelete(t.id)} className="btn-ghost p-2 text-danger hover:bg-danger-light" title="ลบ"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredTeachers.length === 0 && (
                                <div className="py-16 text-center">
                                    <Briefcase size={40} className="mx-auto text-text-muted mb-3" />
                                    <p className="text-text-secondary font-semibold">ไม่พบบุคลากรที่ค้นหา</p>
                                    <p className="text-sm text-text-muted mt-1">ลองค้นหาด้วยคำอื่น หรือเพิ่มบุคลากรใหม่</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTeacher ? 'แก้ไขข้อมูลบุคลากร' : 'เพิ่มบุคลากรใหม่'} subtitle="กรอกข้อมูลให้ครบถ้วน">
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <ImageUpload value={formData.avatarUrl} onChange={(url) => setFormData({ ...formData, avatarUrl: url })} label="รูปโปรไฟล์" aspectRatio="any" />

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">ชื่อจริง</label>
                            <input required className="input-field" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">นามสกุล</label>
                            <input required className="input-field" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <label className="label">อีเมล</label>
                        <input required type="email" placeholder="teacher@school.com" className="input-field" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>

                    {!editingTeacher && (
                        <div>
                            <label className="label">รหัสผ่าน</label>
                            <input required type="password" placeholder="อย่างน้อย 6 ตัวอักษร" className="input-field" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                        </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-border">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">ยกเลิก</button>
                        <button type="submit" className="btn-primary flex-1">{editingTeacher ? 'บันทึก' : 'เพิ่มบุคลากร'}</button>
                    </div>
                </form>
            </Modal>
        </AppShell>
    );
}
