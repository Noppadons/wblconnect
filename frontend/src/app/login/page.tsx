"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Lock, LogIn, GraduationCap, BookOpen, Users, Clock, Shield, Eye, EyeOff } from "lucide-react";
import { API_URL } from "@/lib/api";
import type { LoginResponse } from "@/lib/types";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState("");
    const router = useRouter();

    useEffect(() => {
        const update = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
        };
        update();
        const interval = setInterval(update, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                let msg = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
                try { const errorData = await response.json(); msg = errorData.message || msg; } catch { }
                throw new Error(msg);
            }

            const loginRes: LoginResponse = await response.json();
            sessionStorage.setItem('user', JSON.stringify(loginRes.user));
            toast.success(`ยินดีต้อนรับ ${loginRes.user.firstName}`);

            if (loginRes.user.role === 'ADMIN') {
                router.push('/admin/dashboard');
            } else if (loginRes.user.role === 'STUDENT') {
                router.push('/student/profile');
            } else {
                router.push('/teacher/dashboard');
            }
        } catch (err: unknown) {
            const error = err as Error;
            if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
                toast.error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
            } else {
                toast.error(error.message || 'เกิดข้อผิดพลาด');
            }
        } finally {
            setLoading(false);
        }
    };

    const today = new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
            {/* ── Background orbs ── */}
            <div className="fixed inset-0 gradient-mesh pointer-events-none" />
            <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] opacity-25 pointer-events-none"
                 style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 65%)' }} />
            <div className="fixed bottom-[-15%] right-[-5%] w-[500px] h-[500px] opacity-20 pointer-events-none"
                 style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 65%)' }} />
            <div className="fixed top-[30%] right-[20%] w-[300px] h-[300px] opacity-15 pointer-events-none"
                 style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 65%)' }} />

            {/* ── Top bar ── */}
            <div className="relative z-10 flex items-center justify-between px-6 lg:px-10 py-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                         style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}>
                        <GraduationCap size={20} className="text-white" />
                    </div>
                    <div>
                        <span className="text-[15px] font-bold text-text-primary tracking-tight block leading-tight">WBL Connect</span>
                        <span className="text-[10px] font-medium text-text-muted">School Management System</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold"
                         style={{ background: 'rgba(34,211,238,0.08)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.15)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                        ระบบพร้อมใช้งาน
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-[20px] font-bold text-text-primary tabular-nums tracking-tight">{currentTime}</p>
                        <p className="text-[11px] text-text-muted leading-tight">{today}</p>
                    </div>
                </div>
            </div>

            {/* ── Main content ── */}
            <div className="flex-1 flex items-center justify-center relative z-10 px-5 pb-8">
                <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

                    {/* Left: Branding + Features */}
                    <div className="flex-1 text-center lg:text-left max-w-lg">
                        <h1 className="text-[36px] lg:text-[44px] xl:text-[50px] font-bold text-text-primary leading-[1.08] mb-4 tracking-tight animate-fade-in">
                            โรงเรียนวัดบึงเหล็ก
                        </h1>
                        <p className="text-[18px] lg:text-[22px] font-semibold mb-6 tracking-tight animate-fade-in"
                           style={{ color: 'transparent', backgroundImage: 'linear-gradient(135deg, #60a5fa, #c084fc, #22d3ee)', backgroundClip: 'text', WebkitBackgroundClip: 'text' }}>
                            ในพระบรมราชานุเคราะห์
                        </p>
                        <p className="text-[15px] text-text-secondary leading-relaxed mb-10 max-w-md mx-auto lg:mx-0 animate-fade-in">
                            ระบบบริหารจัดการโรงเรียนอัจฉริยะ เชื่อมต่อครู นักเรียน และผู้ปกครอง เข้าด้วยกันอย่างไร้รอยต่อ
                        </p>

                        {/* Feature grid — colorful icons */}
                        <div className="grid grid-cols-2 gap-3 stagger-children">
                            <FeatureItem icon={BookOpen} label="จัดการหลักสูตร" desc="ตารางเรียน ตารางสอน" color="#60a5fa" bg="rgba(59,130,246,0.1)" />
                            <FeatureItem icon={Users} label="ข้อมูลนักเรียน" desc="ประวัติ ผลการเรียน" color="#c084fc" bg="rgba(168,85,247,0.1)" />
                            <FeatureItem icon={Clock} label="เช็คชื่อออนไลน์" desc="บันทึก Real-time" color="#34d399" bg="rgba(52,211,153,0.1)" />
                            <FeatureItem icon={Shield} label="แจ้งเตือนอัตโนมัติ" desc="ผ่าน LINE" color="#fb923c" bg="rgba(251,146,60,0.1)" />
                        </div>
                    </div>

                    {/* Right: Login Form */}
                    <div className="w-full max-w-[400px] shrink-0">
                        <div className="rounded-2xl p-8 animate-fade-in-scale"
                             style={{ background: 'rgba(17,24,39,0.7)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(148,163,184,0.08)', boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>

                            <div className="text-center mb-8">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                     style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', boxShadow: '0 0 24px rgba(59,130,246,0.25)' }}>
                                    <LogIn size={20} className="text-white" />
                                </div>
                                <h2 className="text-[22px] font-bold text-text-primary tracking-tight">เข้าสู่ระบบ</h2>
                                <p className="text-[13px] text-text-secondary mt-1">กรุณากรอกข้อมูลเพื่อเข้าใช้งาน</p>
                            </div>

                            <form className="space-y-4" onSubmit={handleLogin}>
                                <div>
                                    <label className="label">อีเมล</label>
                                    <div className="relative">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center z-10"
                                             style={{ background: 'rgba(59,130,246,0.1)' }}>
                                            <Mail size={14} style={{ color: '#60a5fa' }} />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            placeholder="name@school.ac.th"
                                            className="input-field h-12 text-[14px]"
                                            style={{ paddingLeft: '3rem' }}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="label">รหัสผ่าน</label>
                                    <div className="relative">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center z-10"
                                             style={{ background: 'rgba(168,85,247,0.1)' }}>
                                            <Lock size={14} style={{ color: '#c084fc' }} />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            placeholder="กรอกรหัสผ่าน"
                                            className="input-field h-12 text-[14px] !pr-12"
                                            style={{ paddingLeft: '3rem' }}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            autoComplete="current-password"
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-primary rounded-lg transition-colors">
                                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary w-full h-12 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            เข้าสู่ระบบ
                                            <LogIn size={16} />
                                        </>
                                    )}
                                </button>
                            </form>

                            <p className="text-center text-[12px] text-text-muted mt-6">
                                หากลืมรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Footer ── */}
            <div className="relative z-10 text-center py-4">
                <p className="text-[11px] text-text-muted">© {new Date().getFullYear()} WBL Connect v2.0 — โรงเรียนวัดบึงเหล็ก ในพระบรมราชานุเคราะห์</p>
            </div>
        </div>
    );
}

function FeatureItem({ icon: Icon, label, desc, color, bg }: { icon: React.ComponentType<{ size: number; style?: React.CSSProperties }>; label: string; desc: string; color: string; bg: string }) {
    return (
        <div className="flex items-start gap-3 p-3.5 rounded-xl transition-all duration-300 animate-fade-in group"
             style={{ background: 'rgba(148,163,184,0.03)', border: '1px solid rgba(148,163,184,0.06)' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                 style={{ background: bg, boxShadow: `0 0 12px ${bg}` }}>
                <Icon size={16} style={{ color }} />
            </div>
            <div>
                <p className="text-[13px] font-semibold text-text-primary leading-tight">{label}</p>
                <p className="text-[11px] text-text-muted mt-0.5">{desc}</p>
            </div>
        </div>
    );
}

