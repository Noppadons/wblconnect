"use client";

import React, { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import AppShell from '@/components/Layout/AppShell';
import { STUDENT_SIDEBAR } from '@/lib/sidebar';

export default function StudentGradesPage() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
    }, []);

    return (
        <AppShell role="STUDENT" sidebarItems={STUDENT_SIDEBAR} user={user} pageTitle="ผลการเรียน" pageSubtitle="Academic Transcript">
            <div className="flex flex-col items-center justify-center text-center py-24">
                <div className="w-16 h-16 bg-slate-100 text-text-muted rounded-2xl flex items-center justify-center mb-4">
                    <BarChart3 size={32} />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">ระบบรายงานผลการเรียน</h3>
                <p className="text-sm text-text-secondary max-w-md mb-6">
                    ตรวจสอบเกรดเฉลี่ยรายเทอม รายวิชา และวิเคราะห์จุดแข็ง/จุดอ่อนทางการเรียนด้วย AI
                </p>
                <span className="badge-primary">Coming Soon</span>
            </div>
        </AppShell>
    );
}
