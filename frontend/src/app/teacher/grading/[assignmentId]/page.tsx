"use client";

import React, { useEffect, useState } from 'react';
import { Save, ChevronLeft, CheckCircle2, AlertCircle, Search, X, Eye, FileSearch, Upload } from 'lucide-react';
import api, { API_URL } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AppShell from '@/components/Layout/AppShell';
import { TEACHER_SIDEBAR } from '@/lib/sidebar';

export default function GradebookGridPage() {
    const { assignmentId } = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [grades, setGrades] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchGradebook();
    }, [assignmentId]);

    const fetchGradebook = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/assessment/gradebook/${assignmentId}`);
            setData(res.data);
            const initialGrades: Record<string, number> = {};
            res.data.students.forEach((s: any) => {
                if (s.submission?.points !== undefined && s.submission?.points !== null) initialGrades[s.id] = s.submission.points;
            });
            setGrades(initialGrades);
        } catch (err) { console.error(err); toast.error('ไม่สามารถโหลดข้อมูลได้'); }
        finally { setLoading(false); }
    };

    const handleGradeChange = (studentId: string, value: string) => {
        const num = value === '' ? undefined : Number(value);
        setGrades(prev => ({ ...prev, [studentId]: num as any }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const gradesArray = Object.entries(grades).filter(([_, points]) => points !== undefined).map(([studentId, points]) => ({ studentId, points: Number(points) }));
            await api.post(`/assessment/bulk-grade/${assignmentId}`, { grades: gradesArray });
            toast.success('บันทึกคะแนนเรียบร้อย'); fetchGradebook();
        } catch { toast.error('เกิดข้อผิดพลาด'); }
        finally { setSaving(false); }
    };

    const filteredStudents = data?.students.filter((s: any) => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.studentCode.includes(searchTerm)) || [];

    return (
        <AppShell role="TEACHER" sidebarItems={TEACHER_SIDEBAR} user={user}
            pageTitle={data?.title || 'ให้คะแนน'}
            pageSubtitle={data ? `[${data.subject?.code}] ${data.subject?.name} • เต็ม ${data.maxPoints} คะแนน` : ''}
            headerActions={
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push('/teacher/grading')} className="btn-ghost"><ChevronLeft size={18} /> กลับ</button>
                    <button onClick={handleSave} disabled={saving} className="btn-primary">
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16} /> บันทึกทั้งหมด</>}
                    </button>
                </div>
            }
        >
            {data?.description || data?.attachments?.length > 0 ? (
                <div className="card p-4 mb-4 bg-slate-50 border-slate-200">
                    {data.description && <p className="text-sm text-text-primary mb-3">{data.description}</p>}
                    {data.attachments?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {data.attachments.map((url: string, i: number) => (
                                <a key={i} href={`${API_URL}${url}`}
                                    target="_blank" rel="noreferrer"
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-border rounded-lg text-xs font-semibold text-primary hover:border-primary transition-colors">
                                    <Upload size={14} className="rotate-180" />
                                    ไฟล์คำสั่งที่ {i + 1}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            ) : null}
            {loading && !data ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row gap-3 mb-4 items-center justify-between">
                        <div className="relative w-full max-w-md">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input type="text" placeholder="ค้นหาชื่อหรือรหัส..." className="input-field pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <span className="text-sm text-text-secondary font-medium">ตรวจแล้ว {Object.keys(grades).length}/{data?.students.length}</span>
                    </div>

                    {/* Table */}
                    <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-border bg-slate-50/50">
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary w-12">#</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary">นักเรียน</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary hidden sm:table-cell">สถานะ</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary">ผลงาน</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-text-secondary text-center">คะแนน (/{data?.maxPoints})</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light">
                                    {filteredStudents.map((s: any, idx: number) => (
                                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-text-muted">{(idx + 1).toString().padStart(2, '0')}</td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-semibold text-text-primary">{s.name}</p>
                                                <p className="text-xs text-text-muted">{s.studentCode}</p>
                                            </td>
                                            <td className="px-4 py-3 hidden sm:table-cell">
                                                {s.submission ? (
                                                    <button onClick={() => setSelectedSubmission({ ...s.submission, studentName: s.name })}
                                                        className="badge-success text-xs cursor-pointer hover:opacity-80">ส่งแล้ว</button>
                                                ) : (
                                                    <span className="badge-warning text-xs">ยังไม่ส่ง</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {s.submission ? (
                                                    <button
                                                        onClick={() => setSelectedSubmission({ ...s.submission, studentName: s.name })}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 text-primary border border-primary/10 rounded-lg text-xs font-bold hover:bg-primary/10 transition-colors"
                                                    >
                                                        <Eye size={14} /> ดูผลงาน
                                                        {s.submission.attachments?.length > 0 && (
                                                            <span className="flex items-center gap-0.5 px-1 bg-primary text-white rounded text-[8px]">
                                                                {s.submission.attachments.length}
                                                            </span>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-text-muted italic">ยังไม่มีงาน</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <input type="number" max={data?.maxPoints} placeholder="—"
                                                        className="w-20 px-3 py-2 rounded-lg bg-slate-50 border border-border text-center text-sm font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                        value={grades[s.id] ?? ''} onChange={(e) => handleGradeChange(s.id, e.target.value)} />
                                                    {grades[s.id] !== undefined && <CheckCircle2 size={18} className="text-green-500" />}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredStudents.length === 0 && (
                                <div className="py-16 text-center">
                                    <Search size={40} className="mx-auto text-text-muted mb-3" />
                                    <p className="text-text-secondary font-semibold">ไม่พบนักเรียน</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Submission Modal */}
            {selectedSubmission && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="absolute inset-0" onClick={() => setSelectedSubmission(null)} />
                    <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-modal max-h-[90vh] overflow-y-auto animate-fade-in">
                        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-10">
                            <div>
                                <h2 className="text-lg font-bold text-text-primary">งานที่ส่ง</h2>
                                <p className="text-sm text-text-muted">{selectedSubmission.studentName}</p>
                            </div>
                            <button onClick={() => setSelectedSubmission(null)} className="btn-ghost p-2"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-border">
                                <p className="text-sm text-text-secondary whitespace-pre-wrap mb-4">
                                    {selectedSubmission.content || <span className="text-text-muted italic">ไม่มีเนื้อหาพิมพ์ส่งมา</span>}
                                </p>

                                {/* Student's Attachments */}
                                {selectedSubmission.attachments?.length > 0 && (
                                    <div className="mt-2 pt-3 border-t border-slate-200">
                                        <p className="text-[10px] font-bold text-text-muted uppercase mb-2">ไฟล์ที่แนบมา</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedSubmission.attachments.map((url: string, i: number) => (
                                                <a key={i} href={`${API_URL}${url}`} target="_blank" rel="noreferrer"
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-border rounded-lg text-xs font-semibold text-primary hover:border-primary transition-colors">
                                                    <Upload size={14} className="rotate-180" />
                                                    ไฟล์ที่ {i + 1}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-text-muted">ส่งเมื่อ: {new Date(selectedSubmission.updatedAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                <span className={selectedSubmission.status === 'GRADED' ? 'text-green-600 font-semibold' : 'text-amber-600 font-semibold'}>
                                    {selectedSubmission.status === 'GRADED' ? 'ตรวจแล้ว' : 'รอตรวจ'}
                                </span>
                            </div>
                            <div>
                                <label className="label">ให้คะแนน (เต็ม {data?.maxPoints})</label>
                                <input type="number" max={data?.maxPoints} className="input-field" placeholder="คะแนน"
                                    value={grades[selectedSubmission.studentId] ?? selectedSubmission.points ?? ''}
                                    onChange={(e) => handleGradeChange(selectedSubmission.studentId, e.target.value)} />
                            </div>
                            <div className="flex gap-3 pt-2 border-t border-border">
                                <button onClick={() => setSelectedSubmission(null)} className="btn-secondary flex-1">ปิด</button>
                                <button onClick={async () => {
                                    const points = grades[selectedSubmission.studentId];
                                    if (points === undefined || points === null) {
                                        toast.error('กรุณาระบุคะแนน');
                                        return;
                                    }
                                    setSaving(true);
                                    try {
                                        await api.post(`/assessment/bulk-grade/${assignmentId}`, {
                                            grades: [{ studentId: selectedSubmission.studentId, points: Number(points) }]
                                        });
                                        toast.success('บันทึกคะแนนเรียบร้อย');
                                        setSelectedSubmission(null);
                                        fetchGradebook();
                                    } catch {
                                        toast.error('เกิดข้อผิดพลาดในการบันทึก');
                                    } finally {
                                        setSaving(false);
                                    }
                                }} disabled={saving} className="btn-primary flex-1">
                                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'บันทึกคะแนน'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
}
