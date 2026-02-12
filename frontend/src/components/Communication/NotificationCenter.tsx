"use client";

import React, { useEffect, useState } from 'react';
import { Bell, Megaphone, AlertCircle, Info } from 'lucide-react';
import api from '@/lib/api';

export default function NotificationCenter({ targetId }: { targetId?: string }) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, [targetId]);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/communication/notifications', { params: { targetId } });
            setNotifications(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <Megaphone size={16} className="text-amber-500" />
                    ประกาศ
                </h3>
                <span className="text-xs text-text-muted">{notifications.length} รายการ</span>
            </div>

            {loading ? (
                <div className="py-8 flex justify-center">
                    <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : notifications.length > 0 ? (
                <div className="space-y-1">
                    {notifications.map((note) => (
                        <div key={note.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${note.type === 'ALERT' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                                {note.imageUrl ? (
                                    <img src={note.imageUrl.startsWith('http') ? note.imageUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${note.imageUrl}`} className="w-full h-full object-cover rounded-lg" alt="" />
                                ) : (
                                    note.type === 'ALERT' ? <AlertCircle size={16} /> : <Info size={16} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-2">
                                    <p className="text-sm font-medium text-text-primary group-hover:text-primary truncate">{note.title}</p>
                                    <span className="text-[11px] text-text-muted shrink-0">{new Date(note.createdAt).toLocaleDateString('th-TH')}</span>
                                </div>
                                <p className="text-xs text-text-muted line-clamp-2 mt-0.5">{note.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-10 text-center">
                    <Bell size={28} className="mx-auto text-text-muted mb-2" />
                    <p className="text-sm text-text-secondary">ยังไม่มีประกาศ</p>
                </div>
            )}
        </div>
    );
}
