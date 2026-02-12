"use client";

import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, FileText, Trash2, Download, Upload, Search, Filter, X, ChevronDown } from 'lucide-react';
import AppShell from '@/components/Layout/AppShell';
import Modal from '@/components/Common/Modal';
import api from '@/lib/api';
import { toast } from 'sonner';
import { TEACHER_SIDEBAR } from '@/lib/sidebar';

export default function TeacherMaterialsPage() {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Form state
    const [formData, setFormData] = useState({ title: '', description: '', fileUrl: '', fileType: '' });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchMySubjects();
    }, []);

    useEffect(() => {
        if (selectedSubject) fetchMaterials(selectedSubject);
    }, [selectedSubject]);

    const fetchMySubjects = async () => {
        try {
            const res = await api.get('/school/subjects');
            setSubjects(res.data);
            if (res.data.length > 0) setSelectedSubject(res.data[0].id);
        } catch (err) {
            console.error(err);
            toast.error('ไม่สามารถดึงข้อมูลรายวิชาได้');
        } finally {
            setLoading(false);
        }
    };

    const fetchMaterials = async (subjectId: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/school/materials?subjectId=${subjectId}`);
            setMaterials(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const toastId = toast.loading('กำลังอัปโหลดไฟล์...');
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await api.post('/upload/document', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData(prev => ({
                ...prev,
                fileUrl: res.data.url,
                fileType: res.data.type || file.name.split('.').pop() || 'file'
            }));
            toast.success('อัปโหลดไฟล์สำเร็จ', { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error('อัปโหลดไฟล์ล้มเหลว', { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fileUrl) return toast.error('กรุณาอัปโหลดไฟล์');

        try {
            await api.post('/school/materials', {
                ...formData,
                subjectId: selectedSubject
            });
            toast.success('เพิ่มเอกสารเรียบร้อย');
            setIsModalOpen(false);
            setFormData({ title: '', description: '', fileUrl: '', fileType: '' });
            fetchMaterials(selectedSubject);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('คุณต้องการลบเอกสารนี้ใช่หรือไม่?')) return;
        try {
            await api.delete(`/school/materials/${id}`);
            toast.success('ลบเอกสารแล้ว');
            fetchMaterials(selectedSubject);
        } catch (err) {
            toast.error('ลบไม่สำเร็จ');
        }
    };

    const getFileIcon = (type: string) => {
        const t = (type || '').toLowerCase();
        if (['pdf'].includes(t)) return <FileText className="text-rose-500" size={24} />;
        if (['doc', 'docx'].includes(t)) return <FileText className="text-blue-500" size={24} />;
        if (['xls', 'xlsx'].includes(t)) return <FileText className="text-emerald-500" size={24} />;
        if (['ppt', 'pptx'].includes(t)) return <FileText className="text-orange-500" size={24} />;
        return <FileText className="text-slate-500" size={24} />;
    };

    return (
        <AppShell role="TEACHER" sidebarItems={TEACHER_SIDEBAR} user={user} pageTitle="คลังเอกสารการสอน" pageSubtitle="จัดการไฟล์เอกสารประกอบการสอนรายวิชา">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <div className="relative">
                        <select className="select-field pl-10 pr-10" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code}) - {s.classroom ? `${s.classroom.grade.level}/${s.classroom.roomNumber}` : 'ทั่วไป'}</option>)}
                        </select>
                        <BookOpen size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    </div>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn-primary w-full md:w-auto">
                    <Plus size={18} /> เพิ่มเอกสาร
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {materials.map((m: any) => (
                        <div key={m.id} className="card p-4 group">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                                    {getFileIcon(m.fileType)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-bold text-text-primary truncate mb-0.5">{m.title}</h3>
                                    <p className="text-xs text-text-muted line-clamp-1 mb-2">{m.description || 'ไม่มีคำอธิบาย'}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{m.fileType || 'FILE'}</span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${m.fileUrl}`} target="_blank" rel="noreferrer" title="ดาวน์โหลด"
                                                className="p-1.5 text-text-muted hover:text-primary transition-colors">
                                                <Download size={16} />
                                            </a>
                                            <button onClick={() => handleDelete(m.id)} title="ลบ" className="p-1.5 text-text-muted hover:text-red-500 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {materials.length === 0 && (
                        <div className="col-span-full py-20 text-center card bg-slate-50 border-dashed">
                            <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-base font-bold text-text-secondary">ยังไม่มีเอกสารในวิชานี้</h3>
                            <p className="text-sm text-text-muted mt-1">คลิกปุ่ม "เพิ่มเอกสาร" เพื่อเริ่มต้นอัปโหลดไฟล์</p>
                        </div>
                    )}
                </div>
            )}

            {/* Upload Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="เพิ่มเอกสารการสอน">
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="label">ชื่อเอกสาร</label>
                        <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="เช่น ใบความรู้ที่ 1 เรื่อง..." className="input-field" />
                    </div>
                    <div>
                        <label className="label">คำอธิบาย (ถ้ามี)</label>
                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="ระบุรายละเอียดสั้นๆ..." className="input-field h-24 resize-none" />
                    </div>
                    <div>
                        <label className="label">ไฟล์เอกสาร</label>
                        {formData.fileUrl ? (
                            <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <FileText className="text-emerald-600 shrink-0" size={18} />
                                    <span className="text-xs font-semibold text-emerald-800 truncate">อัปโหลดสำเร็จ ({formData.fileType})</span>
                                </div>
                                <button type="button" onClick={() => setFormData({ ...formData, fileUrl: '', fileType: '' })} className="text-emerald-700 hover:text-red-500">
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 hover:border-primary/50'}`}>
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload size={24} className="text-text-muted mb-2" />
                                    <p className="text-sm text-text-muted">คลิกเพื่ออัปโหลดไฟล์</p>
                                    <p className="text-[10px] text-slate-400 mt-1">PDF, Document, Image (สูงสุด 20MB)</p>
                                </div>
                                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                            </label>
                        )}
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-border">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">ยกเลิก</button>
                        <button type="submit" disabled={!formData.fileUrl || uploading} className="btn-primary flex-1 disabled:opacity-50">
                            ยืนยันเพิ่มเอกสาร
                        </button>
                    </div>
                </form>
            </Modal>
        </AppShell>
    );
}
