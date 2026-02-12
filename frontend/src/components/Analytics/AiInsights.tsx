"use client";

import React, { useEffect, useState } from 'react';
import { Brain, TrendingUp, Activity, Lightbulb } from 'lucide-react';
import api from '@/lib/api';

interface Recommendation {
    subject: string;
    advice: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface InsightData {
    studentName: string;
    gpaPrediction: number;
    behaviorScore: number;
    recommendations: Recommendation[];
    stats: {
        totalSubmissions: number;
        attendanceRate: number;
    };
}

export default function AiInsights({ studentId }: { studentId: string }) {
    const [data, setData] = useState<InsightData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const res = await api.get(`/analytics/student/${studentId}`);
                setData(res.data);
            } catch (err) { console.error('Failed to fetch AI insights:', err); }
            finally { setLoading(false); }
        };
        fetchInsights();
    }, [studentId]);

    if (loading) {
        return (
            <div className="card p-6 flex items-center justify-center min-h-[200px]">
                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-4">
            <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Brain size={16} className="text-primary" />
                    <h3 className="text-sm font-semibold text-text-primary">AI วิเคราะห์</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-text-muted mb-1">พยากรณ์ GPA</p>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold text-text-primary">{data.gpaPrediction.toFixed(2)}</span>
                            <TrendingUp size={14} className="text-green-500" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-text-muted mb-1">คะแนนความประพฤติ</p>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold text-text-primary">{data.behaviorScore}</span>
                            <Activity size={14} className="text-primary" />
                        </div>
                    </div>
                </div>
            </div>

            {data.recommendations.length > 0 && (
                <div className="card p-5">
                    <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
                        <Lightbulb size={16} className="text-amber-500" />
                        ข้อแนะนำ
                    </h3>
                    <div className="space-y-2">
                        {data.recommendations.map((rec, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${rec.priority === 'HIGH' ? 'bg-red-500' : rec.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-green-500'}`} />
                                <div className="min-w-0">
                                    <p className="text-xs text-text-muted">{rec.subject}</p>
                                    <p className="text-sm text-text-primary">{rec.advice}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
