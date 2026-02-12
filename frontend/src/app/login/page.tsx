"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Lock, LogIn, GraduationCap, BookOpen, Users, Clock, Shield, Eye, EyeOff } from "lucide-react";

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
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                let msg = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
                try { const errorData = await response.json(); msg = errorData.message || msg; } catch {}
                throw new Error(msg);
            }

            const loginRes = await response.json();
            localStorage.setItem('user', JSON.stringify(loginRes.user));
            toast.success(`ยินดีต้อนรับ ${loginRes.user.firstName}`);

            if (loginRes.user.role === 'ADMIN') {
                router.push('/admin/dashboard');
            } else if (loginRes.user.role === 'STUDENT') {
                router.push('/student/profile');
            } else {
                router.push('/teacher/dashboard');
            }
        } catch (err: any) {
            if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
                toast.error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
            } else {
                toast.error(err.message || 'เกิดข้อผิดพลาด');
            }
        } finally {
            setLoading(false);
        }
    };

    const today = new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="min-h-screen flex">
            {/* Left: Visual Panel */}
            <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />

                {/* Decorative shapes */}
                <div className="absolute inset-0">
                    <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full" />
                    <div className="absolute bottom-[-20%] left-[-5%] w-[400px] h-[400px] bg-blue-400/10 rounded-full" />
                    <div className="absolute top-[40%] right-[20%] w-[200px] h-[200px] bg-indigo-400/10 rounded-full" />
                    {/* Grid pattern */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                </div>

                <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white">
                    {/* Top: Logo + Time */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                <GraduationCap size={26} />
                            </div>
                            <div>
                                <p className="text-lg font-bold tracking-tight">WBL Connect</p>
                                <p className="text-[11px] text-blue-200">School Management System</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold tabular-nums">{currentTime}</p>
                            <p className="text-[11px] text-blue-200">{today}</p>
                        </div>
                    </div>

                    {/* Center: Main content */}
                    <div className="flex-1 flex flex-col justify-center max-w-lg">
                        <div className="mb-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-medium text-blue-100 mb-6">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                ระบบพร้อมใช้งาน
                            </div>
                            <h1 className="text-4xl xl:text-5xl font-bold leading-[1.15] tracking-tight mb-5">
                                โรงเรียนวัดบึงเหล็ก<br />
                                <span className="text-blue-200">ในพระบรมราชานุเคราะห์</span>
                            </h1>
                            <p className="text-blue-100/80 text-base leading-relaxed max-w-md">
                                ระบบบริหารจัดการโรงเรียนอัจฉริยะ เชื่อมต่อครู นักเรียน และผู้ปกครอง เข้าด้วยกันอย่างไร้รอยต่อ
                            </p>
                        </div>

                        {/* Feature highlights */}
                        <div className="grid grid-cols-2 gap-3">
                            <FeatureItem icon={BookOpen} label="จัดการหลักสูตร" desc="ตารางเรียน ตารางสอน" />
                            <FeatureItem icon={Users} label="ข้อมูลนักเรียน" desc="ประวัติ ผลการเรียน" />
                            <FeatureItem icon={Clock} label="เช็คชื่อออนไลน์" desc="บันทึกแบบ Real-time" />
                            <FeatureItem icon={Shield} label="แจ้งเตือนผู้ปกครอง" desc="ผ่าน LINE อัตโนมัติ" />
                        </div>
                    </div>

                    {/* Bottom */}
                    <div className="flex items-center justify-between text-xs text-blue-300/60">
                        <p>WBL Connect v2.0</p>
                        <p>สำนักงานเขตพื้นที่การศึกษามัธยมศึกษา</p>
                    </div>
                </div>
            </div>

            {/* Right: Login Form */}
            <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-6 relative">
                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                <div className="w-full max-w-[400px] relative z-10">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
                            <GraduationCap size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-text-primary">WBL Connect</h2>
                        <p className="text-xs text-text-muted mt-1">โรงเรียนวัดบึงเหล็ก ในพระบรมราชานุเคราะห์</p>
                    </div>

                    {/* Welcome text */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-text-primary mb-2">เข้าสู่ระบบ</h1>
                        <p className="text-sm text-text-muted">ยินดีต้อนรับกลับ กรุณากรอกข้อมูลเพื่อเข้าใช้งาน</p>
                    </div>

                    {/* Login Form */}
                    <form className="space-y-5" onSubmit={handleLogin}>
                        <div>
                            <label className="text-sm font-medium text-text-secondary mb-1.5 block">อีเมล</label>
                            <div className="relative group">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors z-10" />
                                <input
                                    type="email"
                                    required
                                    placeholder="name@school.ac.th"
                                    className="input-field !pl-12 h-12 text-[15px]"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-text-secondary mb-1.5 block">รหัสผ่าน</label>
                            <div className="relative group">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors z-10" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    placeholder="กรอกรหัสผ่าน"
                                    className="input-field !pl-12 !pr-12 h-12 text-[15px]"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-blue-600" />
                                <span className="text-sm text-text-secondary">จดจำการเข้าสู่ระบบ</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-[15px] flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98]"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    เข้าสู่ระบบ
                                    <LogIn size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-xs text-text-muted mt-8">
                        หากลืมรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ
                    </p>
                </div>
            </div>
        </div>
    );
}

function FeatureItem({ icon: Icon, label, desc }: { icon: any; label: string; desc: string }) {
    return (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <Icon size={18} />
            </div>
            <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight">{label}</p>
                <p className="text-[11px] text-blue-200/70 mt-0.5">{desc}</p>
            </div>
        </div>
    );
}

