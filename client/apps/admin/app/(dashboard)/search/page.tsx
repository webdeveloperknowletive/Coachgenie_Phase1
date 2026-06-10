"use client";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, User, Users, GraduationCap, BookOpen, Receipt, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Suspense } from "react";
const API = "/api/proxy";

function authHeaders(): HeadersInit {
  return { "Content-Type": "application/json" };
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface SearchResult {
  id:       string;
  type:     "lead" | "student" | "admission" | "batch" | "fee";
  title:    string;
  subtitle: string;
  link:     string;
  badge?:   string;
}

const TYPE_CONFIG = {
  lead:      { label: "Lead",      icon: User,           color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-200"  },
  student:   { label: "Student",   icon: GraduationCap,  color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200"    },
  admission: { label: "Admission", icon: Users,          color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  batch:     { label: "Batch",     icon: BookOpen,       color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200"   },
  fee:       { label: "Invoice",   icon: Receipt,        color: "text-rose-600",    bg: "bg-rose-50",    border: "border-rose-200"    },
};

const ALL_TYPES = ["lead", "student", "admission", "batch", "fee"] as const;
type ResultType = typeof ALL_TYPES[number];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SearchPage() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const initialQuery  = searchParams.get("q") ?? "";

  const [query,    setQuery]    = useState(initialQuery);
  const [results,  setResults]  = useState<SearchResult[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);
  const [filter,   setFilter]   = useState<ResultType | "all">("all");

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);

    const q_lower = q.trim().toLowerCase();
    const collected: SearchResult[] = [];

    await Promise.allSettled([

      // ── Leads ──────────────────────────────────────────────────────────────
      fetch(`${API}/leads?search=${encodeURIComponent(q)}&limit=10`, { headers: authHeaders() })
        .then(r => r.json())
        .then(json => {
          const items = json.data?.items ?? json.data ?? [];
          items.forEach((l: any) => collected.push({
            id:       l.id,
            type:     "lead",
            title:    l.full_name ?? l.name ?? "—",
            subtitle: [l.phone, l.email, l.source].filter(Boolean).join(" · "),
            link:     `/leads/${l.id}`,
            badge:    l.status,
          }));
        }),

      // ── Students ───────────────────────────────────────────────────────────
      fetch(`${API}/students?search=${encodeURIComponent(q)}&limit=10`, { headers: authHeaders() })
        .then(r => r.json())
        .then(json => {
          const items = json.data?.items ?? json.data ?? [];
          items.forEach((s: any) => collected.push({
            id:       s.id,
            type:     "student",
            title: s.full_name ?? (`${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || "—"),
            subtitle: [s.enrollment_no, s.email, s.phone].filter(Boolean).join(" · "),
            link:     `/students/${s.id}`,
            badge:    s.enrollment_no,
          }));
        }),

      // ── Admissions ─────────────────────────────────────────────────────────
      fetch(`${API}/admissions?limit=50`, { headers: authHeaders() })
        .then(r => r.json())
        .then(json => {
          const items = json.data ?? [];
          items
            .filter((a: any) => {
              const name   = (a.student_name ?? a.studentName ?? "").toLowerCase();
              const admNo  = (a.admission_number ?? "").toLowerCase();
              return name.includes(q_lower) || admNo.includes(q_lower);
            })
            .slice(0, 10)
            .forEach((a: any) => collected.push({
              id:       a.id,
              type:     "admission",
              title:    a.student_name ?? a.studentName ?? "—",
              subtitle: [a.admission_number, a.status].filter(Boolean).join(" · "),
              link:     `/admissions/${a.id}`,
              badge:    a.admission_number,
            }));
        }),

      // ── Batches ────────────────────────────────────────────────────────────
      fetch(`${API}/batches?limit=50`, { headers: authHeaders() })
        .then(r => r.json())
        .then(json => {
          const items = json.data ?? json ?? [];
          (Array.isArray(items) ? items : [])
            .filter((b: any) => (b.name ?? "").toLowerCase().includes(q_lower))
            .slice(0, 10)
            .forEach((b: any) => collected.push({
              id:       b.id,
              type:     "batch",
              title:    b.name ?? "—",
              subtitle: [b.subject, b.schedule, `${b.student_count ?? 0} students`].filter(Boolean).join(" · "),
              link:     `/batches/${b.id}`,
              badge:    b.subject,
            }));
        }),

      // ── Fees ───────────────────────────────────────────────────────────────
      fetch(`${API}/fees/invoices`, { headers: authHeaders() })
        .then(r => r.json())
        .then(json => {
          const items = json.data ?? [];
          items
            .filter((f: any) => {
              const name  = (f.student_name ?? "").toLowerCase();
              const invNo = (f.invoice_no ?? "").toLowerCase();
              return name.includes(q_lower) || invNo.includes(q_lower);
            })
            .slice(0, 10)
            .forEach((f: any) => collected.push({
              id:       f.id,
              type:     "fee",
              title:    f.invoice_no ?? "—",
              subtitle: [f.student_name, f.status, f.amount_due ? `₹${parseFloat(f.amount_due).toLocaleString("en-IN")}` : null].filter(Boolean).join(" · "),
              link:     `/fees/${f.id}`,
              badge:    f.status,
            }));
        }),
    ]);

    setResults(collected);
    setLoading(false);
  }, []);

  // Search on mount if query present
  useEffect(() => {
    if (initialQuery) search(initialQuery);
  }, [initialQuery, search]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      search(query);
    }
  }

  const filtered = filter === "all"
    ? results
    : results.filter(r => r.type === filter);

  const countByType = (type: ResultType) => results.filter(r => r.type === type).length;

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Search</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Search across leads, students, admissions, batches and invoices
        </p>
      </div>

      {/* Search input */}
      <div className="flex items-center gap-2 rounded-xl border bg-background px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-primary/30 transition-all">
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a name, phone, invoice number… and press Enter"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        {!loading && query && (
          <button
            onClick={() => { router.push(`/search?q=${encodeURIComponent(query)}`); search(query); }}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Search
          </button>
        )}
      </div>

      {/* Filter pills */}
      {searched && results.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
              filter === "all" ? "bg-foreground text-background" : "hover:bg-accent"
            )}
          >
            All ({results.length})
          </button>
          {ALL_TYPES.map(type => {
            const count = countByType(type);
            if (!count) return null;
            const cfg = TYPE_CONFIG[type];
            return (
              <button
                key={type}
                onClick={() => setFilter(filter === type ? "all" : type)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                  filter === type
                    ? `${cfg.color} ${cfg.bg} ${cfg.border}`
                    : "hover:bg-accent"
                )}
              >
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Results */}
      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!loading && searched && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
          <Search className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">No results found</p>
          <p className="text-xs text-muted-foreground">
            Try a different name, phone number, or invoice number
          </p>
        </div>
      )}

      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
          <Search className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">Start searching</p>
          <p className="text-xs text-muted-foreground">
            Enter a name, phone, email, or invoice number
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map(result => {
            const cfg  = TYPE_CONFIG[result.type];
            const Icon = cfg.icon;
            return (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => router.push(result.link)}
                className="flex w-full items-center gap-4 rounded-xl border bg-card p-4 text-left shadow-sm hover:shadow-md hover:border-primary/20 transition-all group"
              >
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", cfg.bg)}>
                  <Icon className={cn("h-5 w-5", cfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{result.title}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{result.subtitle}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {result.badge && (
                    <span className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                      cfg.color, cfg.bg, cfg.border
                    )}>
                      {result.badge}
                    </span>
                  )}
                  <span className={cn(
                    "text-xs font-medium rounded-full px-2 py-0.5 border",
                    cfg.color, cfg.bg, cfg.border
                  )}>
                    {cfg.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
