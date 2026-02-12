"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, ChevronRight, ShieldCheck, Zap, BarChart3, Users, MessageCircle, Calendar } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center">
              <GraduationCap size={20} />
            </div>
            <span className="text-base font-bold text-text-primary">WBL Connect</span>
          </div>
          <button onClick={() => router.push('/login')} className="btn-primary">
            เข้าสู่ระบบ <ChevronRight size={16} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-violet-50 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-light text-primary text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            ระบบบริหารจัดการโรงเรียน v2.0
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary tracking-tight mb-6 leading-tight">
            บริหารจัดการโรงเรียน<br />
            <span className="text-primary">อย่างมีประสิทธิภาพ</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-text-secondary leading-relaxed mb-10">
            แพลตฟอร์มจัดการข้อมูลนักเรียน บุคลากร ตารางสอน และการสื่อสารระหว่างโรงเรียนกับผู้ปกครอง สำหรับโรงเรียนวัดบึงเหล็ก
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => router.push('/login')} className="btn-primary h-12 px-8 text-base">
              เริ่มต้นใช้งาน <ChevronRight size={18} />
            </button>
            <button className="btn-secondary h-12 px-8 text-base">
              ดูฟีเจอร์ทั้งหมด
            </button>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="card p-2 shadow-elevated">
              <div className="h-8 bg-slate-50 rounded-t-lg flex items-center px-3 gap-1.5 border-b border-border">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <div className="h-[300px] md:h-[420px] bg-gradient-to-br from-slate-50 to-blue-50 rounded-b-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto mb-4">
                    <GraduationCap size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-text-primary mb-1">WBL Connect</h3>
                  <p className="text-sm text-text-muted">ระบบพร้อมใช้งาน</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight mb-3">ฟีเจอร์หลัก</h2>
            <p className="text-text-secondary max-w-lg mx-auto">เครื่องมือครบครันสำหรับการบริหารจัดการโรงเรียนยุคใหม่</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard icon={ShieldCheck} color="blue" title="ปลอดภัยระดับสูง" desc="ระบบยืนยันตัวตนและเข้ารหัสข้อมูลมาตรฐาน ปกป้องข้อมูลนักเรียนและบุคลากร" />
            <FeatureCard icon={BarChart3} color="violet" title="วิเคราะห์ข้อมูล" desc="ติดตามสถิติการมาเรียน ผลการเรียน และพฤติกรรมนักเรียนแบบ Real-time" />
            <FeatureCard icon={Zap} color="amber" title="รวดเร็วทันใจ" desc="ระบบตอบสนองไว รองรับผู้ใช้งานจำนวนมากพร้อมกันได้อย่างราบรื่น" />
            <FeatureCard icon={Users} color="emerald" title="ใช้งานง่าย" desc="ออกแบบสำหรับทุกคน ไม่ว่าจะเป็นผู้บริหาร ครู นักเรียน หรือผู้ปกครอง" />
            <FeatureCard icon={MessageCircle} color="green" title="แจ้งเตือนผ่าน LINE" desc="ส่งข่าวสาร ผลการเรียน และการแจ้งเตือนถึงผู้ปกครองผ่าน LINE โดยตรง" />
            <FeatureCard icon={Calendar} color="rose" title="จัดตารางสอน" desc="ระบบจัดตารางสอนอัตโนมัติ ดูได้ทั้งมุมครูและมุมห้องเรียน" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary text-white flex items-center justify-center">
              <GraduationCap size={16} />
            </div>
            <span className="text-sm font-semibold text-text-primary">WBL Connect</span>
          </div>
          <p className="text-sm text-text-muted">© 2024 โรงเรียนวัดบึงเหล็ก</p>
        </div>
      </footer>
    </div>
  );
}

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  violet: 'bg-violet-50 text-violet-600',
  amber: 'bg-amber-50 text-amber-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  green: 'bg-green-50 text-green-600',
  rose: 'bg-rose-50 text-rose-600',
};

function FeatureCard({ icon: Icon, color, title, desc }: { icon: any; color: string; title: string; desc: string }) {
  return (
    <div className="card-hover p-6">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-4 ${colorMap[color] || colorMap.blue}`}>
        <Icon size={22} />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1.5">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
    </div>
  );
}
