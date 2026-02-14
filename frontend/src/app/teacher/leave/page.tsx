"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { FileCheck, Clock, CheckCircle, XCircle, Filter } from 'lucide-react';
import AppShell from '@/components/Layout/AppShell';
import Modal from '@/components/Common/Modal';
import api from '@/lib/api';
import { TEACHER_SIDEBAR } from '@/lib/sidebar';
import { useUser } from '@/lib/useUser';
import type { LeaveRequest, LeaveType, LeaveStatus } from '@/lib/types';
import { toast } from 'sonner';

const LEAVE_TYPE_MAP: Record<LeaveType, { label: string; color: string; bg: string }> = {
    SICK: { label: 'ลาป่วย', color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
    PERSONAL: { label: 'ลากิจ', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    OTHER: { label: 'อื่นๆ', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
};

const STATUS_MAP: Record<LeaveStatus, { label: string; color: string; bg: string; icon: any }> = {
    PENDING: { label: 'รอพิจารณา', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', icon: Clock },
    APPROVED: { label: 'อนุมัติ', color: '#22d3ee', bg: 'rgba(34,211,238,0.12)', icon: CheckCircle },
    REJECTED: { label: 'ไม่อนุมัติ', color: '#f43f5e', bg: 'rgba(244,63,94,0.12)', icon: XCircle },
};

function daysBetween(start: string, end: string) {
    const s = new Date(start);
    const e = new Date(end);
    return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export default function TeacherLeavePage() {
    const { user } = useUser();
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('ALL');
    const [reviewingLeave, setReviewingLeave] = useState<LeaveRequest | null>(null);

    const fetchLeaves = useCallback(async () => {
        try {
            const params: any = {};
            if (filter !== 'ALL') params.status = filter;
            const res = await api.get('/leave', { params });
            setLeaves(res.data);
        } catch { toast.error('โหลดข้อมูลใบลาไม่สำเร็จ'); }
        finally { setLoading(false); }
    }, [filter]);

    useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

    const pendingCount = leaves.filter(l => l.status === 'PENDING').length;

    const filteredLeaves = filter === 'ALL' ? leaves : leaves.filter(l => l.status === filter);

    return (
        <AppShell role="TEACHER" sidebarItems={TEACHER_SIDEBAR} user={user}
            pageTitle="ใบลานักเรียน"
            pageSubtitle={`${leaves.length} รายการ • ${pendingCount} รอพิจารณา`}
        >
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-5">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        {Object.entries(STATUS_MAP).map(([key, val]) => {
                            const count = leaves.filter(l => l.status === key).length;
                            const Icon = val.icon;
                            return (
                                <div key={key} className="card p-4 flex items-center gap-3 cursor-pointer hover:border-primary/30 transition-colors"
                                    onClick={() => setFilter(key === filter ? 'ALL' : key)}>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: val.bg }}>
                                        <Icon size={18} style={{ color: val.color }} />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-text-primary">{count}</p>
                                        <p className="text-[11px] text-text-muted font-medium">{val.label}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Filter */}
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-text-muted" />
                        <span className="text-xs text-text-muted">กรอง:</span>
                        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
                            <button key={s} onClick={() => setFilter(s)}
                                className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${filter === s ? 'bg-primary/15 text-primary' : 'bg-surface-elevated text-text-secondary hover:text-text-primary'}`}>
                                {s === 'ALL' ? 'ทั้งหมด' : STATUS_MAP[s as LeaveStatus]?.label}
                            </button>
                        ))}
                    </div>

                    {/* Leave List */}
                    {filteredLeaves.length === 0 ? (
                        <div className="py-16 text-center card">
                            <FileCheck size={40} className="mx-auto text-text-muted mb-3" />
                            <p className="text-text-secondary font-semibold">ไม่มีใบลา</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredLeaves.map(leave => {
                                const typeInfo = LEAVE_TYPE_MAP[leave.type] || LEAVE_TYPE_MAP.OTHER;
                                const statusInfo = STATUS_MAP[leave.status] || STATUS_MAP.PENDING;
                                const StatusIcon = statusInfo.icon;
                                const days = daysBetween(leave.startDate, leave.endDate);
                                const studentName = leave.student?.user
                                    ? `${leave.student.user.firstName} ${leave.student.user.lastName}`
                                    : 'ไม่ทราบ';
                                const classroomLabel = leave.student?.classroom
                                    ? `${leave.student.classroom.grade?.level}/${leave.student.classroom.roomNumber}`
                                    : '';

                                return (
                                    <div key={leave.id} className="card p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: typeInfo.bg, color: typeInfo.color }}>
                                                        {typeInfo.label}
                                                    </span>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: statusInfo.bg, color: statusInfo.color }}>
                                                        <StatusIcon size={10} /> {statusInfo.label}
                                                    </span>
                                                    <span className="text-[10px] text-text-muted">{days} วัน</span>
                                                </div>
                                                <p className="text-sm font-semibold text-text-primary">{studentName}</p>
                                                {classroomLabel && <span className="text-[11px] text-text-muted">{classroomLabel}</span>}
                                                <p className="text-xs text-text-secondary mt-1">{leave.reason}</p>
                                                <p className="text-[11px] text-text-muted mt-1">
                                                    {new Date(leave.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    {' — '}
                                                    {new Date(leave.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                                {leave.reviewNote && (
                                                    <p className="text-xs text-text-secondary mt-2 px-3 py-2 rounded-lg bg-surface-elevated border border-border">
                                                        หมายเหตุ: {leave.reviewNote}
                                                    </p>
                                                )}
                                            </div>
                                            {leave.status === 'PENDING' && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => setReviewingLeave(leave)}
                                                        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                                        พิจารณา
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            <ReviewModal leave={reviewingLeave} onClose={() => setReviewingLeave(null)}
                onSuccess={() => { setReviewingLeave(null); fetchLeaves(); }} />
        </AppShell>
    );
}

function ReviewModal({ leave, onClose, onSuccess }: {
    leave: LeaveRequest | null; onClose: () => void; onSuccess: () => void;
}) {
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => { setNote(''); }, [leave]);

    const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
        if (!leave) return;
        setSaving(true);
        try {
            await api.put(`/leave/${leave.id}/review`, { status, reviewNote: note || undefined });
            toast.success(status === 'APPROVED' ? 'อนุมัติใบลาสำเร็จ' : 'ปฏิเสธใบลาสำเร็จ');
            onSuccess();
        } catch { toast.error('ดำเนินการไม่สำเร็จ'); }
        finally { setSaving(false); }
    };

    if (!leave) return null;

    const typeInfo = LEAVE_TYPE_MAP[leave.type] || LEAVE_TYPE_MAP.OTHER;
    const studentName = leave.student?.user
        ? `${leave.student.user.firstName} ${leave.student.user.lastName}`
        : 'ไม่ทราบ';
    const days = daysBetween(leave.startDate, leave.endDate);

    return (
        <Modal isOpen={!!leave} onClose={onClose} title="พิจารณาใบลา" maxWidth="max-w-md">
            <div className="p-6 space-y-4">
                <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: typeInfo.bg, color: typeInfo.color }}>
                            {typeInfo.label}
                        </span>
                        <span className="text-[10px] text-text-muted">{days} วัน</span>
                    </div>
                    <p className="text-sm font-semibold text-text-primary">{studentName}</p>
                    <p className="text-xs text-text-secondary">{leave.reason}</p>
                    <p className="text-[11px] text-text-muted">
                        {new Date(leave.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {' — '}
                        {new Date(leave.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>

                <div>
                    <label className="text-xs font-semibold text-text-secondary mb-1.5 block">หมายเหตุ (ไม่บังคับ)</label>
                    <textarea value={note} onChange={e => setNote(e.target.value)}
                        className="input-field w-full" rows={2} placeholder="เพิ่มหมายเหตุ..." />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} className="btn-secondary h-9 px-4 text-[13px]">ยกเลิก</button>
                    <button onClick={() => handleReview('REJECTED')} disabled={saving}
                        className="h-9 px-4 text-[13px] font-semibold rounded-xl bg-danger/10 text-danger hover:bg-danger/20 transition-colors flex items-center gap-1.5">
                        <XCircle size={14} /> ไม่อนุมัติ
                    </button>
                    <button onClick={() => handleReview('APPROVED')} disabled={saving}
                        className="btn-primary h-9 px-4 text-[13px] flex items-center gap-1.5">
                        <CheckCircle size={14} /> อนุมัติ
                    </button>
                </div>
            </div>
        </Modal>
    );
}
