"use client";

import React, { useEffect, useState } from 'react';
import { Check, Search, ThumbsUp, ThumbsDown, Trash2, Users, ChevronDown, Plus, X, Smile, Frown, Clock, PenLine } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import AppShell from '@/components/Layout/AppShell';
import Modal from '@/components/Common/Modal';
import { TEACHER_SIDEBAR } from '@/lib/sidebar';

const BEHAVIOR_TAGS = [
    { label: 'จิตอาสา', points: 5, type: 'POSITIVE' },
    { label: 'ตั้งใจเรียน', points: 3, type: 'POSITIVE' },
    { label: 'รวมกลุ่มทำงาน', points: 2, type: 'POSITIVE' },
    { label: 'ช่วยเหลือเพื่อน', points: 3, type: 'POSITIVE' },
    { label: 'ส่งงานตรงเวลา', points: 2, type: 'POSITIVE' },
    { label: 'มาสาย', points: -3, type: 'NEGATIVE' },
    { label: 'แต่งกายผิดระเบียบ', points: -5, type: 'NEGATIVE' },
    { label: 'ก่อกวนในห้อง', points: -10, type: 'NEGATIVE' },
    { label: 'ไม่ส่งงาน', points: -5, type: 'NEGATIVE' },
    { label: 'ใช้โทรศัพท์ในห้อง', points: -3, type: 'NEGATIVE' },
];

