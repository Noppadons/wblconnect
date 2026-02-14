"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { ClipboardList, CheckCircle, Send } from 'lucide-react';
import AppShell from '@/components/Layout/AppShell';
import Modal from '@/components/Common/Modal';
import api from '@/lib/api';
import { STUDENT_SIDEBAR } from '@/lib/sidebar';
import { useUser } from '@/lib/useUser';
import type { Survey } from '@/lib/types';
import { toast } from 'sonner';

export default function StudentSurveyPage() {
    const { user } = useUser();
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [submitting, setSubmitting] = useState(false);

    const fetchSurveys = useCallback(async () => {
        try {
            const res = await api.get('/survey');
            setSurveys(res.data);
        } catch { toast.error('โหลดข้อมูลไม่สำเร็จ'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchSurveys(); }, [fetchSurveys]);

    const openSurvey = (survey: Survey) => {
        setActiveSurvey(survey);
        setAnswers({});
    };

    const handleSubmit = async () => {
        if (!activeSurvey) return;

        // Validate required
        for (const q of activeSurvey.questions) {
            if (q.required && (answers[q.id] === undefined || answers[q.id] === '')) {
                return toast.error(`กรุณาตอบคำถาม: ${q.text}`);
            }
        }

        setSubmitting(true);
        try {
            await api.post('/survey/respond', {
                surveyId: activeSurvey.id,
                answers,
            });
            toast.success('ส่งคำตอบสำเร็จ!');
            setActiveSurvey(null);
            fetchSurveys();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'ส่งคำตอบไม่สำเร็จ');
        } finally {
            setSubmitting(false);
        }
    };

    const hasResponded = (survey: Survey) => {
        return survey.responses && survey.responses.length > 0;
    };

    return (
        <AppShell role="STUDENT" sidebarItems={STUDENT_SIDEBAR} user={user}
            pageTitle="แบบประเมิน"
            pageSubtitle={`${surveys.length} แบบประเมิน`}
        >
            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
            ) : surveys.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">ยังไม่มีแบบประเมิน</p>
                    <p className="text-sm">แบบประเมินจากครูจะแสดงที่นี่</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {surveys.map((s) => {
                        const responded = hasResponded(s);
                        return (
                            <div key={s.id} className="bg-white rounded-xl border p-5 flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">{s.title}</h3>
                                    {s.description && <p className="text-sm text-gray-500 truncate">{s.description}</p>}
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                        <span>{s.questions.length} คำถาม</span>
                                        {s.isAnonymous && <span className="text-purple-500">ไม่ระบุตัวตน</span>}
                                        {s.endsAt && <span>หมดเขต {new Date(s.endsAt).toLocaleDateString('th-TH')}</span>}
                                    </div>
                                </div>
                                {responded ? (
                                    <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                                        <CheckCircle className="w-4 h-4" /> ตอบแล้ว
                                    </span>
                                ) : (
                                    <button onClick={() => openSurvey(s)}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 font-medium">
                                        ทำแบบประเมิน
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Answer Survey Modal */}
            <Modal isOpen={!!activeSurvey} onClose={() => setActiveSurvey(null)} title={activeSurvey?.title || 'แบบประเมิน'}>
                {activeSurvey && (
                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                        {activeSurvey.description && (
                            <p className="text-sm text-gray-500">{activeSurvey.description}</p>
                        )}

                        {activeSurvey.questions.map((q, idx) => (
                            <div key={q.id} className="space-y-2">
                                <p className="text-sm font-medium text-gray-800">
                                    {idx + 1}. {q.text}
                                    {q.required && <span className="text-red-500 ml-1">*</span>}
                                </p>

                                {q.type === 'RATING' && (
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((v) => (
                                            <button key={v} type="button"
                                                onClick={() => setAnswers({ ...answers, [q.id]: v })}
                                                className={`w-10 h-10 rounded-lg border-2 text-sm font-bold transition-all ${
                                                    answers[q.id] === v
                                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                                                }`}>
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {q.type === 'CHOICE' && (
                                    <div className="space-y-1.5">
                                        {q.options.map((opt) => (
                                            <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                                                <input type="radio" name={`q-${q.id}`}
                                                    checked={answers[q.id] === opt}
                                                    onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                                                    className="text-indigo-600" />
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {q.type === 'YESNO' && (
                                    <div className="flex gap-3">
                                        {['ใช่', 'ไม่ใช่'].map((opt) => (
                                            <button key={opt} type="button"
                                                onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                                                className={`px-6 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                                                    answers[q.id] === opt
                                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                                }`}>
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {q.type === 'TEXT' && (
                                    <textarea
                                        value={answers[q.id] || ''}
                                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 border rounded-lg text-sm"
                                        placeholder="พิมพ์คำตอบ..."
                                    />
                                )}
                            </div>
                        ))}

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <button onClick={() => setActiveSurvey(null)} className="px-4 py-2 border rounded-lg text-sm">ยกเลิก</button>
                            <button onClick={handleSubmit} disabled={submitting}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
                                <Send className="w-4 h-4" /> {submitting ? 'กำลังส่ง...' : 'ส่งคำตอบ'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </AppShell>
    );
}
