"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { FolderHeart, Plus, Trash2, ExternalLink, Award, Activity, Briefcase, FileText, Heart, MoreHorizontal } from 'lucide-react';
import AppShell from '@/components/Layout/AppShell';
import Modal from '@/components/Common/Modal';
import api from '@/lib/api';
import { STUDENT_SIDEBAR } from '@/lib/sidebar';
import { useUser } from '@/lib/useUser';
import type { PortfolioItem, PortfolioCategory } from '@/lib/types';
import { toast } from 'sonner';

const CATEGORY_MAP: Record<PortfolioCategory, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    AWARD: { label: 'รางวัล', icon: <Award className="w-4 h-4" />, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    ACTIVITY: { label: 'กิจกรรม', icon: <Activity className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
    PROJECT: { label: 'โปรเจค', icon: <Briefcase className="w-4 h-4" />, color: 'text-purple-600', bg: 'bg-purple-50' },
    CERTIFICATE: { label: 'ใบประกาศ', icon: <FileText className="w-4 h-4" />, color: 'text-green-600', bg: 'bg-green-50' },
    VOLUNTEER: { label: 'จิตอาสา', icon: <Heart className="w-4 h-4" />, color: 'text-pink-600', bg: 'bg-pink-50' },
    OTHER: { label: 'อื่นๆ', icon: <MoreHorizontal className="w-4 h-4" />, color: 'text-gray-600', bg: 'bg-gray-50' },
};

export default function StudentPortfolioPage() {
    const { user } = useUser();
    const [items, setItems] = useState<PortfolioItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState<string>('ALL');

    const fetchItems = useCallback(async () => {
        try {
            const params: any = {};
            if (filter !== 'ALL') params.category = filter;
            const res = await api.get('/portfolio/my', { params });
            setItems(res.data);
        } catch { toast.error('โหลดข้อมูลไม่สำเร็จ'); }
        finally { setLoading(false); }
    }, [filter]);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบรายการนี้?')) return;
        try {
            await api.delete(`/portfolio/${id}`);
            toast.success('ลบสำเร็จ');
            fetchItems();
        } catch { toast.error('ลบไม่สำเร็จ'); }
    };

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        try {
            await api.post('/portfolio', {
                title: form.get('title'),
                description: form.get('description') || undefined,
                category: form.get('category'),
                fileUrl: form.get('fileUrl') || undefined,
                link: form.get('link') || undefined,
                date: form.get('date') || undefined,
                isPublic: form.get('isPublic') === 'on',
            });
            toast.success('เพิ่มผลงานสำเร็จ');
            setShowModal(false);
            fetchItems();
        } catch { toast.error('เพิ่มไม่สำเร็จ'); }
    };

    return (
        <AppShell role="STUDENT" sidebarItems={STUDENT_SIDEBAR} user={user}
            pageTitle="Portfolio ผลงาน"
            pageSubtitle={`${items.length} รายการ`}
        >
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <select value={filter} onChange={(e) => setFilter(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm">
                    <option value="ALL">ทั้งหมด</option>
                    {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                    ))}
                </select>
                <button onClick={() => setShowModal(true)}
                    className="ml-auto flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                    <Plus className="w-4 h-4" /> เพิ่มผลงาน
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
            ) : items.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <FolderHeart className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">ยังไม่มีผลงาน</p>
                    <p className="text-sm">กดปุ่ม &quot;เพิ่มผลงาน&quot; เพื่อเริ่มสร้าง Portfolio</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => {
                        const cat = CATEGORY_MAP[item.category];
                        return (
                            <div key={item.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cat.bg} ${cat.color}`}>
                                        {cat.icon} {cat.label}
                                    </span>
                                    <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500 p-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                                {item.description && <p className="text-sm text-gray-500 mb-2 line-clamp-2">{item.description}</p>}
                                {item.date && <p className="text-xs text-gray-400 mb-2">{new Date(item.date).toLocaleDateString('th-TH')}</p>}
                                <div className="flex items-center gap-2 mt-3">
                                    {item.fileUrl && (
                                        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer"
                                            className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                                            <ExternalLink className="w-3 h-3" /> ดูไฟล์
                                        </a>
                                    )}
                                    {item.link && (
                                        <a href={item.link} target="_blank" rel="noopener noreferrer"
                                            className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                                            <ExternalLink className="w-3 h-3" /> ลิงก์
                                        </a>
                                    )}
                                    <span className={`ml-auto text-xs ${item.isPublic ? 'text-green-500' : 'text-gray-400'}`}>
                                        {item.isPublic ? 'สาธารณะ' : 'ส่วนตัว'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="เพิ่มผลงาน">
                <form onSubmit={handleCreate} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผลงาน *</label>
                        <input name="title" required className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                        <textarea name="description" rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่ *</label>
                        <select name="category" required className="w-full px-3 py-2 border rounded-lg text-sm">
                            {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">URL ไฟล์/รูปภาพ</label>
                        <input name="fileUrl" type="url" className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="https://..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ลิงก์ภายนอก</label>
                        <input name="link" type="url" className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="https://..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
                        <input name="date" type="date" className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input name="isPublic" type="checkbox" defaultChecked className="rounded" /> แสดงเป็นสาธารณะ
                    </label>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm">ยกเลิก</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">บันทึก</button>
                    </div>
                </form>
            </Modal>
        </AppShell>
    );
}
