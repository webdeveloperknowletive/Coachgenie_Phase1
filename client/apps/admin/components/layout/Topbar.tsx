
"use client";

import { useRouter } from "next/navigation";
import { Bell, Search, Sun, Moon, LogOut, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

// "use client";

// import { useRouter } from "next/navigation";
// import { Bell, Search, LogOut, User, X } from "lucide-react";
// import { useState, useEffect, useCallback } from "react";
// import { cn } from "@/lib/utils";
// import { useAuthStore } from "@/lib/stores/auth.store";
// import { api } from "@/lib/api";

// const API = "/api/proxy";

// function authHeaders(): HeadersInit {
//   return { "Content-Type": "application/json" };
// }

// interface InboxNotification {
//   id:         string;
//   title:      string;
//   body?:      string | null;
//   icon?:      string | null;
//   link?:      string | null;
//   is_read:    boolean;
//   created_at: string | null;
// }

// interface TopbarProps {
//   sidebarCollapsed: boolean;
// }

// export function Topbar({ sidebarCollapsed: _ }: TopbarProps) {
//   const router = useRouter();

//   const [menuOpen,       setMenuOpen]       = useState(false);
//   const [notifOpen,      setNotifOpen]      = useState(false);
//   const [searchVal,      setSearchVal]      = useState("");
//   const [notifications,  setNotifications]  = useState<InboxNotification[]>([]);
//   const [notifLoading,   setNotifLoading]   = useState(false);

//   const user      = useAuthStore((s) => s.user);
//   const userName  = user?.name  ?? user?.email ?? "User";
//   const userEmail = user?.email ?? "";
//   const initials  = userName
//     .split(" ")
//     .map((w: string) => w[0])
//     .slice(0, 2)
//     .join("")
//     .toUpperCase() || "U";

//   const unreadCount = notifications.filter(n => !n.is_read).length;

//   // ── Fetch notifications ──────────────────────────────────────────────────
//   const fetchNotifications = useCallback(async () => {
//     setNotifLoading(true);
//     try {
//       const res = await fetch(`${API}/notifications/inbox`, { headers: authHeaders() });
//       if (!res.ok) return;
//       const json = await res.json();
//       setNotifications(json.data ?? []);
//     } catch {
//       // silent
//     } finally {
//       setNotifLoading(false);
//     }
//   }, []);

//   // Poll every 60 seconds + fetch on open
//   useEffect(() => {
//     fetchNotifications();
//     const interval = setInterval(fetchNotifications, 60_000);
//     return () => clearInterval(interval);
//   }, [fetchNotifications]);

//   // ── Mark one as read ─────────────────────────────────────────────────────
//   async function markRead(id: string) {
//     // Optimistic update
//     setNotifications(prev =>
//       prev.map(n => n.id === id ? { ...n, is_read: true } : n)
//     );
//     try {
//       await fetch(`${API}/notifications/inbox/${id}/read`, {
//         method:  "PATCH",
//         headers: authHeaders(),
//       });
//     } catch {
//       // revert on failure
//       setNotifications(prev =>
//         prev.map(n => n.id === id ? { ...n, is_read: false } : n)
//       );
//     }
//   }

//   // ── Mark all as read ─────────────────────────────────────────────────────
//   async function markAllRead() {
//     setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
//     try {
//       await fetch(`${API}/notifications/inbox/read-all`, {
//         method:  "POST",
//         headers: authHeaders(),
//       });
//     } catch {
//       fetchNotifications(); // revert by re-fetching
//     }
//   }

//   // ── Logout ───────────────────────────────────────────────────────────────
//   async function handleLogout() {
//     const { refreshToken, clear } = useAuthStore.getState();
//     try {
//       if (refreshToken) {
//         await api.post("/auth/logout", { refresh_token: refreshToken });
//       }
//     } catch (err) {
//       console.error("Logout API failed:", err);
//     }
//     clear();
//     document.cookie = "cg_access_token=; path=/; max-age=0";
//     router.push("/login");
//   }

//   // ── Search ───────────────────────────────────────────────────────────────
//   function handleSearch(e: React.KeyboardEvent<HTMLInputElement>) {
//     if (e.key === "Enter" && searchVal.trim()) {
//       router.push(`/search?q=${encodeURIComponent(searchVal.trim())}`);
//       setSearchVal("");
//     }
//   }

//   // ── Time formatter ───────────────────────────────────────────────────────
//   function timeAgo(dateStr: string | null): string {
//     if (!dateStr) return "";
//     const diff = Date.now() - new Date(dateStr).getTime();
//     const mins  = Math.floor(diff / 60_000);
//     const hours = Math.floor(diff / 3_600_000);
//     const days  = Math.floor(diff / 86_400_000);
//     if (mins  < 1)  return "just now";
//     if (mins  < 60) return `${mins}m ago`;
//     if (hours < 24) return `${hours}h ago`;
//     return `${days}d ago`;
//   }

//   return (
//     <div className="flex w-full items-center gap-3">

//       {/* Search */}
//       <div className="flex flex-1 items-center gap-2 rounded-lg border bg-background px-3 py-2 max-w-sm focus-within:ring-2 focus-within:ring-primary/30 transition-all">
//         <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
//         <input
//           value={searchVal}
//           onChange={e => setSearchVal(e.target.value)}
//           onKeyDown={handleSearch}
//           placeholder="Search students, sessions…"
//           className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground min-w-0"
//         />
//         {searchVal && (
//           <button onClick={() => setSearchVal("")} className="text-muted-foreground hover:text-foreground">
//             <X className="h-3 w-3" />
//           </button>
//         )}
//       </div>

//       <div className="ml-auto flex items-center gap-1">

//         {/* Notifications */}
//         <div className="relative">
//           <button
//             onClick={() => { setNotifOpen(v => !v); setMenuOpen(false); }}
//             className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
//           >
//             <Bell className="h-4 w-4" />
//             {unreadCount > 0 && (
//               <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
//                 {unreadCount > 9 ? "9+" : unreadCount}
//               </span>
//             )}
//           </button>

//           {notifOpen && (
//             <>
//               <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
//               <div
//                 className="absolute right-0 top-10 z-40 w-80 rounded-xl border border-border shadow-xl overflow-hidden"
//                 style={{ backgroundColor: "hsl(var(--background))" }}
//                 onClick={e => e.stopPropagation()}
//               >
//                 {/* Header */}
//                 <div
//                   className="flex items-center justify-between px-4 py-3 border-b border-border"
//                   style={{ backgroundColor: "hsl(var(--background))" }}
//                 >
//                   <p className="text-sm font-semibold">Notifications</p>
//                   {unreadCount > 0 && (
//                     <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
//                   )}
//                 </div>

//                 {/* List */}
//                 <div
//                   className="divide-y divide-border max-h-80 overflow-y-auto"
//                   style={{ backgroundColor: "hsl(var(--background))" }}
//                 >
//                   {notifLoading ? (
//                     <div className="space-y-2 p-4">
//                       {[...Array(3)].map((_, i) => (
//                         <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
//                       ))}
//                     </div>
//                   ) : notifications.length === 0 ? (
//                     <p className="px-4 py-8 text-sm text-center text-muted-foreground">
//                       No notifications yet
//                     </p>
//                   ) : notifications.map(n => (
//                     <button
//                       key={n.id}
//                       onClick={() => {
//                         markRead(n.id);
//                         if (n.link) { setNotifOpen(false); router.push(n.link); }
//                       }}
//                       className={cn(
//                         "flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-accent",
//                         !n.is_read && "bg-primary/5"
//                       )}
//                     >
//                       <span className={cn(
//                         "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
//                         !n.is_read ? "bg-primary" : "bg-transparent"
//                       )} />
//                       <div className="flex-1 min-w-0">
//                         <p className={cn("truncate", !n.is_read && "font-medium")}>{n.title}</p>
//                         {n.body && (
//                           <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
//                         )}
//                         <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
//                       </div>
//                     </button>
//                   ))}
//                 </div>

//                 {/* Footer */}
//                 {unreadCount > 0 && (
//                   <div
//                     className="border-t border-border px-4 py-2"
//                     style={{ backgroundColor: "hsl(var(--background))" }}
//                   >
//                     <button
//                       onClick={markAllRead}
//                       className="w-full text-xs text-primary hover:underline text-center py-1"
//                     >
//                       Mark all as read
//                     </button>
//                   </div>
//                 )}
//               </div>
//             </>
//           )}
//         </div>

//         {/* Avatar Menu */}
//         <div className="relative">
//           <button
//             onClick={() => { setMenuOpen(v => !v); setNotifOpen(false); }}
//             className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
//             title={userName}
//           >
//             {initials}
//           </button>

//           {menuOpen && (
//             <>
//               <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
//               <div
//                 className="absolute right-0 top-10 z-40 w-48 rounded-xl border border-border shadow-xl overflow-hidden"
//                 style={{ backgroundColor: "hsl(var(--background))" }}
//                 onClick={e => e.stopPropagation()}
//               >
//                 <div className="px-3 py-2 border-b border-border">
//                   <p className="text-sm font-medium truncate">{userName}</p>
//                   <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
//                 </div>
//                 <button
//                   onClick={() => { setMenuOpen(false); router.push("/profile"); }}
//                   className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
//                 >
//                   <User className="h-3.5 w-3.5" /> Profile
//                 </button>
//                 <button
//                   onClick={handleLogout}
//                   className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
//                 >
//                   <LogOut className="h-3.5 w-3.5" /> Sign out
//                 </button>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import { useRouter } from "next/navigation";
import { Bell, Search, LogOut, User, X, Users, GraduationCap, BookOpen, Receipt, ArrowRight, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth.store";
import { api } from "@/lib/api";



const API = "/api/proxy";

function authHeaders(): HeadersInit {
  return { "Content-Type": "application/json" };
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface InboxNotification {
  id:         string;
  title:      string;
  body?:      string | null;
  icon?:      string | null;
  link?:      string | null;
  is_read:    boolean;
  created_at: string | null;
}

interface SearchResult {
  id:       string;
  type:     "lead" | "student" | "admission" | "batch" | "fee";
  title:    string;
  subtitle: string;
  link:     string;
  badge?:   string;
}

const TYPE_CONFIG = {
  lead:      { label: "Lead",      icon: User,          color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-200"  },
  student:   { label: "Student",   icon: GraduationCap, color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200"    },
  admission: { label: "Admission", icon: Users,         color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  batch:     { label: "Batch",     icon: BookOpen,      color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200"   },
  fee:       { label: "Invoice",   icon: Receipt,       color: "text-rose-600",    bg: "bg-rose-50",    border: "border-rose-200"    },
};


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

  const router = useRouter();

  const [menuOpen,      setMenuOpen]      = useState(false);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [searchVal,     setSearchVal]     = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [notifLoading,  setNotifLoading]  = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const user      = useAuthStore((s) => s.user);
  const userName  = user?.name  ?? user?.email ?? "User";
  const userEmail = user?.email ?? "";
  const initials  = userName
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // ── Fetch notifications ──────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await fetch(`${API}/notifications/inbox`, { headers: authHeaders() });
      if (!res.ok) return;
      const json = await res.json();
      setNotifications(json.data ?? []);
    } catch {
      // silent
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ── Mark one as read ─────────────────────────────────────────────────────
  async function markRead(id: string) {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    try {
      await fetch(`${API}/notifications/inbox/${id}/read`, {
        method:  "PATCH",
        headers: authHeaders(),
      });
    } catch {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: false } : n)
      );
    }
  }

  // ── Mark all as read ─────────────────────────────────────────────────────
  async function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      await fetch(`${API}/notifications/inbox/read-all`, {
        method:  "POST",
        headers: authHeaders(),
      });
    } catch {
      fetchNotifications();
    }
  }

  // ── Logout ───────────────────────────────────────────────────────────────
  async function handleLogout() {
    const { refreshToken, clear } = useAuthStore.getState();
    try {
      if (refreshToken) {
        await api.post("/auth/logout", { refresh_token: refreshToken });

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

    clear();
    document.cookie = "cg_access_token=; path=/; max-age=0";
    router.push("/login");
  }

  // ── Search ───────────────────────────────────────────────────────────────
  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    setSearchLoading(true);
    setSearchOpen(true);
    const q_lower = q.trim().toLowerCase();
    const collected: SearchResult[] = [];

    await Promise.allSettled([
      fetch(`${API}/leads?search=${encodeURIComponent(q)}&limit=5`, { headers: authHeaders() })
        .then(r => r.json())
        .then(json => {
          (json.data?.items ?? json.data ?? []).forEach((l: any) => collected.push({
            id:       l.id,
            type:     "lead",
            title:    l.full_name ?? l.name ?? "—",
            subtitle: [l.phone, l.email].filter(Boolean).join(" · "),
            link:     `/leads/${l.id}`,
            badge:    l.status,
          }));
        }),

      fetch(`${API}/students?search=${encodeURIComponent(q)}&limit=5`, { headers: authHeaders() })
        .then(r => r.json())
        .then(json => {
          (json.data?.items ?? json.data ?? []).forEach((s: any) => collected.push({
            id:       s.id,
            type:     "student",
            title:    s.full_name ?? (`${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || "—"),
            subtitle: [s.enrollment_no, s.phone].filter(Boolean).join(" · "),
            link:     `/students/${s.id}`,
            badge:    s.enrollment_no,
          }));
        }),

      fetch(`${API}/admissions?limit=30`, { headers: authHeaders() })
        .then(r => r.json())
        .then(json => {
          (json.data ?? [])
            .filter((a: any) =>
              (a.student_name ?? "").toLowerCase().includes(q_lower) ||
              (a.admission_number ?? "").toLowerCase().includes(q_lower)
            )
            .slice(0, 5)
            .forEach((a: any) => collected.push({
              id:       a.id,
              type:     "admission",
              title:    a.student_name ?? "—",
              subtitle: [a.admission_number, a.status].filter(Boolean).join(" · "),
              link:     `/admissions/${a.id}`,
              badge:    a.admission_number,
            }));
        }),

      fetch(`${API}/batches?limit=30`, { headers: authHeaders() })
        .then(r => r.json())
        .then(json => {
          const items = Array.isArray(json.data ?? json) ? (json.data ?? json) : [];
          items
            .filter((b: any) => (b.name ?? "").toLowerCase().includes(q_lower))
            .slice(0, 5)
            .forEach((b: any) => collected.push({
              id:       b.id,
              type:     "batch",
              title:    b.name ?? "—",
              subtitle: [b.subject, `${b.student_count ?? 0} students`].filter(Boolean).join(" · "),
              link:     `/batches/${b.id}`,
              badge:    b.subject,
            }));
        }),
    ]);

    setSearchResults(collected);
    setSearchLoading(false);
  }, []);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearchVal(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 350);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && searchVal.trim()) {
      setSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchVal.trim())}`);
    }
    if (e.key === "Escape") {
      setSearchOpen(false);
    }
  }

  function handleResultClick(link: string) {
    setSearchOpen(false);
    setSearchVal("");
    setSearchResults([]);
    router.push(link);
  }

  function clearSearch() {
    setSearchVal("");
    setSearchResults([]);
    setSearchOpen(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }

  // ── Time formatter ───────────────────────────────────────────────────────
  function timeAgo(dateStr: string | null): string {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days  = Math.floor(diff / 86_400_000);
    if (mins  < 1)  return "just now";
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  return (
    <div className="flex w-full items-center gap-3">

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-primary/30 transition-all">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            value={searchVal}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => { if (searchResults.length > 0) setSearchOpen(true); }}
            placeholder="Search students, sessions…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground min-w-0"
          />
          {searchLoading && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
          )}
          {!searchLoading && searchVal && (
            <button onClick={clearSearch} className="text-muted-foreground hover:text-foreground shrink-0">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {searchOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setSearchOpen(false)} />
            <div
              className="absolute left-0 top-11 z-40 w-full min-w-[380px] rounded-xl border border-border shadow-xl overflow-hidden"
              style={{ backgroundColor: "hsl(var(--background))" }}
            >
              {searchLoading ? (
                <div className="space-y-2 p-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : searchResults.length === 0 ? (
                <p className="px-4 py-6 text-sm text-center text-muted-foreground">
                  No results for "{searchVal}"
                </p>
              ) : (
                <div className="max-h-80 overflow-y-auto divide-y divide-border">
                  {searchResults.map(result => {
                    const cfg  = TYPE_CONFIG[result.type];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result.link)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors group"
                      >
                        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", cfg.bg)}>
                          <Icon className={cn("h-4 w-4", cfg.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{result.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                        </div>
                        <span className={cn(
                          "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          cfg.color, cfg.bg, cfg.border
                        )}>
                          {cfg.label}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                      </button>
                    );
                  })}

                  {/* View all */}
                  <button
                    onClick={() => {
                      setSearchOpen(false);
                      router.push(`/search?q=${encodeURIComponent(searchVal)}`);
                    }}
                    className="flex w-full items-center justify-center gap-1.5 px-3 py-2.5 text-xs text-primary hover:bg-accent transition-colors font-medium"
                  >
                    View all results for "{searchVal}"
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1">

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(v => !v); setMenuOpen(false); }}
            className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
              <div
                className="absolute right-0 top-10 z-40 w-80 rounded-xl border border-border shadow-xl overflow-hidden"
                style={{ backgroundColor: "hsl(var(--background))" }}
                onClick={e => e.stopPropagation()}
              >
                <div
                  className="flex items-center justify-between px-4 py-3 border-b border-border"
                  style={{ backgroundColor: "hsl(var(--background))" }}
                >
                  <p className="text-sm font-semibold">Notifications</p>
                  {unreadCount > 0 && (
                    <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
                  )}
                </div>

                <div
                  className="divide-y divide-border max-h-80 overflow-y-auto"
                  style={{ backgroundColor: "hsl(var(--background))" }}
                >
                  {notifLoading ? (
                    <div className="space-y-2 p-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
                      ))}
                    </div>
                  ) : notifications.length === 0 ? (
                    <p className="px-4 py-8 text-sm text-center text-muted-foreground">
                      No notifications yet
                    </p>
                  ) : notifications.map(n => (
                    <button
                      key={n.id}
                      onClick={() => {
                        markRead(n.id);
                        if (n.link) { setNotifOpen(false); router.push(n.link); }
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-accent",
                        !n.is_read && "bg-primary/5"
                      )}
                    >
                      <span className={cn(
                        "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
                        !n.is_read ? "bg-primary" : "bg-transparent"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("truncate", !n.is_read && "font-medium")}>{n.title}</p>
                        {n.body && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {unreadCount > 0 && (
                  <div
                    className="border-t border-border px-4 py-2"
                    style={{ backgroundColor: "hsl(var(--background))" }}
                  >
                    <button
                      onClick={markAllRead}
                      className="w-full text-xs text-primary hover:underline text-center py-1"
                    >
                      Mark all as read
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Avatar Menu */}
        <div className="relative">
          <button
            onClick={() => { setMenuOpen(v => !v); setNotifOpen(false); }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
            title={userName}
          >
            {initials}

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


              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div
                className="absolute right-0 top-10 z-40 w-48 rounded-xl border border-border shadow-xl overflow-hidden"
                style={{ backgroundColor: "hsl(var(--background))" }}
                onClick={e => e.stopPropagation()}
              >
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium truncate">{userName}</p>
                  <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); router.push("/profile"); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
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