export default function BehaviorPage() {
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [user, setUser] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customForm, setCustomForm] = useState({ content: '', points: 0, type: 'POSITIVE' as string });
    const [activeView, setActiveView] = useState<'record' | 'history'>('record');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));

        const fetchClassrooms = async () => {
            try {
                const yearsRes = await api.get('/school/academic-years');
                let rooms: any[] = [];
                if (yearsRes.data?.length && yearsRes.data[0].semesters?.length) {
                    const semesterId = yearsRes.data[0].semesters[0].id;
                    const classroomsRes = await api.get(`/school/classrooms?semesterId=${semesterId}`);
                    rooms = classroomsRes.data || [];
                }
                setClassrooms(rooms);
                if (rooms.length > 0) {
                    setSelectedClassroomId(rooms[0].id);
                    setStudents(rooms[0].students || []);
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchClassrooms();
    }, []);

    useEffect(() => {
        if (selectedClassroomId) fetchLogs();
    }, [selectedClassroomId]);

    const fetchLogs = async () => {
        try {
            const res = await api.get(`/teacher/behavior-logs/${selectedClassroomId}?limit=50`);
            setLogs(res.data);
        } catch { }
    };

    const handleClassroomChange = (id: string) => {
        setSelectedClassroomId(id);
        setSelectedStudents([]);
        setSearchTerm('');
        const room = classrooms.find(c => c.id === id);
        setStudents(room?.students || []);
    };

    const toggleStudent = (id: string) => {
        setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    };

    const selectAll = () => {
        if (selectedStudents.length === filteredStudents.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(filteredStudents.map((s: any) => s.id));
        }
    };

    const handleSubmit = async (content: string, points: number, type: string) => {
        if (selectedStudents.length === 0) return toast.error('กรุณาเลือกนักเรียนอย่างน้อย 1 คน');
        const toastId = toast.loading('กำลังบันทึก...');
        try {
            await Promise.all(selectedStudents.map(studentId =>
                api.post('/teacher/behavior', { studentId, points, type, content })
            ));
            toast.success(`บันทึก "${content}" (${points > 0 ? '+' : ''}${points}) ให้ ${selectedStudents.length} คน`, { id: toastId });
            setSelectedStudents([]);
            fetchLogs();
        } catch { toast.error('เกิดข้อผิดพลาด', { id: toastId }); }
    };

    const handleCustomSubmit = () => {
        if (!customForm.content.trim()) return toast.error('กรุณากรอกเหตุผล');
        handleSubmit(customForm.content, customForm.type === 'POSITIVE' ? Math.abs(customForm.points) : -Math.abs(customForm.points), customForm.type);
        setShowCustomModal(false);
        setCustomForm({ content: '', points: 0, type: 'POSITIVE' });
    };

    const filteredStudents = students.filter((s: any) =>
        `${s.user?.firstName} ${s.user?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || s.studentCode?.includes(searchTerm)
    );

    // คำนวณคะแนนรวมต่อนักเรียน
    const studentScores: Record<string, number> = {};
    logs.forEach(log => {
        const sid = log.studentId;
        studentScores[sid] = (studentScores[sid] || 0) + (log.points || 0);
    });

    const selectedClassroom = classrooms.find(c => c.id === selectedClassroomId);

    return (
        <AppShell role="TEACHER" sidebarItems={TEACHER_SIDEBAR} user={user}
            pageTitle="บันทึกพฤติกรรม"
            pageSubtitle={selectedClassroom ? `ชั้น ${selectedClassroom.grade?.level}/${selectedClassroom.roomNumber} • ${students.length} คน` : ''}
        >
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : classrooms.length === 0 ? (
                <div className="py-16 text-center card">
                    <Users size={40} className="mx-auto text-text-muted mb-3" />
                    <p className="text-text-secondary font-semibold">ไม่พบห้องเรียน</p>
                </div>
            ) : (
                <>
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                        <div className="relative w-full sm:w-56">
                            <select value={selectedClassroomId} onChange={(e) => handleClassroomChange(e.target.value)} className="select-field pr-10 font-semibold">
                                {classrooms.map(c => (
                                    <option key={c.id} value={c.id}>ชั้น {c.grade?.level}/{c.roomNumber} ({c.students?.length || 0} คน)</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>
                        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                            <button onClick={() => setActiveView('record')}
                                className={`py-1.5 px-4 rounded-md text-sm font-medium transition-colors ${activeView === 'record' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary'}`}>
                                บันทึก
                            </button>
                            <button onClick={() => setActiveView('history')}
                                className={`py-1.5 px-4 rounded-md text-sm font-medium transition-colors ${activeView === 'history' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary'}`}>
                                ประวัติ ({logs.length})
                            </button>
                        </div>
                    </div>

                    {activeView === 'record' ? (
                        <>
                            {/* Selection Bar */}
                            <div className="card p-3 mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button onClick={selectAll} className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${selectedStudents.length === filteredStudents.length && filteredStudents.length > 0 ? 'bg-primary text-white' : 'bg-slate-100 text-text-muted hover:bg-slate-200'}`}>
                                        {selectedStudents.length === filteredStudents.length && filteredStudents.length > 0 ? <Check size={14} /> : ''}
                                    </button>
                                    {selectedStudents.length > 0 ? (
                                        <span className="text-sm font-semibold text-primary">เลือก {selectedStudents.length} คน</span>
                                    ) : (
                                        <span className="text-sm text-text-muted">กดเลือกนักเรียน หรือกดปุ่มซ้ายเพื่อเลือกทั้งหมด</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedStudents.length > 0 && (
                                        <button onClick={() => setSelectedStudents([])} className="btn-ghost text-sm text-text-muted"><Trash2 size={14} /> ล้าง</button>
                                    )}
                                    <div className="relative max-w-[200px]">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                                        <input type="text" placeholder="ค้นหา..." className="input-field pl-8 py-1.5 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            {/* Student Grid */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 mb-6">
                                {filteredStudents.map((student: any) => {
                                    const isSelected = selectedStudents.includes(student.id);
                                    const score = studentScores[student.id] || 0;
                                    return (
                                        <button key={student.id} onClick={() => toggleStudent(student.id)}
                                            className={`p-3 rounded-xl border transition-all text-center relative ${isSelected ? 'bg-primary text-white border-primary shadow-md scale-[1.02]' : 'bg-white border-border hover:border-primary/30 hover:shadow-sm'}`}>
                                            {isSelected && <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white text-primary flex items-center justify-center"><Check size={10} strokeWidth={3} /></div>}
                                            <div className={`w-9 h-9 rounded-lg mx-auto mb-1.5 flex items-center justify-center text-sm font-bold ${isSelected ? 'bg-white/15' : 'bg-slate-100 text-text-secondary'}`}>
                                                {student.user?.firstName?.[0] || '?'}
                                            </div>
                                            <p className="text-[11px] font-semibold truncate">{student.user?.firstName}</p>
                                            {score !== 0 && (
                                                <p className={`text-[10px] font-bold mt-0.5 ${isSelected ? 'text-white/70' : score > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {score > 0 ? '+' : ''}{score}
                                                </p>
                                            )}
                                        </button>
                                    );
                                })}
                                {filteredStudents.length === 0 && (
                                    <div className="col-span-full py-12 text-center">
                                        <Users size={32} className="mx-auto text-text-muted mb-2" />
                                        <p className="text-text-secondary text-sm font-semibold">ไม่พบนักเรียน</p>
                                    </div>
                                )}
                            </div>

                            {/* Behavior Tags */}
                            <div className="card p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold text-text-primary">เลือกพฤติกรรม</h3>
                                    <button onClick={() => setShowCustomModal(true)} disabled={selectedStudents.length === 0}
                                        className="btn-secondary text-xs py-1.5 disabled:opacity-30">
                                        <PenLine size={13} /> กำหนดเอง
                                    </button>
                                </div>

                                {/* Positive */}
                                <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1"><ThumbsUp size={12} /> พฤติกรรมดี</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4">
                                    {BEHAVIOR_TAGS.filter(t => t.type === 'POSITIVE').map((tag, i) => (
                                        <button key={i} onClick={() => handleSubmit(tag.label, tag.points, tag.type)} disabled={selectedStudents.length === 0}
                                            className="flex items-center gap-2 p-2.5 rounded-xl border border-green-200 bg-green-50 text-green-700 transition-all disabled:opacity-30 disabled:grayscale hover:shadow-md active:scale-95 text-left">
                                            <Smile size={16} className="shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-semibold leading-tight truncate">{tag.label}</p>
                                                <p className="text-[10px] font-bold opacity-70">+{tag.points}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Negative */}
                                <p className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1"><ThumbsDown size={12} /> พฤติกรรมไม่ดี</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                                    {BEHAVIOR_TAGS.filter(t => t.type === 'NEGATIVE').map((tag, i) => (
                                        <button key={i} onClick={() => handleSubmit(tag.label, tag.points, tag.type)} disabled={selectedStudents.length === 0}
                                            className="flex items-center gap-2 p-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 transition-all disabled:opacity-30 disabled:grayscale hover:shadow-md active:scale-95 text-left">
                                            <Frown size={16} className="shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-semibold leading-tight truncate">{tag.label}</p>
                                                <p className="text-[10px] font-bold opacity-70">{tag.points}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* History View */
                        <div className="card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-border bg-slate-50/50">
                                            <th className="px-4 py-3 text-xs font-semibold text-text-secondary">นักเรียน</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-text-secondary">พฤติกรรม</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-text-secondary hidden sm:table-cell">คะแนน</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-text-secondary hidden md:table-cell">วันที่</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-light">
                                        {logs.map((log: any) => (
                                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-text-secondary">
                                                            {log.student?.user?.firstName?.[0] || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-text-primary">{log.student?.user?.firstName} {log.student?.user?.lastName}</p>
                                                            <p className="text-[10px] text-text-muted">{log.student?.studentCode}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${log.type === 'POSITIVE' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                        {log.type === 'POSITIVE' ? <Smile size={12} /> : <Frown size={12} />}
                                                        {log.content}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 hidden sm:table-cell">
                                                    <span className={`text-sm font-bold ${log.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {log.points > 0 ? '+' : ''}{log.points}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-text-muted hidden md:table-cell">
                                                    <span className="flex items-center gap-1"><Clock size={11} /> {new Date(log.createdAt).toLocaleDateString('th-TH', { dateStyle: 'medium' })}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {logs.length === 0 && (
                                    <div className="py-16 text-center">
                                        <Smile size={40} className="mx-auto text-text-muted mb-3" />
                                        <p className="text-text-secondary font-semibold">ยังไม่มีประวัติพฤติกรรม</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Custom Behavior Modal */}
            <Modal isOpen={showCustomModal} onClose={() => setShowCustomModal(false)} title="บันทึกพฤติกรรมกำหนดเอง" subtitle={`ให้ ${selectedStudents.length} คน`}>
                <div className="p-6 space-y-4">
                    <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                        <button onClick={() => setCustomForm({ ...customForm, type: 'POSITIVE' })}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1 ${customForm.type === 'POSITIVE' ? 'bg-green-500 text-white shadow-sm' : 'text-text-secondary'}`}>
                            <ThumbsUp size={14} /> ดี
                        </button>
                        <button onClick={() => setCustomForm({ ...customForm, type: 'NEGATIVE' })}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1 ${customForm.type === 'NEGATIVE' ? 'bg-red-500 text-white shadow-sm' : 'text-text-secondary'}`}>
                            <ThumbsDown size={14} /> ไม่ดี
                        </button>
                    </div>
                    <div>
                        <label className="label">เหตุผล / พฤติกรรม</label>
                        <input placeholder="เช่น ช่วยทำความสะอาดห้อง..." className="input-field" value={customForm.content} onChange={(e) => setCustomForm({ ...customForm, content: e.target.value })} />
                    </div>
                    <div>
                        <label className="label">คะแนน</label>
                        <input type="number" className="input-field" value={customForm.points} onChange={(e) => setCustomForm({ ...customForm, points: Number(e.target.value) })} />
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-border">
                        <button onClick={() => setShowCustomModal(false)} className="btn-secondary flex-1">ยกเลิก</button>
                        <button onClick={handleCustomSubmit} className="btn-primary flex-1">บันทึก</button>
                    </div>
                </div>
            </Modal>
        </AppShell>
    );
}
