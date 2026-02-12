import {
    LayoutDashboard,
    Users,
    Briefcase,
    School,
    BookOpen,
    Calendar,
    Megaphone,
    Settings,
    ClipboardCheck,
    GraduationCap,
    UserCircle,
    BarChart3,
    FileText,
    type LucideIcon,
    Smile,
    FileBarChart,
} from 'lucide-react';

export interface SidebarItem {
    label: string;
    href: string;
    icon: LucideIcon;
}

export const ADMIN_SIDEBAR: SidebarItem[] = [
    { label: 'ภาพรวม', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'นักเรียน', href: '/admin/students', icon: Users },
    { label: 'บุคลากร', href: '/admin/teachers', icon: Briefcase },
    { label: 'ห้องเรียน', href: '/admin/classrooms', icon: School },
    { label: 'รายวิชา', href: '/admin/academic/subjects', icon: BookOpen },
    { label: 'ตารางสอน', href: '/admin/academic/schedules', icon: Calendar },
    { label: 'สรุปผลภาคเรียน', href: '/admin/reports/semester-summary', icon: FileBarChart },
    { label: 'ข่าวสาร', href: '/admin/communication', icon: Megaphone },
    { label: 'ตั้งค่า', href: '/admin/settings', icon: Settings },
];

export const TEACHER_SIDEBAR: SidebarItem[] = [
    { label: 'ภาพรวม', href: '/teacher/dashboard', icon: LayoutDashboard },
    { label: 'ตารางสอน', href: '/teacher/schedule', icon: Calendar },
    { label: 'เช็คชื่อ', href: '/teacher/attendance', icon: ClipboardCheck },
    { label: 'คะแนน/เกรด', href: '/teacher/grading', icon: BarChart3 },
    { label: 'นักเรียน', href: '/teacher/students', icon: Users },
    { label: 'พฤติกรรม', href: '/teacher/behavior', icon: Smile },
];

export const STUDENT_SIDEBAR: SidebarItem[] = [
    { label: 'โปรไฟล์', href: '/student/profile', icon: UserCircle },
    { label: 'ตารางเรียน', href: '/student/schedule', icon: Calendar },
    { label: 'ผลการเรียน', href: '/student/grades', icon: BarChart3 },
    { label: 'งานที่ได้รับ', href: '/student/assignments', icon: FileText },
];
