"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore, type UserRole } from "@/lib/stores/auth.store";

const MODULE_ROLES: Record<string, UserRole[]> = {
  "/dashboard": ["owner", "counselor", "tutor"],
  "/leads": ["owner", "counselor"],
  "/admissions": ["owner", "counselor"],
  "/students": ["owner", "counselor", "tutor"],
  "/batches": ["owner", "counselor", "tutor"],
  "/exams": ["owner", "tutor"],
  "/sessions": ["owner", "tutor"],
  "/attendance": ["owner", "tutor"],
  "/billing": ["owner"],
  "/settings": ["owner"],
  "/fees": ["owner", "counselor"],
  "/growth-cards": ["owner", "counselor", "tutor"],
  "/notifications": ["owner", "counselor"],
  "/ai": ["owner", "counselor", "tutor"],
};

function getAllowedRoles(pathname: string) {
  const match = Object.keys(MODULE_ROLES)
    .sort((a, b) => b.length - a.length)
    .find((path) => pathname === path || pathname.startsWith(`${path}/`));
  return match ? MODULE_ROLES[match] : ["owner"];
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { accessToken, role } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    const allowed = getAllowedRoles(pathname);
    if (accessToken && role && !allowed.includes(role)) {
      router.replace("/dashboard");
    }
  }, [accessToken, pathname, role, router]);

  const allowed = getAllowedRoles(pathname);
  if (!accessToken || !role || !allowed.includes(role)) {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
