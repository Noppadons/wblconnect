"use client";

import React, { useEffect, useState } from 'react';
import { Settings, Save, School, Globe, Phone, Mail, ShieldCheck, Bell, Database, Lock } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import AppShell from '@/components/Layout/AppShell';
import { ADMIN_SIDEBAR } from '@/lib/sidebar';
import { useUser } from '@/lib/useUser';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<any>({ name: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try { const res = await api.get('/admin/settings'); setSettings(res.data); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        const toastId = toast.loading('กำลังบันทึก...');
        try {
            await api.patch('/admin/settings', settings);
            toast.success('บันทึกเรียบร้อย', { id: toastId });
        } catch { toast.error('เกิดข้อผิดพลาด', { id: toastId }); }
        finally { setSaving(false); }
    };

    const tabs = [
        { key: 'general', label: 'ข้อมูลสถานศึกษา', icon: School },
        { key: 'security', label: 'ความปลอดภัย', icon: ShieldCheck },
        { key: 'notifications', label: 'การแจ้งเตือน', icon: Bell },
        { key: 'database', label: 'ฐานข้อมูล', icon: Database },
    ];

    return (
        <AppShell role="ADMIN" sidebarItems={ADMIN_SIDEBAR} user={user} pageTitle="ตั้งค่าระบบ" pageSubtitle="System Settings">
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Tabs */}
                    <div className="lg:w-56 shrink-0 space-y-1">
                        {tabs.map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                                    activeTab === tab.key ? 'bg-primary-light text-primary font-semibold' : 'text-text-secondary hover:bg-surface-elevated'
                                }`}>
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        <div className="card p-6">
                            {activeTab === 'general' && (
                                <div className="animate-fade-in space-y-5">
                                    <div>
                                        <h3 className="text-base font-semibold text-text-primary mb-1">ข้อมูลสถานศึกษา</h3>
                                        <p className="text-sm text-text-muted">ข้อมูลพื้นฐานที่แสดงบนระบบ</p>
                                    </div>

                                    <div>
                                        <label className="label">ชื่อสถานศึกษา</label>
                                        <input className="input-field" placeholder="โรงเรียน..." value={settings.name || ''} onChange={(e) => setSettings({ ...settings, name: e.target.value })} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">เบอร์โทรศัพท์</label>
                                            <input className="input-field" placeholder="02-XXX-XXXX" value={settings.phone || ''} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label">อีเมล</label>
                                            <input type="email" className="input-field" placeholder="admin@school.ac.th" value={settings.email || ''} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="label">เว็บไซต์</label>
                                        <input className="input-field" placeholder="https://www.school.ac.th" value={settings.website || ''} onChange={(e) => setSettings({ ...settings, website: e.target.value })} />
                                    </div>

                                    <div className="pt-4 border-t border-border flex justify-end">
                                        <button onClick={handleSave} disabled={saving} className="btn-primary">
                                            <Save size={16} /> {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab !== 'general' && (
                                <div className="py-16 text-center animate-fade-in">
                                    <Lock size={40} className="mx-auto text-text-muted mb-3" />
                                    <p className="text-text-secondary font-semibold">อยู่ระหว่างพัฒนา</p>
                                    <p className="text-sm text-text-muted mt-1">ส่วนนี้กำลังอยู่ระหว่างการพัฒนา</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
}
