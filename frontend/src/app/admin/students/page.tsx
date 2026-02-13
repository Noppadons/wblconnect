"use client";

import React, { useEffect, useState } from 'react';
import { Users, Plus, Search, Pencil, Trash2, ChevronDown, GraduationCap, TrendingUp, AlertTriangle, Filter } from 'lucide-react';
import api, { API_URL } from '@/lib/api';
import { normalizeUrl } from '@/lib/url';
import { toast } from 'sonner';
import AppShell from '@/components/Layout/AppShell';
import ImageUpload from '@/components/Common/ImageUpload';
import Modal from '@/components/Common/Modal';
import KpiCard from '@/components/Dashboard/KpiCard';
import { ADMIN_SIDEBAR } from '@/lib/sidebar';

export default function AdminStudentsPage() {
    const [students, setStudents] = useState<any[]>([]);
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClassroom, setFilterClassroom] = useState<string>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [user, setUser] = useState<any>(null);

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', password: '',
        studentCode: '', classroomId: '', parentLineToken: '', avatarUrl: ''
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchStudents();
        fetchClassrooms();
    }, []);

    const fetchStudents = async () => {
        try { const res = await api.get('/admin/students'); setStudents(res.data); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchClassrooms = async () => {
        try { const res = await api.get('/admin/classrooms'); setClassrooms(res.data); }
        catch (err) { console.error(err); }
    };

    const handleOpenModal = (student: any = null) => {
        if (student) {
            setEditingStudent(student);
            setFormData({
                firstName: student.user?.firstName || '', lastName: student.user?.lastName || '',
                email: student.user?.email || '', password: '',
                studentCode: student.studentCode || '', classroomId: student.classroomId || '',
                parentLineToken: student.parentLineToken || '', avatarUrl: student.user?.avatarUrl || ''
            });
        } else {
            setEditingStudent(null);
            setFormData({ firstName: '', lastName: '', email: '', password: '', studentCode: '', classroomId: filterClassroom !== 'all' ? filterClassroom : '', parentLineToken: '', avatarUrl: '' });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('ยืนยันการลบนักเรียนคนนี้? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
            try {
                await api.delete(`/admin/students/${id}`);
                setStudents(students.filter(s => s.id !== id));
                toast.success('ลบข้อมูลนักเรียนเรียบร้อย');
            } catch { toast.error('เกิดข้อผิดพลาดในการลบข้อมูล'); }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.classroomId) { toast.error('กรุณาเลือกห้องเรียน'); return; }
        const toastId = toast.loading(editingStudent ? 'กำลังอัปเดต...' : 'กำลังเพิ่มนักเรียน...');
        const payload: any = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            studentCode: formData.studentCode,
            classroomId: formData.classroomId,
        };
        if (formData.email) payload.email = formData.email;
        if (formData.avatarUrl) payload.avatarUrl = formData.avatarUrl;
        if (formData.parentLineToken) payload.parentLineToken = formData.parentLineToken;
        if (formData.password) payload.password = formData.password;
        try {
            if (editingStudent) {
                await api.patch(`/admin/students/${editingStudent.id}`, payload);
                toast.success('อัปเดตข้อมูลเรียบร้อย', { id: toastId });
            } else {
                await api.post('/admin/students', payload);
                toast.success('เพิ่มนักเรียนเรียบร้อย', { id: toastId });
            }
            setIsModalOpen(false);
            fetchStudents();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด', { id: toastId });
        }
    };

    // Filter + Search
    const filteredStudents = students.filter(s => {
        const matchSearch = `${s.user?.firstName} ${s.user?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || s.studentCode?.includes(searchTerm);
        const matchClassroom = filterClassroom === 'all' || s.classroomId === filterClassroom;
        return matchSearch && matchClassroom;
    });

    // KPI
    const totalStudents = students.length;
    const avgGpa = totalStudents > 0 ? (students.reduce((sum, s) => sum + (s.gpa || 0), 0) / totalStudents).toFixed(2) : '0.00';
    const highGpaCount = students.filter(s => (s.gpa || 0) >= 3.5).length;
    const lowGpaCount = students.filter(s => (s.gpa || 0) < 2.0 && (s.gpa || 0) > 0).length;
    const lineConnected = students.filter(s => s.parentLineToken).length;

    return (
        <AppShell role="ADMIN" sidebarItems={ADMIN_SIDEBAR} user={user} pageTitle="จัดการนักเรียน"
            pageSubtitle={`ทั้งหมด ${totalStudents} คน • ${classrooms.length} ห้องเรียน`}
            headerActions={
                <button onClick={() => handleOpenModal()} className="btn-primary">
                    <Plus size={18} /> เพิ่มนักเรียน
                </button>
            }
        >
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* KPI */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <KpiCard title="นักเรียนทั้งหมด" value={totalStudents} icon={Users} color="primary" trendLabel="คน" />
                        <KpiCard title="GPA เฉลี่ย" value={avgGpa} icon={GraduationCap} color="success" trendLabel="ทั้งโรงเรียน" />
                        <KpiCard title="GPA ≥ 3.5" value={highGpaCount} icon={TrendingUp} color="success" trendLabel="คน" />
                        <KpiCard title="LINE ผู้ปกครอง" value={`${lineConnected}/${totalStudents}`} icon={Users} color="primary" trendLabel="เชื่อมต่อแล้ว" />
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                        <div className="relative w-full sm:w-52">
                            <select value={filterClassroom} onChange={(e) => setFilterClassroom(e.target.value)} className="select-field pr-10 font-semibold">
                                <option value="all">ทุกห้องเรียน ({totalStudents})</option>
                                {classrooms.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.grade?.level}/{c.roomNumber} ({c._count?.students || 0})
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                            <input type="text" placeholder="ค้นหาชื่อ หรือรหัสนักเรียน..." className="input-field pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        {filterClassroom !== 'all' && (
                            <button onClick={() => setFilterClassroom('all')} className="btn-ghost text-sm text-text-muted whitespace-nowrap">
                                <Filter size={14} /> ล้างตัวกรอง
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-border bg-slate-50/50">
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary w-12">#</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary">นักเรียน</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary hidden md:table-cell">รหัส</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary">ชั้นเรียน</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary hidden sm:table-cell">GPA</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary hidden lg:table-cell">อีเมล</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary hidden lg:table-cell">LINE</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary text-right">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light">
                                    {filteredStudents.map((s, i) => {
                                        const gpa = s.gpa?.toFixed(2) || '0.00';
                                        const gpaNum = s.gpa || 0;
                                        return (
                                            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-text-muted">{(i + 1).toString().padStart(2, '0')}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-slate-100 text-text-muted flex items-center justify-center text-sm font-semibold overflow-hidden border border-border">
                                                            {s.user?.avatarUrl ? (
                                                                <img src={normalizeUrl(s.user.avatarUrl)} className="w-full h-full object-cover" alt="" />
                                                            ) : (
                                                                s.user?.firstName?.[0] || 'S'
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-text-primary">{s.user?.firstName} {s.user?.lastName}</p>
                                                            <p className="text-xs text-text-muted md:hidden">#{s.studentCode}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 hidden md:table-cell">
                                                    <span className="text-sm text-text-secondary font-mono">#{s.studentCode}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="badge-primary">{s.classroom?.grade?.level}/{s.classroom?.roomNumber || '?'}</span>
                                                </td>
                                                <td className="px-4 py-3 hidden sm:table-cell">
                                                    <span className={`text-sm font-semibold ${gpaNum >= 3.0 ? 'text-green-600' : gpaNum < 2.0 && gpaNum > 0 ? 'text-red-600' : gpaNum === 0 ? 'text-text-muted' : 'text-amber-600'}`}>
                                                        {gpa}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 hidden lg:table-cell">
                                                    <span className="text-sm text-text-secondary">{s.user?.email || '-'}</span>
                                                </td>
                                                <td className="px-4 py-3 hidden lg:table-cell">
                                                    {s.parentLineToken ? (
                                                        <span className="badge-success">เชื่อมต่อแล้ว</span>
                                                    ) : (
                                                        <span className="text-xs text-text-muted">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <button onClick={() => handleOpenModal(s)} className="btn-ghost p-2" title="แก้ไข">
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button onClick={() => handleDelete(s.id)} className="btn-ghost p-2 text-danger hover:bg-danger-light" title="ลบ">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredStudents.length === 0 && (
                                <div className="py-16 text-center">
                                    <Users size={40} className="mx-auto text-text-muted mb-3" />
                                    <p className="text-text-secondary font-semibold">ไม่พบข้อมูลนักเรียน</p>
                                    <p className="text-sm text-text-muted mt-1">ลองค้นหาด้วยคำอื่น หรือเพิ่มนักเรียนใหม่</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Summary per classroom */}
                    {filterClassroom === 'all' && classrooms.length > 0 && (
                        <div className="mt-4 card p-4">
                            <h3 className="text-sm font-bold text-text-primary mb-3">สรุปรายห้องเรียน</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                {classrooms.map(c => {
                                    const count = c._count?.students || 0;
                                    const roomStudents = students.filter(s => s.classroomId === c.id);
                                    const roomAvgGpa = roomStudents.length > 0
                                        ? (roomStudents.reduce((sum: number, s: any) => sum + (s.gpa || 0), 0) / roomStudents.length).toFixed(2)
                                        : '-';
                                    return (
                                        <button key={c.id} onClick={() => setFilterClassroom(c.id)}
                                            className="p-3 rounded-xl border border-border bg-white hover:border-primary/30 hover:shadow-sm transition-all text-left">
                                            <p className="text-xs font-bold text-text-primary">{c.grade?.level}/{c.roomNumber}</p>
                                            <p className="text-lg font-bold text-primary">{count} <span className="text-xs font-normal text-text-muted">คน</span></p>
                                            <p className="text-[10px] text-text-muted">GPA {roomAvgGpa}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingStudent ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียนใหม่'} subtitle="กรอกข้อมูลให้ครบถ้วน">
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
                        <input required type="email" placeholder="student@school.com" className="input-field" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>

                    {!editingStudent && (
                        <div>
                            <label className="label">รหัสผ่าน</label>
                            <input required type="password" placeholder="อย่างน้อย 6 ตัวอักษร" className="input-field" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">รหัสประจำตัว</label>
                            <input required placeholder="เช่น 67001" className="input-field" value={formData.studentCode} onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">ห้องเรียน</label>
                            <div className="relative">
                                <select required className="select-field pr-10" value={formData.classroomId} onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}>
                                    <option value="">เลือกห้องเรียน</option>
                                    {classrooms.map(c => <option key={c.id} value={c.id}>{c.grade?.level}/{c.roomNumber}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="label">Line User ID ผู้ปกครอง</label>
                        <div className="flex gap-2">
                            <input placeholder="U..." className="input-field" value={formData.parentLineToken} onChange={(e) => setFormData({ ...formData, parentLineToken: e.target.value })} />
                            <button type="button" onClick={async () => {
                                const token = formData.parentLineToken.trim();
                                if (!token) return toast.error('กรุณาระบุ Line ID');
                                try { await api.post('/communication/test-line', { to: token }); toast.success('ส่งทดสอบสำเร็จ'); }
                                catch { toast.error('ส่งไม่สำเร็จ'); }
                            }} className="btn-secondary whitespace-nowrap text-xs">ทดสอบ</button>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-border">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">ยกเลิก</button>
                        <button type="submit" className="btn-primary flex-1">{editingStudent ? 'บันทึก' : 'เพิ่มนักเรียน'}</button>
                    </div>
                </form>
            </Modal>
        </AppShell>
    );
}
