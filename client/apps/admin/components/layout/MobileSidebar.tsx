"use client";
import { useState } from "react";
import { Menu, X, GraduationCap, LayoutDashboard, Users, CalendarDays, CheckSquare, CreditCard, Settings,UserPlus, FileCheck, BookOpen, ClipboardList,} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard",  href: "/dashboard",  Icon: LayoutDashboard },
  { label: "Leads",      href: "/leads",      Icon: UserPlus        },  // ← ADD
  { label: "Admissions", href: "/admissions", Icon: FileCheck       },
  { label: "Students",   href: "/students",   Icon: Users },
  { label: "Batches",    href: "/batches",    Icon: BookOpen},
  { label: "Exams",      href: "/exams",      Icon: ClipboardList},
  { label: "Sessions",   href: "/sessions",   Icon: CalendarDays },
  { label: "Attendance", href: "/attendance", Icon: CheckSquare },
  { label: "Billing",    href: "/billing",    Icon: CreditCard },
  { label: "Settings",   href: "/settings",   Icon: Settings },
];

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <nav className="absolute left-0 top-0 h-full w-72 bg-card shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b px-4 h-[3.75rem]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <span className="font-bold tracking-tight text-sm">CoachGenie</span>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
              {NAV.map(({ label, href, Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
