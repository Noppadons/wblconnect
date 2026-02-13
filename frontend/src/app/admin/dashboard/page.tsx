"use client";

import React, { useEffect, useState } from 'react';
import { Users, GraduationCap, School, Activity, ArrowRight, Calendar, Clock, Bell } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { AdminDashboardStats, AdminDashboardCharts, Notification } from '@/lib/types';
import { useUser } from '@/lib/useUser';
import AppShell from '@/components/Layout/AppShell';
import KpiCard from '@/components/Dashboard/KpiCard';
import { SimpleBarChart, SimpleLineChart } from '@/components/Dashboard/SimpleCharts';
import { ADMIN_SIDEBAR } from '@/lib/sidebar';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<AdminDashboardStats>({ totalStudents: 0, totalTeachers: 0, totalClassrooms: 0, attendanceToday: 0 });
    const [charts, setCharts] = useState<AdminDashboardCharts | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useUser();

    useEffect(() => {
        Promise.all([
            api.get('/admin/stats'),
            api.get('/admin/charts').catch(() => ({ data: null })),
        ])
            .then(([statsRes, chartsRes]) => {
                setStats(statsRes.data);
                setCharts(chartsRes.data);
            })
            .catch(() => {
                toast.error('ไม่สามารถโหลดข้อมูลสถิติได้');
            })
            .finally(() => setLoading(false));
    }, []);

    const attendanceTrend = charts?.attendanceTrend?.map((d) => d.value) || [0, 0, 0, 0, 0, 0, 0];
    const scoreDistribution = charts?.scoreDistribution?.map((d) => d.value) || [0, 0, 0, 0, 0, 0, 0];
    const recentActivity: Notification[] = charts?.recentNotifications || [];

    return (
        <AppShell role="ADMIN" sidebarItems={ADMIN_SIDEBAR} user={user} pageTitle="ภาพรวมระบบ" pageSubtitle="Dashboard">
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* Welcome Banner */}
                    <div className="card p-6 mb-6 bg-gradient-to-r from-blue-600 to-blue-700 border-0 text-white">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold mb-1">สวัสดี, {user?.firstName || 'Admin'} 👋</h2>
                                <p className="text-blue-100 text-sm">ยินดีต้อนรับกลับสู่ระบบบริหารจัดการโรงเรียนวัดบึงเหล็ก</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-blue-100">
                                <Calendar size={16} />
                                <span>{new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <KpiCard title="นักเรียนทั้งหมด" value={stats.totalStudents} icon={Users} color="primary" trendLabel="คน" />
                        <KpiCard title="บุคลากรครู" value={stats.totalTeachers} icon={GraduationCap} color="warning" trendLabel="คน" />
                        <KpiCard title="ห้องเรียน" value={stats.totalClassrooms} icon={School} color="purple" trendLabel="ห้อง" />
                        <KpiCard title="มาเรียนวันนี้" value={stats.attendanceToday} icon={Activity} color="success" trendLabel="คน" />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                        <div className="lg:col-span-2 card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-base font-semibold text-text-primary">สถิติการมาเรียนรายสัปดาห์</h3>
                                    <p className="text-sm text-text-muted">Attendance Trend</p>
                                </div>
                                <span className="badge-success">+2.1%</span>
                            </div>
                            <SimpleLineChart data={attendanceTrend} height={240} color="#2563eb" />
                        </div>

                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-base font-semibold text-text-primary">ผลการเรียน</h3>
                                    <p className="text-sm text-text-muted">Score Distribution</p>
                                </div>
                            </div>
                            <SimpleBarChart data={scoreDistribution} height={240} color="#6366f1" />
                        </div>
                    </div>

                    {/* Quick Actions + Recent */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Quick Actions */}
                        <div className="card p-6">
                            <h3 className="text-base font-semibold text-text-primary mb-4">ทางลัด</h3>
                            <div className="space-y-2">
                                <QuickLink href="/admin/students" label="จัดการนักเรียน" desc="เพิ่ม แก้ไข ลบข้อมูล" icon={Users} />
                                <QuickLink href="/admin/teachers" label="จัดการบุคลากร" desc="ระบบบุคลากรครู" icon={GraduationCap} />
                                <QuickLink href="/admin/classrooms" label="จัดการห้องเรียน" desc="โครงสร้างชั้นเรียน" icon={School} />
                                <QuickLink href="/admin/communication" label="ประกาศข่าวสาร" desc="แจ้งเตือนทั้งระบบ" icon={Bell} />
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="lg:col-span-2 card p-6">
                            <h3 className="text-base font-semibold text-text-primary mb-4">กิจกรรมล่าสุด</h3>
                            <div className="space-y-3">
                                {recentActivity.length > 0 ? recentActivity.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-elevated transition-colors">
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${item.type === 'ALERT' ? 'bg-amber-500/100' : 'bg-blue-500/100'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-text-primary truncate">{item.title}</p>
                                        </div>
                                        <span className="text-xs text-text-muted whitespace-nowrap flex items-center gap-1">
                                            <Clock size={12} /> {new Date(item.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                )) : (
                                    <p className="text-sm text-text-muted text-center py-4">ยังไม่มีกิจกรรม</p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </AppShell>
    );
}

function QuickLink({ href, label, desc, icon: Icon }: { href: string; label: string; desc: string; icon: React.ComponentType<{ size: number }> }) {
    return (
        <a href={href} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-elevated transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                <Icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">{label}</p>
                <p className="text-xs text-text-muted truncate">{desc}</p>
            </div>
            <ArrowRight size={16} className="text-text-muted group-hover:text-primary transition-colors" />
        </a>
    );
}
