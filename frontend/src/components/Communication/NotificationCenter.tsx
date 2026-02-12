"use client";

import React, { useEffect, useState } from 'react';
import { Bell, Megaphone, AlertCircle, Info, Pin, CheckCircle, X, ExternalLink } from 'lucide-react';
import api, { API_URL } from '@/lib/api';
import { toast } from 'sonner';

export default function NotificationCenter({ targetId }: { targetId?: string }) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedNote, setSelectedNote] = useState<any>(null);

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
    }, [targetId]);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/communication/notifications', { params: { targetId } });
            setNotifications(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchUnreadCount = async () => {
        try {
            const res = await api.get('/communication/notifications/unread-count', { params: { targetId } });
            setUnreadCount(res.data.count);
        } catch (err) { console.error(err); }
    };

    const markAsRead = async (id: string) => {
        try {
            console.log('[NotificationCenter] Marking as read:', id);
            await api.post(`/communication/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            fetchUnreadCount();
        } catch (err: any) {
            console.error('[NotificationCenter] Error marking as read:', err);
            if (err.response) {
                console.error('[NotificationCenter] Error response data:', err.response.data);
                toast.error(`ไม่สามารถทำเครื่องหมายว่าอ่านแล้ว: ${err.response.data.message || 'Error'}`);
            }
        }
    };

    const handleNoteClick = async (note: any) => {
        setSelectedNote(note);
        if (!note.isRead) {
            await markAsRead(note.id);
        }
    };

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <Megaphone size={16} className="text-amber-500" />
                    ข่าวสารประกาศ
                </h3>
                {unreadCount > 0 && <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">{unreadCount}</span>}
                <span className="text-[10px] bg-slate-100 text-text-muted px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{notifications.length} รายการ</span>
            </div>

            {loading ? (
                <div className="py-8 flex justify-center">
                    <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : notifications.length > 0 ? (
                <div className="space-y-1">
                    {notifications.map((note) => (
                        <div key={note.id} onClick={() => handleNoteClick(note)}
                            className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer group relative ${note.isPinned ? 'bg-primary/5 border border-primary/10 shadow-sm' : 'hover:bg-slate-50 border border-transparent'} ${!note.isRead ? 'ring-1 ring-blue-500/10' : ''}`}>

                            {!note.isRead && <div className="absolute top-3 left-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}

                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden ${note.type === 'ALERT' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                                {note.imageUrl ? (
                                    <img src={note.imageUrl.startsWith('http') ? note.imageUrl : `${API_URL}${note.imageUrl}`} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    note.type === 'ALERT' ? <AlertCircle size={22} /> : (note.isPinned ? <Pin size={22} className="fill-current" /> : <Info size={22} />)
                                )}
                            </div>
                            <div className="flex-1 min-w-0 py-0.5">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            {note.isPinned && <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-1.5 rounded">ปักหมุด</span>}
                                            <p className={`text-[15px] font-bold truncate ${!note.isRead ? 'text-text-primary' : 'text-text-secondary'}`}>{note.title}</p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] text-text-muted shrink-0 font-medium bg-slate-100 px-2 py-0.5 rounded-full">{new Date(note.createdAt).toLocaleDateString('th-TH')}</span>
                                </div>
                                <p className="text-[13px] text-text-muted line-clamp-1 mt-1 leading-relaxed">{note.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-12 text-center">
                    <Bell size={32} className="mx-auto text-text-muted/50 mb-3" />
                    <p className="text-sm text-text-secondary font-medium">ยังไม่มีประกาศล่าสุด</p>
                </div>
            )}

            {/* Notification Detail Modal */}
            {selectedNote && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300 animate-in fade-in" onClick={() => setSelectedNote(null)} />
                    <div className="relative bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col max-h-[90vh]">
                        {/* Header Image with Container Logic */}
                        {selectedNote.imageUrl ? (
                            <div className="w-full h-64 sm:h-80 relative bg-slate-50 border-b border-slate-100">
                                <img
                                    src={selectedNote.imageUrl.startsWith('http') ? selectedNote.imageUrl : `${API_URL}${selectedNote.imageUrl}`}
                                    alt=""
                                    className="relative w-full h-full object-contain z-10 p-2"
                                />
                                {/* Blurred Background Placeholder for premium feel */}
                                <img
                                    src={selectedNote.imageUrl.startsWith('http') ? selectedNote.imageUrl : `${API_URL}${selectedNote.imageUrl}`}
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-20"
                                />
                            </div>
                        ) : (
                            <div className="w-full h-32 bg-gradient-to-br from-primary/5 to-blue-50 border-b border-border/50 flex items-center justify-center">
                                <Megaphone size={48} className="text-primary/20" />
                            </div>
                        )}

                        <div className="p-8 sm:p-10 overflow-y-auto custom-scrollbar flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-6">
                                <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest ${selectedNote.type === 'ALERT' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {selectedNote.type === 'ALERT' ? 'ข้อมูลด่วน' : 'ข่าวประชาสัมพันธ์'}
                                </span>
                                {selectedNote.isPinned && (
                                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                        <Pin size={12} className="fill-current" /> สำคัญมาก
                                    </span>
                                )}
                                <span className="text-[12px] text-text-muted font-bold ml-auto bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                    {new Date(selectedNote.createdAt).toLocaleDateString('th-TH', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })} น.
                                </span>
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-black text-text-primary mb-6 leading-[1.2] tracking-tight">{selectedNote.title}</h2>

                            <div className="text-text-secondary text-[16px] sm:text-[17px] leading-[1.8] whitespace-pre-wrap font-medium">
                                {selectedNote.content}
                            </div>
                        </div>

                        <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                            <button onClick={() => setSelectedNote(null)} className="btn-primary w-full py-4 text-base font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]">
                                เข้าใจแล้ว
                            </button>
                        </div>

                        <button onClick={() => setSelectedNote(null)} className="absolute top-4 right-4 bg-white/60 backdrop-blur-md shadow-sm p-2 rounded-full hover:bg-white text-text-muted hover:text-text-primary transition-all z-20 hover:rotate-90 duration-300">
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
