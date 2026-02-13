"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, ChevronRight, ShieldCheck, Zap, BarChart3, Users, MessageCircle, Calendar, ArrowRight, Sparkles } from 'lucide-react';

const FEATURES = [
  { icon: ShieldCheck, title: 'ปลอดภัยระดับสูง', desc: 'ระบบยืนยันตัวตนและเข้ารหัสข้อมูลมาตรฐาน ปกป้องข้อมูลนักเรียนและบุคลากร', color: '#60a5fa', bg: 'rgba(59,130,246,0.1)', glow: 'rgba(59,130,246,0.15)' },
  { icon: BarChart3, title: 'วิเคราะห์ข้อมูล', desc: 'ติดตามสถิติการมาเรียน ผลการเรียน และพฤติกรรมนักเรียนแบบ Real-time', color: '#c084fc', bg: 'rgba(168,85,247,0.1)', glow: 'rgba(168,85,247,0.15)' },
  { icon: Zap, title: 'รวดเร็วทันใจ', desc: 'ระบบตอบสนองไว รองรับผู้ใช้งานจำนวนมากพร้อมกันได้อย่างราบรื่น', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', glow: 'rgba(251,191,36,0.15)' },
  { icon: Users, title: 'ใช้งานง่าย', desc: 'ออกแบบสำหรับทุกคน ไม่ว่าจะเป็นผู้บริหาร ครู นักเรียน หรือผู้ปกครอง', color: '#34d399', bg: 'rgba(52,211,153,0.1)', glow: 'rgba(52,211,153,0.15)' },
  { icon: MessageCircle, title: 'แจ้งเตือนผ่าน LINE', desc: 'ส่งข่าวสาร ผลการเรียน และการแจ้งเตือนถึงผู้ปกครองผ่าน LINE โดยตรง', color: '#fb7185', bg: 'rgba(244,63,94,0.1)', glow: 'rgba(244,63,94,0.15)' },
  { icon: Calendar, title: 'จัดตารางสอน', desc: 'ระบบจัดตารางสอนอัตโนมัติ ดูได้ทั้งมุมครูและมุมห้องเรียน', color: '#22d3ee', bg: 'rgba(34,211,238,0.1)', glow: 'rgba(34,211,238,0.15)' },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen font-sans bg-background relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 gradient-mesh pointer-events-none" />
      <div className="fixed top-[-10%] left-[10%] w-[500px] h-[500px] opacity-20 pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 65%)' }} />
      <div className="fixed bottom-[10%] right-[5%] w-[400px] h-[400px] opacity-15 pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 65%)' }} />
      <div className="fixed top-[50%] left-[50%] w-[300px] h-[300px] opacity-10 pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.2) 0%, transparent 65%)' }} />

      {/* ═══ Nav ═══ */}
      <nav className="sticky top-0 z-50 glass-dark" style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', boxShadow: '0 0 16px rgba(59,130,246,0.25)' }}>
              <GraduationCap size={17} className="text-white" />
            </div>
            <div>
              <span className="text-[14px] font-bold text-text-primary tracking-tight block leading-tight">WBL Connect</span>
              <span className="text-[10px] text-text-muted font-medium">School Management</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/login')} className="btn-primary h-10 px-6 text-[13px]">
              เข้าสู่ระบบ <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ Hero ═══ */}
      <section className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-semibold mb-8"
               style={{ background: 'rgba(34,211,238,0.08)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.15)' }}>
            <Sparkles size={13} />
            School Management System v2.0
          </div>

          <h1 className="text-[40px] md:text-[52px] lg:text-[64px] font-bold text-text-primary leading-[1.05] mb-6 tracking-tight">
            บริหารจัดการโรงเรียน<br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #60a5fa, #c084fc, #22d3ee)' }}>อย่างมีประสิทธิภาพ</span>
          </h1>

          <p className="max-w-xl mx-auto text-[16px] text-text-secondary leading-relaxed mb-10">
            แพลตฟอร์มจัดการข้อมูลนักเรียน บุคลากร ตารางสอน และการสื่อสาร สำหรับโรงเรียนวัดบึงเหล็ก ในพระบรมราชานุเคราะห์
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button onClick={() => router.push('/login')} className="btn-primary h-12 px-8 text-[15px]">
              เริ่มต้นใช้งาน <ChevronRight size={16} />
            </button>
            <button className="btn-secondary h-12 px-8 text-[15px]">
              ดูฟีเจอร์ทั้งหมด
            </button>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
            <StatItem value="500+" label="นักเรียน" color="#60a5fa" />
            <StatItem value="50+" label="บุคลากร" color="#c084fc" />
            <StatItem value="20+" label="ห้องเรียน" color="#22d3ee" />
            <StatItem value="99.9%" label="Uptime" color="#34d399" />
          </div>
        </div>
      </section>

      {/* ═══ Features ═══ */}
      <section className="relative py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold mb-5"
                 style={{ background: 'rgba(168,85,247,0.08)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.15)' }}>
              ฟีเจอร์ครบครัน
            </div>
            <h2 className="text-[30px] md:text-[38px] font-bold text-text-primary mb-3 tracking-tight">เครื่องมือสำหรับโรงเรียนยุคใหม่</h2>
            <p className="text-text-secondary text-[15px] max-w-lg mx-auto">ระบบจัดการครบวงจร ตั้งแต่ข้อมูลนักเรียน ตารางสอน ไปจนถึงการสื่อสารกับผู้ปกครอง</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {FEATURES.map((f, i) => (
              <FeatureCard key={i} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="relative py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="rounded-2xl p-10 md:p-14"
               style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(168,85,247,0.06) 50%, rgba(34,211,238,0.04) 100%)', border: '1px solid rgba(148,163,184,0.08)' }}>
            <h3 className="text-[26px] md:text-[32px] font-bold text-text-primary mb-4 tracking-tight">พร้อมเริ่มต้นใช้งาน?</h3>
            <p className="text-[15px] text-text-secondary mb-8 max-w-md mx-auto">เข้าสู่ระบบเพื่อเริ่มต้นบริหารจัดการโรงเรียนอย่างมีประสิทธิภาพ</p>
            <button onClick={() => router.push('/login')} className="btn-primary h-12 px-10 text-[15px]">
              เข้าสู่ระบบเลย <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="relative py-10" style={{ borderTop: '1px solid rgba(148,163,184,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}>
              <GraduationCap size={13} className="text-white" />
            </div>
            <span className="text-[13px] font-semibold text-text-secondary">WBL Connect</span>
          </div>
          <p className="text-[12px] text-text-muted">© {new Date().getFullYear()} โรงเรียนวัดบึงเหล็ก ในพระบรมราชานุเคราะห์</p>
        </div>
      </footer>
    </div>
  );
}

function StatItem({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="text-center">
      <p className="text-[28px] md:text-[32px] font-bold tracking-tight" style={{ color }}>{value}</p>
      <p className="text-[12px] text-text-muted font-medium mt-0.5">{label}</p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, color, bg, glow }: { icon: any; title: string; desc: string; color: string; bg: string; glow: string }) {
  return (
    <div className="card-glass p-7 animate-fade-in group transition-all duration-300 cursor-default"
         onMouseEnter={(e) => { e.currentTarget.style.borderColor = glow; e.currentTarget.style.boxShadow = `0 0 28px ${glow}`; e.currentTarget.style.transform = 'translateY(-3px)'; }}
         onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(148,163,184,0.12)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
           style={{ background: bg, boxShadow: `0 0 16px ${glow}` }}>
        <Icon size={20} strokeWidth={1.5} style={{ color }} />
      </div>
      <h3 className="text-[15px] font-semibold text-text-primary mb-2 tracking-tight">{title}</h3>
      <p className="text-[14px] text-text-secondary leading-relaxed">{desc}</p>
    </div>
  );
}
