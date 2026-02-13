"use client";

import React, { useState, useEffect } from 'react';
import {
    Menu,
    X,
    LogOut,
    User,
    ChevronLeft,
    GraduationCap,
    Lock,
    Search,
    Bell,
    Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { SidebarItem } from '@/lib/sidebar';
import ChangePasswordModal from '../Auth/ChangePasswordModal';
import { API_URL } from '@/lib/api';
import { normalizeUrl } from '@/lib/url';
import { clearUserCache } from '@/lib/useUser';

interface AppShellProps {
    children: React.ReactNode;
    role: 'ADMIN' | 'TEACHER' | 'STUDENT';
    user?: any;
    sidebarItems: SidebarItem[];
    pageTitle?: string;
    pageSubtitle?: string;
    headerActions?: React.ReactNode;
}

const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'ผู้ดูแลระบบ',
    TEACHER: 'ครูผู้สอน',
    STUDENT: 'นักเรียน',
};

const ROLE_COLORS: Record<string, string> = {
    ADMIN: '#f43f5e',
    TEACHER: '#3b82f6',
    STUDENT: '#22d3ee',
};

// Rotating neon colors for each sidebar item
const ICON_COLORS = [
    { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', glow: 'rgba(59,130,246,0.2)' },   // blue
    { bg: 'rgba(168,85,247,0.12)', color: '#c084fc', glow: 'rgba(168,85,247,0.2)' },   // purple
    { bg: 'rgba(34,211,238,0.12)', color: '#22d3ee', glow: 'rgba(34,211,238,0.2)' },   // cyan
    { bg: 'rgba(244,63,94,0.12)', color: '#fb7185', glow: 'rgba(244,63,94,0.2)' },     // rose
    { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', glow: 'rgba(251,191,36,0.2)' },   // amber
    { bg: 'rgba(52,211,153,0.12)', color: '#34d399', glow: 'rgba(52,211,153,0.2)' },   // emerald
    { bg: 'rgba(129,140,248,0.12)', color: '#818cf8', glow: 'rgba(129,140,248,0.2)' }, // indigo
    { bg: 'rgba(251,146,60,0.12)', color: '#fb923c', glow: 'rgba(251,146,60,0.2)' },   // orange
    { bg: 'rgba(236,72,153,0.12)', color: '#ec4899', glow: 'rgba(236,72,153,0.2)' },   // pink
];

export default function AppShell({ children, role, user, sidebarItems, pageTitle, pageSubtitle, headerActions }: AppShellProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const [ready, setReady] = useState(false);

    useEffect(() => {
        const hasSession = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (!user && !hasSession) {
            router.replace('/login');
        } else {
            setReady(true);
        }
    }, [router, user]);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        } catch (err) {
            console.error('Logout request failed:', err);
        }
        clearUserCache();
        router.replace('/login');
    };

    if (!ready) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background gradient-mesh">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center animate-glow"
                         style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}>
                        <GraduationCap size={20} className="text-white" />
                    </div>
                    <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    const sidebarWidth = collapsed ? 'w-[76px]' : 'w-[272px]';
    const roleColor = ROLE_COLORS[role] || '#3b82f6';

    const renderNavItem = (item: SidebarItem, index: number, isMobile = false) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
        const ic = ICON_COLORS[index % ICON_COLORS.length];

        return (
            <Link
                key={item.href}
                href={item.href}
                title={collapsed && !isMobile ? item.label : undefined}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 ${collapsed && !isMobile ? 'justify-center' : ''}`}
                style={isActive ? {
                    background: ic.bg,
                    boxShadow: `0 0 16px ${ic.glow}, inset 0 0 16px ${ic.glow}`,
                } : {}}
            >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${isActive ? '' : 'group-hover:scale-110'}`}
                     style={isActive
                         ? { background: ic.bg, boxShadow: `0 0 10px ${ic.glow}` }
                         : { background: 'rgba(148,163,184,0.06)' }
                     }>
                    <item.icon size={16} strokeWidth={isActive ? 2 : 1.5}
                        style={{ color: isActive ? ic.color : '#64748b' }}
                        className="transition-colors group-hover:!text-text-primary" />
                </div>
                {(isMobile || !collapsed) && (
                    <span className={`truncate transition-colors ${isActive ? 'font-semibold' : 'text-text-secondary group-hover:text-text-primary'}`}
                          style={isActive ? { color: ic.color } : {}}>
                        {item.label}
                    </span>
                )}
            </Link>
        );
    };

    return (
        <div className="min-h-screen flex bg-background">
            {/* ═══ Desktop Sidebar ═══ */}
            <aside className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-out ${sidebarWidth}`}
                   style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(11,17,32,0.98) 100%)', borderRight: '1px solid rgba(148,163,184,0.06)' }}>

                {/* ── User Profile Area ── */}
                <div className={`shrink-0 ${collapsed ? 'px-3 py-4' : 'px-5 pt-6 pb-5'}`}>
                    {collapsed ? (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
                                 style={{ background: `linear-gradient(135deg, ${roleColor}22, ${roleColor}11)`, border: `1px solid ${roleColor}33` }}>
                                {user?.avatarUrl ? (
                                    <img src={normalizeUrl(user.avatarUrl)} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <User size={16} style={{ color: roleColor }} />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                                 style={{ background: `linear-gradient(135deg, ${roleColor}22, ${roleColor}11)`, border: `1px solid ${roleColor}33`, boxShadow: `0 0 20px ${roleColor}15` }}>
                                {user?.avatarUrl ? (
                                    <img src={normalizeUrl(user.avatarUrl)} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <User size={18} style={{ color: roleColor }} />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[14px] font-semibold text-text-primary truncate leading-tight">
                                    {user?.firstName || 'User'} {user?.lastName || ''}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: roleColor }} />
                                    <span className="text-[11px] font-medium" style={{ color: roleColor }}>{ROLE_LABELS[role]}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Divider ── */}
                <div className="mx-4 mb-2" style={{ borderTop: '1px solid rgba(148,163,184,0.06)' }} />

                {/* ── Navigation ── */}
                <nav className="flex-1 overflow-y-auto px-3 pb-2 space-y-0.5 scrollbar-hide">
                    {!collapsed && (
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted px-3 pt-2 pb-2">เมนูหลัก</p>
                    )}
                    {sidebarItems.map((item, i) => renderNavItem(item, i))}
                </nav>

                {/* ── Bottom Actions ── */}
                <div className="p-3 space-y-1" style={{ borderTop: '1px solid rgba(148,163,184,0.06)' }}>
                    <button
                        onClick={() => setIsChangePasswordOpen(true)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-text-muted hover:text-text-secondary transition-all duration-200 text-[13px] ${collapsed ? 'justify-center' : ''}`}
                    >
                        <Lock size={15} />
                        {!collapsed && <span>เปลี่ยนรหัสผ่าน</span>}
                    </button>
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-text-muted hover:text-text-secondary transition-all duration-200 text-[13px] ${collapsed ? 'justify-center' : ''}`}
                    >
                        <ChevronLeft size={15} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
                        {!collapsed && <span>ย่อเมนู</span>}
                    </button>
                </div>
            </aside>

            {/* ═══ Main Content Area ═══ */}
            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'lg:ml-[76px]' : 'lg:ml-[272px]'}`}>

                {/* ── Topbar ── */}
                <header className="h-[64px] sticky top-0 z-40 flex items-center justify-between px-5 lg:px-7 shrink-0 glass-dark"
                        style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                    {/* Left */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                            className="lg:hidden p-2 -ml-1 text-text-secondary hover:text-text-primary rounded-xl transition-colors"
                            onClick={() => setMobileOpen(true)}
                            aria-label="เปิดเมนู"
                        >
                            <Menu size={20} />
                        </button>

                        {pageTitle && (
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-[16px] font-bold text-text-primary tracking-tight truncate">{pageTitle}</h1>
                                    {pageSubtitle && (
                                        <>
                                            <span className="text-text-muted text-[12px] hidden sm:inline">·</span>
                                            <p className="text-[12px] text-text-muted truncate hidden sm:block">{pageSubtitle}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-2 shrink-0">
                        {headerActions}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-text-muted hover:text-danger transition-all duration-200"
                            style={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.06)' }}
                        >
                            <LogOut size={14} />
                            <span className="hidden sm:inline">ออกจากระบบ</span>
                        </button>
                    </div>
                </header>

                <ChangePasswordModal
                    isOpen={isChangePasswordOpen}
                    onClose={() => setIsChangePasswordOpen(false)}
                />

                {/* ── Page Content ── */}
                <main className="flex-1 p-5 lg:p-7 overflow-x-hidden">
                    <div className="absolute inset-0 gradient-mesh pointer-events-none" style={{ position: 'fixed', zIndex: 0 }} />
                    {pageTitle && (
                        <div className="sm:hidden mb-5 relative z-10">
                            <h1 className="text-lg font-bold text-text-primary tracking-tight">{pageTitle}</h1>
                            {pageSubtitle && <p className="text-[13px] text-text-secondary mt-0.5">{pageSubtitle}</p>}
                        </div>
                    )}
                    <div className="max-w-7xl mx-auto animate-fade-in relative z-10">
                        {children}
                    </div>
                </main>
            </div>

            {/* ═══ Mobile Sidebar ═══ */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <div className="absolute inset-y-0 left-0 w-[300px] flex flex-col animate-slide-in"
                         style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.99) 0%, rgba(11,17,32,0.99) 100%)', borderRight: '1px solid rgba(59,130,246,0.08)' }}>

                        {/* Mobile Header */}
                        <div className="flex items-center justify-between px-5 py-4 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
                                     style={{ background: `linear-gradient(135deg, ${roleColor}22, ${roleColor}11)`, border: `1px solid ${roleColor}33` }}>
                                    {user?.avatarUrl ? (
                                        <img src={normalizeUrl(user.avatarUrl)} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <User size={16} style={{ color: roleColor }} />
                                    )}
                                </div>
                                <div>
                                    <p className="text-[14px] font-semibold text-text-primary leading-tight">{user?.firstName || 'User'} {user?.lastName || ''}</p>
                                    <p className="text-[11px] font-medium" style={{ color: roleColor }}>{ROLE_LABELS[role]}</p>
                                </div>
                            </div>
                            <button onClick={() => setMobileOpen(false)} className="p-2 text-text-muted hover:text-text-secondary rounded-lg transition-colors" aria-label="ปิดเมนู">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mx-4 mb-2" style={{ borderTop: '1px solid rgba(148,163,184,0.06)' }} />

                        {/* Mobile Nav */}
                        <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted px-3 pt-1 pb-2">เมนูหลัก</p>
                            {sidebarItems.map((item, i) => renderNavItem(item, i, true))}
                        </nav>

                        {/* Mobile Bottom */}
                        <div className="p-4 space-y-1" style={{ borderTop: '1px solid rgba(148,163,184,0.06)' }}>
                            <button
                                onClick={() => { setMobileOpen(false); setIsChangePasswordOpen(true); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors"
                            >
                                <Lock size={15} />
                                เปลี่ยนรหัสผ่าน
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-danger hover:bg-danger-light transition-colors"
                            >
                                <LogOut size={15} />
                                ออกจากระบบ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
