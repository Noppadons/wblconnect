"use client";

import React, { useState, useEffect } from 'react';
import {
    Menu,
    X,
    LogOut,
    User,
    ChevronLeft,
    GraduationCap,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import type { SidebarItem } from '@/lib/sidebar';

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

export default function AppShell({ children, role, user, sidebarItems, pageTitle, pageSubtitle, headerActions }: AppShellProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const [ready, setReady] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.replace('/login');
        } else {
            setReady(true);
        }
    }, [router]);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie.split(";").forEach((c) => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        router.replace('/login');
    };

    if (!ready) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const sidebarWidth = collapsed ? 'w-[72px]' : 'w-60';

    return (
        <div className="min-h-screen flex bg-background">
            {/* ─── Desktop Sidebar ─── */}
            <aside className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-50 bg-white border-r border-border transition-all duration-200 ${sidebarWidth}`}>
                {/* Logo */}
                <div className={`h-16 flex items-center border-b border-border-light shrink-0 ${collapsed ? 'justify-center px-2' : 'px-5'}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
                            <GraduationCap size={20} />
                        </div>
                        {!collapsed && (
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-text-primary truncate leading-tight">WBL Connect</p>
                                <p className="text-[11px] text-text-muted truncate leading-tight">{ROLE_LABELS[role]}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5 scrollbar-hide">
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
                        return (
                            <a
                                key={item.href}
                                href={item.href}
                                title={collapsed ? item.label : undefined}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                                    isActive
                                        ? 'bg-primary-light text-primary font-semibold'
                                        : 'text-text-secondary hover:bg-slate-50 hover:text-text-primary'
                                } ${collapsed ? 'justify-center' : ''}`}
                            >
                                <item.icon size={20} strokeWidth={isActive ? 2.2 : 1.8} className="shrink-0" />
                                {!collapsed && <span className="truncate">{item.label}</span>}
                            </a>
                        );
                    })}
                </nav>

                {/* Collapse Toggle */}
                <div className="p-2.5 border-t border-border-light">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-muted hover:bg-slate-50 hover:text-text-secondary transition-colors text-[13px] ${collapsed ? 'justify-center' : ''}`}
                    >
                        <ChevronLeft size={18} className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
                        {!collapsed && <span>ย่อเมนู</span>}
                    </button>
                </div>
            </aside>

            {/* ─── Main Area ─── */}
            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-60'}`}>
                {/* Topbar */}
                <header className="h-16 bg-white border-b border-border sticky top-0 z-40 flex items-center justify-between px-4 lg:px-6 shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            className="lg:hidden p-2 -ml-1 text-text-secondary hover:bg-slate-50 rounded-lg transition-colors"
                            onClick={() => setMobileOpen(true)}
                        >
                            <Menu size={22} />
                        </button>

                        {pageTitle && (
                            <div className="hidden sm:block">
                                <h1 className="text-lg font-bold text-text-primary leading-tight">{pageTitle}</h1>
                                {pageSubtitle && <p className="text-xs text-text-muted leading-tight">{pageSubtitle}</p>}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {headerActions}

                        <div className="h-8 w-px bg-border mx-1 hidden sm:block" />

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-text-primary leading-tight">{user?.firstName || 'User'} {user?.lastName || ''}</p>
                                <p className="text-[11px] text-text-muted leading-tight">{ROLE_LABELS[role]}</p>
                            </div>
                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-border">
                                {user?.avatarUrl ? (
                                    <img
                                        src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${user.avatarUrl}`}
                                        className="w-full h-full object-cover"
                                        alt=""
                                    />
                                ) : (
                                    <User size={18} className="text-text-muted" />
                                )}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-text-muted hover:text-danger hover:bg-danger-light rounded-lg transition-colors"
                                title="ออกจากระบบ"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
                    {pageTitle && (
                        <div className="sm:hidden mb-4">
                            <h1 className="text-xl font-bold text-text-primary">{pageTitle}</h1>
                            {pageSubtitle && <p className="text-sm text-text-muted">{pageSubtitle}</p>}
                        </div>
                    )}
                    <div className="max-w-7xl mx-auto animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>

            {/* ─── Mobile Sidebar ─── */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
                    <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-modal flex flex-col animate-slide-in">
                        <div className="h-16 flex items-center justify-between px-5 border-b border-border-light shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
                                    <GraduationCap size={18} />
                                </div>
                                <span className="font-bold text-text-primary">WBL Connect</span>
                            </div>
                            <button onClick={() => setMobileOpen(false)} className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                                <X size={20} className="text-text-secondary" />
                            </button>
                        </div>
                        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
                            {sidebarItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <a
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                                            isActive
                                                ? 'bg-primary-light text-primary font-semibold'
                                                : 'text-text-secondary hover:bg-slate-50 hover:text-text-primary'
                                        }`}
                                    >
                                        <item.icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                                        {item.label}
                                    </a>
                                );
                            })}
                        </nav>
                        <div className="p-3 border-t border-border-light">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-danger hover:bg-danger-light transition-colors"
                            >
                                <LogOut size={18} />
                                ออกจากระบบ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
