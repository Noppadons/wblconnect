"use client";

import React, { useEffect, useState } from 'react';
import { FileText, Clock, CheckCircle2, AlertCircle, Upload, Send, BookOpen, MessageSquare, Star, X, ChevronDown, Download } from 'lucide-react';
import api, { API_URL } from '@/lib/api';
import { normalizeUrl } from '@/lib/url';
import AppShell from '@/components/Layout/AppShell';
import Modal from '@/components/Common/Modal';
import { toast } from 'sonner';
import { STUDENT_SIDEBAR } from '@/lib/sidebar';
import type { Assignment, UploadResponse } from '@/lib/types';
import { useUser } from '@/lib/useUser';

interface StudentAssignment extends Assignment {
    mySubmission?: { id: string; status: string; points?: number | null; feedback?: string | null };
}

interface AttachmentFile {
    name: string;
    url: string;
}

export default function StudentAssignmentsPage() {
    const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'PENDING' | 'SUBMITTED'>('PENDING');
    const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignment | null>(null);
    const [viewAssignment, setViewAssignment] = useState<StudentAssignment | null>(null);
    const [submissionContent, setSubmissionContent] = useState('');
    const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const { user } = useUser();

    useEffect(() => {
        fetchMyAssignments();
    }, []);

    const fetchMyAssignments = async () => {
        try { const res = await api.get('/assessment/my-assignments'); setAssignments(res.data); }
        catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const toastId = toast.loading('กำลังอัปโหลดไฟล์...');
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.post('/upload/document', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setAttachments(prev => [...prev, { name: file.name, url: res.data.url }]);
            toast.success('อัปโหลดสำเร็จ', { id: toastId });
        } catch (err) {
            toast.error('อัปโหลดล้มเหลว', { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!selectedAssignment || (!submissionContent.trim() && attachments.length === 0)) return;
        setSubmitting(true);
        try {
            const userRes = await api.get('/auth/profile');
            const studentId = userRes.data.student?.id;
            if (!studentId) throw new Error("Student ID not found");
            await api.post('/assessment/submit', {
                studentId,
                assignmentId: selectedAssignment.id,
                content: submissionContent,
                attachments: attachments.map(a => a.url)
            });
            setSubmitSuccess(true);
            setTimeout(() => {
                setSubmitSuccess(false);
                setSelectedAssignment(null);
                setSubmissionContent('');
                setAttachments([]);
                fetchMyAssignments();
            }, 1500);
        } catch (err) { console.error(err); toast.error('เกิดข้อผิดพลาดในการส่งงาน'); }
        finally { setSubmitting(false); }
    };

    const pendingAssignments = assignments.filter(a => !a.mySubmission);
    const submittedAssignments = assignments.filter(a => a.mySubmission);
    const displayList = activeTab === 'PENDING' ? pendingAssignments : submittedAssignments;

    const isOverdue = (dueDate: string) => dueDate && new Date(dueDate) < new Date();
    const isDueSoon = (dueDate: string) => {
        if (!dueDate) return false;
        const diff = new Date(dueDate).getTime() - Date.now();
        return diff > 0 && diff < 2 * 24 * 60 * 60 * 1000;
    };

    return (
        <AppShell role="STUDENT" sidebarItems={STUDENT_SIDEBAR} user={user} pageTitle="งานที่ได้รับ" pageSubtitle={`${pendingAssignments.length} รอส่ง • ${submittedAssignments.length} ส่งแล้ว`}>
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-secondary rounded-lg max-w-sm mb-4">
                <button onClick={() => setActiveTab('PENDING')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'PENDING' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary'}`}>
                    รอส่ง ({pendingAssignments.length})
                </button>
                <button onClick={() => setActiveTab('SUBMITTED')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'SUBMITTED' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary'}`}>
                    ส่งแล้ว ({submittedAssignments.length})
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-3">
                    {displayList.map((a) => {
                        const overdue = a.dueDate ? isOverdue(a.dueDate) : false;
                        const dueSoon = a.dueDate ? isDueSoon(a.dueDate) : false;
                        const isGraded = a.mySubmission?.status === 'GRADED';

                        return (
                            <div key={a.id} className="card p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-sm font-bold text-text-primary truncate">{a.title}</h3>
                                            <span className="badge-primary text-xs shrink-0">{a.subject?.code || a.subject?.name}</span>
                                        </div>
                                        {a.description && (
                                            <p className="text-xs text-text-muted mb-2 line-clamp-2">{a.description}</p>
                                        )}
                                        {a.attachments?.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {a.attachments.map((url: string, i: number) => (
                                                    <a key={i} href={normalizeUrl(url)}
                                                        target="_blank" rel="noreferrer"
                                                        className="flex items-center gap-1.5 px-2 py-1 bg-surface-elevated border border-border rounded-md text-[10px] font-bold text-primary hover:border-primary transition-colors"
                                                    >
                                                        <Upload size={10} className="rotate-180" /> ไฟล์คำสั่ง {i + 1}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
                                            <span className="font-semibold text-text-secondary">{a.maxPoints} คะแนน</span>
                                            {a.dueDate && (
                                                <span className={`flex items-center gap-1 ${overdue ? 'text-red-600 font-semibold' : dueSoon ? 'text-amber-600 font-semibold' : ''}`}>
                                                    {overdue ? <AlertCircle size={12} /> : <Clock size={12} />}
                                                    {overdue ? 'เลยกำหนด' : 'กำหนดส่ง'} {new Date(a.dueDate).toLocaleDateString('th-TH')}
                                                </span>
                                            )}
                                            {isGraded && (
                                                <span className="flex items-center gap-1 text-green-600 font-semibold">
                                                    <Star size={12} /> {a.mySubmission?.points}/{a.maxPoints}
                                                </span>
                                            )}
                                        </div>
                                        {/* Feedback from teacher */}
                                        {isGraded && a.mySubmission?.feedback && (
                                            <div className="mt-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                                                <p className="text-xs text-green-400 flex items-start gap-1.5">
                                                    <MessageSquare size={12} className="shrink-0 mt-0.5" />
                                                    <span><strong>ครูให้ feedback:</strong> {a.mySubmission?.feedback}</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="shrink-0">
                                        {activeTab === 'PENDING' ? (
                                            <button onClick={() => { setSelectedAssignment(a); setSubmissionContent(''); }} className="btn-primary text-xs py-1.5 px-3">
                                                <Send size={13} /> ส่งงาน
                                            </button>
                                        ) : (
                                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg ${isGraded ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                                {isGraded ? <><CheckCircle2 size={13} /> ตรวจแล้ว</> : <><Clock size={13} /> รอตรวจ</>}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {displayList.length === 0 && (
                        <div className="py-16 text-center card">
                            <FileText size={40} className="mx-auto text-text-muted mb-3" />
                            <p className="text-text-secondary font-semibold">
                                {activeTab === 'PENDING' ? 'ไม่มีงานที่ต้องส่ง' : 'ยังไม่มีประวัติการส่งงาน'}
                            </p>
                            <p className="text-sm text-text-muted mt-1">
                                {activeTab === 'PENDING' ? 'ส่งงานครบหมดแล้ว เก่งมาก!' : 'เมื่อส่งงานแล้วจะแสดงที่นี่'}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Submission Modal */}
            <Modal isOpen={!!selectedAssignment} onClose={() => { setSelectedAssignment(null); setSubmitSuccess(false); }} title="ส่งงาน" subtitle={selectedAssignment?.title}>
                {submitSuccess ? (
                    <div className="p-6 flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 bg-green-500/15 rounded-full flex items-center justify-center text-green-600 mb-4">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-text-primary mb-1">ส่งงานสำเร็จ!</h3>
                        <p className="text-sm text-text-muted">งานถูกส่งให้ครูเรียบร้อยแล้ว</p>
                    </div>
                ) : (
                    <div className="p-6 space-y-4">
                        {/* Assignment details */}
                        <div className="px-4 py-3 bg-surface-elevated rounded-lg border border-border">
                            <p className="text-xs font-semibold text-text-secondary mb-1 flex items-center gap-1"><BookOpen size={12} /> รายละเอียดงาน</p>
                            <p className="text-sm text-text-primary">{selectedAssignment?.description || 'ไม่มีรายละเอียดเพิ่มเติม'}</p>

                            {/* Teacher's Attachments */}
                            {(selectedAssignment?.attachments?.length ?? 0) > 0 && (
                                <div className="mt-3 pt-3 border-t border-border">
                                    <p className="text-[10px] font-bold text-text-muted uppercase mb-2 tracking-wider">เอกสารประกอบการสั่งงาน</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedAssignment?.attachments?.map((url: string, i: number) => (
                                            <a key={i} href={normalizeUrl(url)} target="_blank" rel="noreferrer"
                                                className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-medium text-primary hover:border-primary transition-colors">
                                                <Upload size={12} className="rotate-180" />
                                                ไฟล์ที่ {i + 1}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-text-muted">
                            <span className="font-semibold text-text-secondary">{selectedAssignment?.maxPoints} คะแนน</span>
                            {selectedAssignment?.dueDate && (
                                <span className={`flex items-center gap-1 ${isOverdue(selectedAssignment.dueDate) ? 'text-red-600 font-semibold' : ''}`}>
                                    <Clock size={12} /> กำหนดส่ง {new Date(selectedAssignment.dueDate).toLocaleDateString('th-TH')}
                                </span>
                            )}
                        </div>

                        <div>
                            <label className="label">ข้อความถึงครู</label>
                            <textarea value={submissionContent} onChange={(e) => setSubmissionContent(e.target.value)}
                                placeholder="พิมพ์เนื้อหาการบ้าน หรือข้อความถึงครู..."
                                className="input-field h-32 resize-none" />
                        </div>

                        <div>
                            <label className="label">แนบไฟล์งานของคุณ</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {attachments.map((file, i) => (
                                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg text-xs font-medium">
                                        <span className="truncate max-w-[150px]">{file.name}</span>
                                        <button type="button" onClick={() => removeAttachment(i)} className="text-red-500 hover:text-red-400">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading ? 'bg-surface-elevated border-border' : 'bg-surface border-border hover:border-primary/50'}`}>
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload size={20} className="text-text-muted mb-1" />
                                    <p className="text-xs text-text-muted">อัปโหลดไฟล์ (PDF, รูปภาพ, เอกสาร)</p>
                                </div>
                                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                            </label>
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-border">
                            <button onClick={() => setSelectedAssignment(null)} className="btn-secondary flex-1">ยกเลิก</button>
                            <button onClick={handleSubmit} disabled={(submissionContent.trim() === '' && attachments.length === 0) || submitting} className="btn-primary flex-1 disabled:opacity-50">
                                {submitting ? 'กำลังส่ง...' : <><Send size={16} /> ยืนยันส่งงาน</>}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </AppShell>
    );
}
