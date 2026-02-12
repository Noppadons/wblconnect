"use client";

import React, { useEffect, useState } from 'react';
import { Megaphone, Plus, Trash2, Send, Bell, AlertCircle, Calendar, Pin, Link, Globe, Users } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import AppShell from '@/components/Layout/AppShell';
import ImageUpload from '@/components/Common/ImageUpload';
import Modal from '@/components/Common/Modal';
import { ADMIN_SIDEBAR } from '@/lib/sidebar';

export default function AdminCommunicationPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'ANNOUNCEMENT',
        imageUrl: '',
        targetId: '', // Default to Global
        isPinned: false,
        expiresAt: '',
        sendLine: false
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchNotifications();
        fetchClassrooms();
    }, []);

    const fetchClassrooms = async () => {
        try {
            const res = await api.get('/school/classrooms');
            setClassrooms(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchNotifications = async () => {
        try { const res = await api.get('/communication/notifications'); setNotifications(res.data); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const toastId = toast.loading('กำลังส่งประกาศ...');
        try {
            const payload = {
                ...formData,
                targetId: formData.targetId || null,
                expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null
            };
            await api.post('/communication/notifications', payload);
            toast.success('ส่งประกาศเรียบร้อย', { id: toastId });
            setShowModal(false);
            setFormData({
                title: '',
                content: '',
                type: 'ANNOUNCEMENT',
                imageUrl: '',
                targetId: '',
                isPinned: false,
                expiresAt: '',
                sendLine: false
            });
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
                                <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden ${note.type === 'ALERT' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
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
                                                {note.isPinned && <Pin size={12} className="text-primary fill-primary" />}
                                                <h3 className="text-sm font-semibold text-text-primary">{note.title}</h3>
                                                <span className={note.type === 'ALERT' ? 'badge-danger' : 'badge-primary'}>
                                                    {note.type === 'ALERT' ? 'ด่วน' : 'ประกาศ'}
                                                </span>
                                                {note.targetId ? (
                                                    <span className="badge-secondary flex items-center gap-1"><Users size={10} /> {classrooms.find(c => c.id === note.targetId)?.name || 'เฉพาะกลุ่ม'}</span>
                                                ) : (
                                                    <span className="badge-secondary flex items-center gap-1"><Globe size={10} /> ทั้งหมด</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-text-secondary line-clamp-2">{note.content}</p>
                                        </div>
                                        <button onClick={() => handleDelete(note.id)} className="btn-ghost p-2 text-text-muted opacity-0 group-hover:opacity-100 hover:text-danger hover:bg-danger-light shrink-0">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-[10px] text-text-muted font-medium uppercase tracking-wider">
                                        <span className="flex items-center gap-1"><Calendar size={12} /> วันที่สร้าง: {new Date(note.createdAt).toLocaleDateString('th-TH')}</span>
                                        {note.expiresAt && (
                                            <span className="flex items-center gap-1 text-amber-600"><AlertCircle size={12} /> หมดอายุ: {new Date(note.expiresAt).toLocaleDateString('th-TH')}</span>
                                        )}
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
                                className={`py-2 rounded-lg text-xs font-semibold transition-colors ${formData.type === 'ANNOUNCEMENT' ? 'bg-primary text-white border-primary' : 'bg-slate-50 text-text-secondary border border-border'}`}>
                                ประกาศทั่วไป
                            </button>
                            <button type="button" onClick={() => setFormData({ ...formData, type: 'ALERT' })}
                                className={`py-2 rounded-lg text-xs font-semibold transition-colors ${formData.type === 'ALERT' ? 'bg-danger text-white border-danger' : 'bg-slate-50 text-text-secondary border border-border'}`}>
                                แจ้งเตือนด่วน
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">กลุ่มเป้าหมาย</label>
                            <select className="input-field text-sm" value={formData.targetId} onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}>
                                <option value="">ทุกคน (Global)</option>
                                {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">วันหมดอายุ (ไม่บังคับ)</label>
                            <input type="date" className="input-field text-sm" value={formData.expiresAt} onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })} />
                        </div>
                    </div>

                    <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl border border-border">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary" checked={formData.isPinned} onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })} />
                            <span className="text-xs font-bold text-text-secondary group-hover:text-primary transition-colors">ปักหมุดไว้บนสุด</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group border-l border-slate-200 pl-6">
                            <input type="checkbox" className="w-4 h-4 rounded border-border text-green-600 focus:ring-green-500" checked={formData.sendLine} onChange={(e) => setFormData({ ...formData, sendLine: e.target.checked })} />
                            <span className="text-xs font-bold text-text-secondary group-hover:text-green-600 transition-colors">ส่งเข้า LINE (Broadcast)</span>
                        </label>
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
