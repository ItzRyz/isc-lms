"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  FileQuestion,
  CalendarCheck,
  Award,
  Trophy,
  Calendar,
  MessageSquare,
  Users,
  Building2,
  GraduationCap,
  Settings,
  Brain,
  Medal,
  ScrollText,
  Wallet,
  Bell,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/learning", label: "Learning", icon: BookOpen },
  { href: "/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/quizzes", label: "Quizzes", icon: FileQuestion },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/grades", label: "Grades", icon: Award },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/ml", label: "ML Insights", icon: Brain },
  { href: "/achievements", label: "Achievements", icon: Medal },
  { href: "/certificates", label: "Certificates", icon: ScrollText },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/discussions", label: "Discussions", icon: MessageSquare },
  { href: "/messages", label: "Messages", icon: Mail },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/organization/members", label: "Organization", icon: Building2 },
  { href: "/mentor/students", label: "Mentor", icon: GraduationCap },
  { href: "/coordinator/division", label: "Coordinator", icon: Users },
  { href: "/admin/users", label: "Admin", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen } = useUIStore();

  if (!sidebarOpen) return null;

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card">
      <div className="p-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <GraduationCap className="h-6 w-6 text-primary" />
          ISC LMS
        </Link>
        <p className="text-xs text-muted-foreground mt-1">Study Club Platform</p>
      </div>
      <nav className="flex-1 overflow-auto p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t text-xs text-muted-foreground">
        <p>© 2026 Study Club</p>
        <p>Multi-role + Scoped RBAC</p>
      </div>
    </aside>
  );
}
