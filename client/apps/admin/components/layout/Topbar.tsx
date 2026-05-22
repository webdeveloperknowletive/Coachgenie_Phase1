"use client";

import { useRouter } from "next/navigation";
import { Bell, Search, Sun, Moon, LogOut, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth.store";
import { api } from "@/lib/api";

interface TopbarProps {
  sidebarCollapsed: boolean;
}

export function Topbar({ sidebarCollapsed: _ }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  // ✅ FULL PRODUCTION LOGOUT
  async function handleLogout() {
    const { refreshToken, clear } = useAuthStore.getState();

    try {
      if (refreshToken) {
        await api.post("/auth/logout", {
          refresh_token: refreshToken,
        });
      }
    } catch (err) {
      console.error("Logout API failed:", err);
    }

    // Clear local auth state
    clear();

    // Remove cookie
    document.cookie = "cg_access_token=; path=/; max-age=0";

    // Redirect
    router.push("/login");
  }

  return (
    <div className="flex w-full items-center gap-3">
      {/* 🔍 Search */}
      <div className="flex flex-1 items-center gap-2 rounded-lg border bg-background px-3 py-2 max-w-sm">
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <input
          placeholder="Search students, sessions…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground min-w-0"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        {/* 🏷 Tenant */}
        <span className="hidden sm:inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          demo
        </span>

        {/* 🌙 Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {/* 🔔 Notifications */}
        <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
        </button>

        {/* 👤 Avatar Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
          >
            RV
          </button>

          {menuOpen && (
            <>
              {/* Overlay */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />

              {/* Dropdown */}
              <div className="absolute right-0 top-10 z-20 w-48 rounded-xl border bg-popover shadow-lg overflow-hidden">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium">Rahul Verma</p>
                  <p className="text-xs text-muted-foreground">
                    admin@demo.com
                  </p>
                </div>

                <button className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors">
                  <User className="h-3.5 w-3.5" /> Profile
                </button>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}