"use client";

import React, { useEffect, useState } from 'react';
import { BookOpen, FileText, Download, Filter, Search, ChevronDown } from 'lucide-react';
import AppShell from '@/components/Layout/AppShell';
import api, { API_URL } from '@/lib/api';
import { normalizeUrl } from '@/lib/url';
import { toast } from 'sonner';
import { STUDENT_SIDEBAR } from '@/lib/sidebar';

export default function StudentMaterialsPage() {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<string>('all');
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchMyData();
    }, []);

    const fetchMyData = async () => {
        try {
            // Fetch student profile for classroom information
            const profileRes = await api.get('/students/my-profile');
            const student = profileRes.data;
            if (!student || !student.classroomId) {
                setLoading(false);
                return;
            }

            // Fetch subjects for filter
            const subjectsRes = await api.get('/school/subjects');
            const mySubjects = subjectsRes.data.filter((s: any) => s.classroomId === student.classroomId);
            setSubjects(mySubjects);

            // Fetch all materials at once
            const matRes = await api.get('/school/student-materials');
            const processedMaterials = matRes.data.map((m: any) => ({
                ...m,
                subjectName: m.subject?.name,
                subjectCode: m.subject?.code
            }));

            setMaterials(processedMaterials);
        } catch (err: any) {
            console.error('Fetch Materials Error:', err);
            const msg = err.response?.data?.message || err.message || 'ไม่ทราบสาเหตุ';
            toast.error(`ไม่สามารถดึงข้อมูลเอกสารการเรียนได้: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredMaterials = selectedSubject === 'all'
        ? materials
        : materials.filter(m => m.subjectId === selectedSubject);

    const getFileIcon = (type: string) => {
        const t = (type || '').toLowerCase();
        if (['pdf'].includes(t)) return <FileText className="text-rose-500" size={24} />;
        if (['doc', 'docx'].includes(t)) return <FileText className="text-blue-500" size={24} />;
        if (['xls', 'xlsx'].includes(t)) return <FileText className="text-emerald-500" size={24} />;
        if (['ppt', 'pptx'].includes(t)) return <FileText className="text-orange-500" size={24} />;
        return <FileText className="text-slate-500" size={24} />;
    };

    return (
        <AppShell role="STUDENT" sidebarItems={STUDENT_SIDEBAR} user={user} pageTitle="คลังเอกสารการเรียน" pageSubtitle="ดาวน์โหลดใบความรู้และสื่อการสอนจากครู">
            <div className="mb-6">
                <div className="relative max-w-sm">
                    <select className="select-field pl-10 pr-10" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                        <option value="all">ทุกรายวิชา</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                    </select>
                    <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMaterials.map((m: any) => (
                        <div key={m.id} className="card p-4 hover:border-primary/30 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                                    {getFileIcon(m.fileType)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h3 className="text-sm font-bold text-text-primary truncate">{m.title}</h3>
                                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-bold uppercase">{m.fileType || 'FILE'}</span>
                                    </div>
                                    <p className="text-xs text-text-muted line-clamp-1 mb-2">{m.description || 'ไม่มีคำอธิบาย'}</p>

                                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                                        <span className="text-[10px] font-bold text-primary truncate max-w-[120px]">{m.subjectCode || 'ทั่วไป'}</span>
                                        <a href={normalizeUrl(m.fileUrl, true)} target="_blank" rel="noreferrer" download={m.title}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                                            <Download size={14} /> ดาวน์โหลด
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredMaterials.length === 0 && (
                        <div className="col-span-full py-20 text-center card bg-slate-50 border-dashed">
                            <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-base font-bold text-text-secondary">ยังไม่มีเอกสาร</h3>
                            <p className="text-sm text-text-muted mt-1">เมื่อครูอัปโหลดเอกสารประกอบการเรียน จะแสดงที่นี่</p>
                        </div>
                    )}
                </div>
            )}
        </AppShell>
    );
}
