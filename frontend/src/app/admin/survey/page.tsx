"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { ClipboardList, Plus, Trash2, ToggleLeft, ToggleRight, BarChart3 } from 'lucide-react';
import AppShell from '@/components/Layout/AppShell';
import Modal from '@/components/Common/Modal';
import api from '@/lib/api';
import { ADMIN_SIDEBAR } from '@/lib/sidebar';
import { useUser } from '@/lib/useUser';
import type { Survey, SurveyResults, SurveyQuestionType } from '@/lib/types';
import { toast } from 'sonner';

const QUESTION_TYPES: { value: SurveyQuestionType; label: string }[] = [
    { value: 'RATING', label: 'ให้คะแนน (1-5)' },
    { value: 'CHOICE', label: 'เลือกตอบ' },
    { value: 'YESNO', label: 'ใช่/ไม่ใช่' },
    { value: 'TEXT', label: 'ข้อความ' },
];

interface QuestionDraft {
    text: string;
    type: SurveyQuestionType;
    options: string[];
    required: boolean;
}

export default function AdminSurveyPage() {
    const { user } = useUser();
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [results, setResults] = useState<SurveyResults | null>(null);
    const [resultsLoading, setResultsLoading] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [endsAt, setEndsAt] = useState('');
    const [questions, setQuestions] = useState<QuestionDraft[]>([
        { text: '', type: 'RATING', options: [], required: true },
    ]);

    const fetchSurveys = useCallback(async () => {
        try {
            const res = await api.get('/survey');
            setSurveys(res.data);
        } catch { toast.error('โหลดข้อมูลไม่สำเร็จ'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchSurveys(); }, [fetchSurveys]);

    const addQuestion = () => {
        setQuestions([...questions, { text: '', type: 'RATING', options: [], required: true }]);
    };

    const removeQuestion = (idx: number) => {
        if (questions.length <= 1) return;
        setQuestions(questions.filter((_, i) => i !== idx));
    };

    const updateQuestion = (idx: number, field: keyof QuestionDraft, value: any) => {
        const updated = [...questions];
        (updated[idx] as any)[field] = value;
        setQuestions(updated);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return toast.error('กรุณากรอกชื่อแบบประเมิน');
        if (questions.some((q) => !q.text.trim())) return toast.error('กรุณากรอกคำถามให้ครบ');

        try {
            await api.post('/survey', {
                title,
                description: description || undefined,
                isAnonymous,
                endsAt: endsAt || undefined,
                questions: questions.map((q, i) => ({
                    text: q.text,
                    type: q.type,
                    options: q.type === 'CHOICE' ? q.options.filter((o) => o.trim()) : [],
                    required: q.required,
                    order: i,
                })),
            });
            toast.success('สร้างแบบประเมินสำเร็จ');
            setShowCreate(false);
            resetForm();
            fetchSurveys();
        } catch { toast.error('สร้างไม่สำเร็จ'); }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setIsAnonymous(false);
        setEndsAt('');
        setQuestions([{ text: '', type: 'RATING', options: [], required: true }]);
    };

    const handleToggle = async (id: string) => {
        try {
            await api.put(`/survey/${id}/toggle`);
            fetchSurveys();
        } catch { toast.error('เปลี่ยนสถานะไม่สำเร็จ'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบแบบประเมินนี้?')) return;
        try {
            await api.delete(`/survey/${id}`);
            toast.success('ลบสำเร็จ');
            fetchSurveys();
        } catch { toast.error('ลบไม่สำเร็จ'); }
    };

    const viewResults = async (id: string) => {
        setResultsLoading(true);
        setShowResults(true);
        try {
            const res = await api.get(`/survey/${id}/results`);
            setResults(res.data);
        } catch { toast.error('โหลดผลไม่สำเร็จ'); }
        finally { setResultsLoading(false); }
    };

    return (
        <AppShell role="ADMIN" sidebarItems={ADMIN_SIDEBAR} user={user}
            pageTitle="แบบประเมิน"
            pageSubtitle={`${surveys.length} แบบประเมิน`}
        >
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                    <Plus className="w-4 h-4" /> สร้างแบบประเมิน
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
            ) : surveys.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">ยังไม่มีแบบประเมิน</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {surveys.map((s) => (
                        <div key={s.id} className="bg-white rounded-xl border p-5 flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">{s.title}</h3>
                                {s.description && <p className="text-sm text-gray-500 truncate">{s.description}</p>}
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                    <span>{s.questions.length} คำถาม</span>
                                    <span>{s._count?.responses ?? 0} คำตอบ</span>
                                    {s.isAnonymous && <span className="text-purple-500">ไม่ระบุตัวตน</span>}
                                    {s.endsAt && <span>หมดเขต {new Date(s.endsAt).toLocaleDateString('th-TH')}</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleToggle(s.id)} title={s.isActive ? 'ปิด' : 'เปิด'}
                                    className={`p-2 rounded-lg ${s.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}>
                                    {s.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                </button>
                                <button onClick={() => viewResults(s.id)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="ดูผล">
                                    <BarChart3 className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDelete(s.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg" title="ลบ">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Survey Modal */}
            <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); resetForm(); }} title="สร้างแบบประเมิน">
                <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อแบบประเมิน *</label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} required
                            className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                            className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="rounded" />
                            ไม่ระบุตัวตน
                        </label>
                        <div className="flex-1">
                            <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="หมดเขต (ไม่บังคับ)" />
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <p className="text-sm font-medium text-gray-700 mb-3">คำถาม</p>
                        {questions.map((q, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-400 w-6">{idx + 1}.</span>
                                    <input value={q.text} onChange={(e) => updateQuestion(idx, 'text', e.target.value)}
                                        placeholder="คำถาม" className="flex-1 px-3 py-1.5 border rounded-lg text-sm" />
                                    {questions.length > 1 && (
                                        <button type="button" onClick={() => removeQuestion(idx)} className="text-red-400 hover:text-red-600 p-1">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 ml-6">
                                    <select value={q.type} onChange={(e) => updateQuestion(idx, 'type', e.target.value)}
                                        className="px-2 py-1 border rounded text-xs">
                                        {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                    <label className="flex items-center gap-1 text-xs text-gray-500">
                                        <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(idx, 'required', e.target.checked)} className="rounded" />
                                        บังคับตอบ
                                    </label>
                                </div>
                                {q.type === 'CHOICE' && (
                                    <div className="ml-6 space-y-1">
                                        {q.options.map((opt, oi) => (
                                            <div key={oi} className="flex items-center gap-2">
                                                <input value={opt} onChange={(e) => {
                                                    const newOpts = [...q.options];
                                                    newOpts[oi] = e.target.value;
                                                    updateQuestion(idx, 'options', newOpts);
                                                }} placeholder={`ตัวเลือก ${oi + 1}`} className="flex-1 px-2 py-1 border rounded text-xs" />
                                                <button type="button" onClick={() => {
                                                    updateQuestion(idx, 'options', q.options.filter((_, i) => i !== oi));
                                                }} className="text-red-400 text-xs">ลบ</button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => updateQuestion(idx, 'options', [...q.options, ''])}
                                            className="text-xs text-indigo-600 hover:underline">+ เพิ่มตัวเลือก</button>
                                    </div>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={addQuestion}
                            className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                            <Plus className="w-4 h-4" /> เพิ่มคำถาม
                        </button>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <button type="button" onClick={() => { setShowCreate(false); resetForm(); }} className="px-4 py-2 border rounded-lg text-sm">ยกเลิก</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">สร้าง</button>
                    </div>
                </form>
            </Modal>

            {/* Results Modal */}
            <Modal isOpen={showResults} onClose={() => { setShowResults(false); setResults(null); }} title="ผลแบบประเมิน">
                {resultsLoading ? (
                    <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                ) : results ? (
                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                        <div className="text-center">
                            <h3 className="font-semibold text-lg">{results.survey.title}</h3>
                            <p className="text-sm text-gray-500">{results.totalResponses} คำตอบ</p>
                        </div>
                        {results.questionResults.map((qr, idx) => (
                            <div key={qr.questionId} className="bg-gray-50 rounded-lg p-4">
                                <p className="font-medium text-sm mb-2">{idx + 1}. {qr.text}</p>
                                {qr.type === 'RATING' && qr.average !== undefined && (
                                    <div>
                                        <p className="text-2xl font-bold text-indigo-600">{qr.average} <span className="text-sm font-normal text-gray-400">/ 5</span></p>
                                        {qr.distribution && (
                                            <div className="flex gap-1 mt-2">
                                                {qr.distribution.map((d) => (
                                                    <div key={d.value} className="flex-1 text-center">
                                                        <div className="bg-indigo-100 rounded-t" style={{ height: `${Math.max(4, (d.count / Math.max(qr.total, 1)) * 60)}px` }} />
                                                        <p className="text-xs text-gray-500 mt-1">{d.value}</p>
                                                        <p className="text-xs text-gray-400">{d.count}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {(qr.type === 'CHOICE' || qr.type === 'YESNO') && qr.distribution && (
                                    <div className="space-y-1">
                                        {qr.distribution.map((d) => (
                                            <div key={String(d.value)} className="flex items-center gap-2">
                                                <span className="text-xs w-20 truncate">{d.value}</span>
                                                <div className="flex-1 bg-gray-200 rounded-full h-4">
                                                    <div className="bg-indigo-500 rounded-full h-4" style={{ width: `${(d.count / Math.max(qr.total, 1)) * 100}%` }} />
                                                </div>
                                                <span className="text-xs text-gray-500 w-8 text-right">{d.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {qr.type === 'TEXT' && qr.answers && (
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        {qr.answers.map((a, i) => (
                                            <p key={i} className="text-sm text-gray-600 bg-white rounded px-2 py-1">{a}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : null}
            </Modal>
        </AppShell>
    );
}
