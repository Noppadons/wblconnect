"use client";

import React, { useEffect, useState } from 'react';
import { Megaphone, Plus, Trash2, Send, Bell, AlertCircle, Calendar } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import AppShell from '@/components/Layout/AppShell';
import ImageUpload from '@/components/Common/ImageUpload';
import Modal from '@/components/Common/Modal';
import { ADMIN_SIDEBAR } from '@/lib/sidebar';

export default function AdminCommunicationPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [formData, setFormData] = useState({ title: '', content: '', type: 'ANNOUNCEMENT', imageUrl: '' });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try { const res = await api.get('/communication/notifications'); setNotifications(res.data); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const toastId = toast.loading('กำลังส่งประกาศ...');
        try {
            await api.post('/communication/notifications', formData);
            toast.success('ส่งประกาศเรียบร้อย', { id: toastId });
            setShowModal(false);
            setFormData({ title: '', content: '', type: 'ANNOUNCEMENT', imageUrl: '' });
            fetchNotifications();
        } catch { toast.error('เกิดข้อผิดพลาด', { id: toastId }); }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('ยืนยันการลบประกาศนี้?')) return;
        try { await api.delete(`/communication/notifications/${id}`); toast.success('ลบสำเร็จ'); fetchNotifications(); }
        catch { toast.error('เกิดข้อผิดพลาด'); }
    };

    return (
        <AppShell role="ADMIN" sidebarItems={ADMIN_SIDEBAR} user={user} pageTitle="ข่าวสารและประกาศ" pageSubtitle={`ทั้งหมด ${notifications.length} รายการ`}
            headerActions={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={18} /> สร้างประกาศ</button>}
        >
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((note) => (
                        <div key={note.id} className="card p-5 hover:shadow-card transition-shadow duration-200 group">
                            <div className="flex items-start gap-4">
                                <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden ${
                                    note.type === 'ALERT' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                    {note.imageUrl ? (
                                        <img src={note.imageUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        note.type === 'ALERT' ? <AlertCircle size={20} /> : <Megaphone size={20} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-sm font-semibold text-text-primary">{note.title}</h3>
                                                <span className={note.type === 'ALERT' ? 'badge-danger' : 'badge-primary'}>
                                                    {note.type === 'ALERT' ? 'ด่วน' : 'ประกาศ'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-text-secondary line-clamp-2">{note.content}</p>
                                        </div>
                                        <button onClick={() => handleDelete(note.id)} className="btn-ghost p-2 text-text-muted opacity-0 group-hover:opacity-100 hover:text-danger hover:bg-danger-light shrink-0">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(note.createdAt).toLocaleDateString('th-TH', { dateStyle: 'long' })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {notifications.length === 0 && (
                        <div className="py-16 text-center card">
                            <Megaphone size={40} className="mx-auto text-text-muted mb-3" />
                            <p className="text-text-secondary font-semibold">ยังไม่มีประกาศ</p>
                            <p className="text-sm text-text-muted mt-1">กดปุ่ม "สร้างประกาศ" เพื่อเริ่มต้น</p>
                        </div>
                    )}
                </div>
            )}

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="สร้างประกาศใหม่" subtitle="กรอกข้อมูลประกาศ">
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="label">หัวข้อ</label>
                                <input required placeholder="เช่น กำหนดการสอบปลายภาค..." className="input-field" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                            </div>

                            <div>
                                <label className="label">เนื้อหา</label>
                                <textarea required rows={4} placeholder="รายละเอียดประกาศ..." className="input-field resize-none" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} />
                            </div>

                            <div>
                                <label className="label">ประเภท</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => setFormData({ ...formData, type: 'ANNOUNCEMENT' })}
                                        className={`py-2.5 rounded-lg text-sm font-semibold transition-colors ${formData.type === 'ANNOUNCEMENT' ? 'bg-primary text-white' : 'bg-slate-50 text-text-secondary border border-border'}`}>
                                        ประกาศทั่วไป
                                    </button>
                                    <button type="button" onClick={() => setFormData({ ...formData, type: 'ALERT' })}
                                        className={`py-2.5 rounded-lg text-sm font-semibold transition-colors ${formData.type === 'ALERT' ? 'bg-danger text-white' : 'bg-slate-50 text-text-secondary border border-border'}`}>
                                        แจ้งเตือนด่วน
                                    </button>
                                </div>
                            </div>

                            <ImageUpload label="รูปภาพประกอบ (ไม่บังคับ)" value={formData.imageUrl} onChange={(url) => setFormData({ ...formData, imageUrl: url })} aspectRatio="video" />

                            <div className="flex gap-3 pt-4 border-t border-border">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">ยกเลิก</button>
                                <button type="submit" className="btn-primary flex-1"><Send size={16} /> ส่งประกาศ</button>
                            </div>
                        </form>
            </Modal>
        </AppShell>
    );
}
