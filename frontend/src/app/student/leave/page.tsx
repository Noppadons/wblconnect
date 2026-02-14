"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { FileCheck, Plus, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import AppShell from '@/components/Layout/AppShell';
import Modal from '@/components/Common/Modal';
import api from '@/lib/api';
import { STUDENT_SIDEBAR } from '@/lib/sidebar';
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

export default function StudentLeavePage() {
    const { user } = useUser();
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const fetchLeaves = useCallback(async () => {
        try {
            const res = await api.get('/leave/my-requests');
            setLeaves(res.data);
        } catch { toast.error('โหลดข้อมูลใบลาไม่สำเร็จ'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

    const handleCancel = async (id: string) => {
        if (!confirm('ต้องการยกเลิกใบลานี้?')) return;
        try {
            await api.delete(`/leave/${id}`);
            toast.success('ยกเลิกใบลาสำเร็จ');
            fetchLeaves();
        } catch { toast.error('ยกเลิกไม่สำเร็จ'); }
    };

    const pendingCount = leaves.filter(l => l.status === 'PENDING').length;
    const approvedCount = leaves.filter(l => l.status === 'APPROVED').length;

    return (
        <AppShell role="STUDENT" sidebarItems={STUDENT_SIDEBAR} user={user}
            pageTitle="ใบลา"
            pageSubtitle={`${leaves.length} รายการ • ${pendingCount} รอพิจารณา • ${approvedCount} อนุมัติ`}
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
                                <div key={key} className="card p-4 flex items-center gap-3">
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

                    {/* Action */}
                    <div className="flex justify-end">
                        <button onClick={() => setShowModal(true)} className="btn-primary h-9 px-4 text-[13px]">
                            <Plus size={15} /> ส่งใบลา
                        </button>
                    </div>

                    {/* Leave List */}
                    {leaves.length === 0 ? (
                        <div className="py-16 text-center card">
                            <FileCheck size={40} className="mx-auto text-text-muted mb-3" />
                            <p className="text-text-secondary font-semibold">ยังไม่มีใบลา</p>
                            <p className="text-sm text-text-muted mt-1">กดปุ่ม &quot;ส่งใบลา&quot; เพื่อสร้างใบลาใหม่</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {leaves.map(leave => {
                                const typeInfo = LEAVE_TYPE_MAP[leave.type] || LEAVE_TYPE_MAP.OTHER;
                                const statusInfo = STATUS_MAP[leave.status] || STATUS_MAP.PENDING;
                                const StatusIcon = statusInfo.icon;
                                const days = daysBetween(leave.startDate, leave.endDate);

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
                                                <p className="text-sm font-semibold text-text-primary">{leave.reason}</p>
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
                                                <button onClick={() => handleCancel(leave.id)}
                                                    className="p-1.5 text-text-muted hover:text-danger rounded-lg hover:bg-danger/10 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            <LeaveFormModal isOpen={showModal} onClose={() => setShowModal(false)}
                onSuccess={() => { setShowModal(false); fetchLeaves(); }} />
        </AppShell>
    );
}

function LeaveFormModal({ isOpen, onClose, onSuccess }: {
    isOpen: boolean; onClose: () => void; onSuccess: () => void;
}) {
    const [form, setForm] = useState({ startDate: '', endDate: '', reason: '', type: 'SICK' as LeaveType });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const today = new Date().toISOString().substring(0, 10);
            setForm({ startDate: today, endDate: today, reason: '', type: 'SICK' });
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.reason || !form.startDate || !form.endDate) { toast.error('กรุณากรอกข้อมูลให้ครบ'); return; }
        if (new Date(form.endDate) < new Date(form.startDate)) { toast.error('วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น'); return; }
        setSaving(true);
        try {
            await api.post('/leave', form);
            toast.success('ส่งใบลาสำเร็จ');
            onSuccess();
        } catch { toast.error('ส่งใบลาไม่สำเร็จ'); }
        finally { setSaving(false); }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="ส่งใบลา" maxWidth="max-w-md">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                    <label className="text-xs font-semibold text-text-secondary mb-1.5 block">ประเภทการลา *</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as LeaveType })} className="input-field w-full">
                        {Object.entries(LEAVE_TYPE_MAP).map(([key, val]) => (
                            <option key={key} value={key}>{val.label}</option>
                        ))}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-semibold text-text-secondary mb-1.5 block">วันเริ่มต้น *</label>
                        <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="input-field w-full" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-text-secondary mb-1.5 block">วันสิ้นสุด *</label>
                        <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="input-field w-full" />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-semibold text-text-secondary mb-1.5 block">เหตุผล *</label>
                    <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
                        className="input-field w-full" rows={3} placeholder="ระบุเหตุผลในการลา..." />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} className="btn-secondary h-9 px-4 text-[13px]">ยกเลิก</button>
                    <button type="submit" disabled={saving} className="btn-primary h-9 px-4 text-[13px]">
                        {saving ? 'กำลังส่ง...' : 'ส่งใบลา'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
