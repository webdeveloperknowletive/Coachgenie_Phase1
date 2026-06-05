// import type { UserRole } from "../stores/auth.store";

// export const ROLE_ROUTES: Record<UserRole, string> = {
//   SUPER_ADMIN: "/admin",
//   ADMIN:       "/admin",
//   COACH:       "/admin",
//   PARENT:      "/parent",
//   STUDENT:     "/student",
// };

// export const PERMISSIONS = {
//   MANAGE_TENANTS:  ["SUPER_ADMIN"] as UserRole[],
//   MANAGE_STUDENTS: ["SUPER_ADMIN","ADMIN","COACH"] as UserRole[],
//   VIEW_BILLING:    ["SUPER_ADMIN","ADMIN","PARENT"] as UserRole[],
//   VIEW_PROGRESS:   ["SUPER_ADMIN","ADMIN","COACH","PARENT","STUDENT"] as UserRole[],
//   MANAGE_SESSIONS: ["SUPER_ADMIN","ADMIN","COACH"] as UserRole[],
//   VIEW_AI:         ["SUPER_ADMIN","ADMIN","COACH","STUDENT"] as UserRole[],
// } as const;

// export const NAV_ITEMS = {
//   admin: [
//     { label: "Dashboard",  href: "/admin",            icon: "LayoutDashboard" },
//     { label: "Students",   href: "/admin/students",   icon: "Users" },
//     { label: "Sessions",   href: "/admin/sessions",   icon: "CalendarDays" },
//     { label: "Attendance", href: "/admin/attendance", icon: "CheckSquare" },
//     { label: "Billing",    href: "/admin/billing",    icon: "CreditCard" },
//     { label: "Settings",   href: "/admin/settings",   icon: "Settings" },
//   ],
//   parent: [
//     { label: "Dashboard",  href: "/parent",               icon: "LayoutDashboard" },
//     { label: "My Child",   href: "/parent/child",         icon: "User" },
//     { label: "Attendance", href: "/parent/attendance",    icon: "CheckSquare" },
//     { label: "Progress",   href: "/parent/progress",      icon: "TrendingUp" },
//     { label: "Billing",    href: "/parent/billing",       icon: "CreditCard" },
//   ],
//   student: [
//     { label: "Dashboard",  href: "/student",             icon: "LayoutDashboard" },
//     { label: "Sessions",   href: "/student/sessions",    icon: "CalendarDays" },
//     { label: "Progress",   href: "/student/progress",    icon: "TrendingUp" },
//     { label: "AI Tutor",   href: "/student/ai-tutor",   icon: "Bot" },
//   ],
// } as const;


import type { UserRole } from "../stores/auth.store";

export const ROLE_ROUTES: Record<UserRole, string> = {
  owner:     "/dashboard",
  counselor: "/dashboard",
  tutor:     "/dashboard",
  parent:    "/parent",
  student:   "/student",
};

export const PERMISSIONS = {
  MANAGE_STUDENTS: ["owner", "counselor"] as UserRole[],
  VIEW_BILLING:    ["owner", "counselor"] as UserRole[],
  MANAGE_SESSIONS: ["owner", "tutor"]     as UserRole[],
  MANAGE_LEADS:    ["owner", "counselor"] as UserRole[],
  VIEW_REPORTS:    ["owner", "tutor", "counselor"] as UserRole[],
} as const;