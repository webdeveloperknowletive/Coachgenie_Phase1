"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Menu, X, GraduationCap, LayoutDashboard, Users, CalendarDays, CheckSquare,
  CreditCard, Settings, UserPlus, FileCheck, BookOpen, ClipboardList,
  IndianRupee, Bell, Sparkles, ExternalLink, Brain,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore, type UserRole } from "@/lib/stores/auth.store";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Users, CalendarDays, CheckSquare,
  CreditCard, Settings, GraduationCap, Brain,
  UserPlus, FileCheck, BookOpen, ClipboardList, IndianRupee, Bell, Sparkles, ExternalLink,
};

const NAV_ITEMS = [
  { label: "Dashboard",       href: "/dashboard",                                 icon: "LayoutDashboard", external: false },
  { label: "Leads",           href: "/leads",                                     icon: "UserPlus",        external: false },
  { label: "Admissions",      href: "/admissions",                                icon: "FileCheck",       external: false },
  { label: "Students",        href: "/students",                                  icon: "Users",           external: false },
  { label: "Batches",         href: "/batches",                                   icon: "BookOpen",        external: false },
  { label: "Exams",           href: "/exams",                                     icon: "ClipboardList",   external: false },
  { label: "Sessions",        href: "/sessions",                                  icon: "CalendarDays",    external: false },
  { label: "Attendance",      href: "/attendance",                                icon: "CheckSquare",     external: false },
  { label: "Attendance Reports",href: "/attendance/reports", icon: "ClipboardList", external: false },
  { label: "Fees",            href: "/fees",                                      icon: "IndianRupee",     external: false },
  { label: "Growth Cards",    href: "/growth-cards",                              icon: "Sparkles",        external: false },
  { label: "Notifications",   href: "/notifications",                             icon: "Bell",            external: false },
  { label: "Billing",         href: "/settings/billing",                          icon: "CreditCard",      external: false },
  { label: "Settings",        href: "/settings",                                  icon: "Settings",        external: false },
  { label: "AI Analytics",    href: "/ai/analytics",                              icon: "Brain",           external: false },
  { label: "Career Guidance", href: "https://career-guidence-topaz.vercel.app/", icon: "GraduationCap",  external: true  },
];

const MODULE_ROLES: Record<string, UserRole[]> = {
  "/dashboard":        ["owner", "counselor", "tutor"],
  "/leads":            ["owner", "counselor"],
  "/admissions":       ["owner", "counselor"],
  "/students":         ["owner", "counselor", "tutor"],
  "/batches":          ["owner", "counselor", "tutor"],
  "/exams":            ["owner", "tutor"],
  "/sessions":         ["owner", "tutor"],
  "/attendance":       ["owner", "tutor"],
  "/attendance/reports": ["owner", "tutor"],
  "/fees":             ["owner", "counselor"],
  "/growth-cards":     ["owner", "counselor", "tutor"],
  "/notifications":    ["owner", "counselor"],
  "/settings/billing": ["owner"],
  "/settings":         ["owner"],
  "/ai/analytics":     ["owner", "counselor", "tutor"],
};

function MobileSidebarDrawer({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const role = useAuthStore((state) => state.role) ?? "owner";

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.external || (MODULE_ROLES[item.href]?.includes(role) ?? true)
  );

  // Lock body scroll while the drawer is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] lg:hidden">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <nav
        className={cn(
          "absolute left-0 top-0 h-full w-72 max-w-[85vw]",
          "bg-card shadow-2xl flex flex-col",
          "overflow-hidden"
        )}
      >
        <div className="flex items-center justify-between border-b px-4 h-[3.75rem] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="font-bold tracking-tight text-sm truncate">CoachGenie</span>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 hover:bg-accent transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {visibleItems.map((item) => {
            const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;
            const active = !item.external && (pathname === item.href || pathname.startsWith(item.href + "/"));

            const commonClass = cn(
              "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            );

            if (item.external) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className={commonClass}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate flex items-center gap-1">
                    {item.label}
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </span>
                </a>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={commonClass}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Avoid SSR/hydration mismatch — portal target only exists client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && mounted &&
        createPortal(
          <MobileSidebarDrawer onClose={() => setOpen(false)} />,
          document.body
        )}
    </>
  );
}
