"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Users, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface Template {
  id:        string;
  name:      string;
  channel:   string;
  subject:   string | null;
  body:      string;
  variables: string[] | null;
}

type Role = "student" | "parent" | "tutor" | "admin";

interface Recipient {
  id:    string;
  name:  string;
  email: string;
  phone: string;
  role:  Role;
}

const ROLE_CONFIG: Record<Role, { label: string; color: string; bg: string }> = {
  student: { label: "Student", color: "#0C447C", bg: "#E6F1FB" },
  parent:  { label: "Parent",  color: "#085041", bg: "#E1F5EE" },
  tutor:   { label: "Tutor",   color: "#633806", bg: "#FAEEDA" },
  admin:   { label: "Admin",   color: "#791F1F", bg: "#FCEBEB" },
};

const inputCls =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function extractVars(body: string): string[] {
  const matches = body.match(/\{\{(\w+)\}\}/g) ?? [];
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, "")))];
}

function resolveBody(body: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (b, [k, v]) => b.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v || `{{${k}}}`),
    body
  );
}

export default function SendNotificationPage() {
  const router = useRouter();

  const [templates,   setTemplates]   = useState<Template[]>([]);
  const [recipients,  setRecipients]  = useState<Recipient[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [sending,     setSending]     = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedIds,      setSelectedIds]      = useState<Set<string>>(new Set());
  const [variables,        setVariables]        = useState<Record<string, string>>({});
  const [roleFilter,       setRoleFilter]       = useState<Role | "all">("all");
  const [search,           setSearch]           = useState("");
  const [result,           setResult]           = useState<{ sent: number; failed: number } | null>(null);

  useEffect(() => {
    async function load() {
            async function safeFetch(url: string): Promise<any[]> {
        try {
          const res = await api.get(url) as any;
          return res?.data?.items ?? res?.items ?? res?.data ?? (Array.isArray(res) ? res : []);
        } catch (err: any) {
          const status = err?.response?.status;
          if (status === 404 || status === 422 || status === 405) return [];
          if (status !== 401 && status !== 403) {
            console.warn(`[notifications] ${url} unavailable (${status ?? "network"})`);
          }
          return [];
        }
      }

      const toRecipient = (s: any, role: Role): Recipient => ({
        id:    String(s.id),
        name:  `${s.first_name ?? s.name ?? ""} ${s.last_name ?? ""}`.trim() || "Unknown",
        email: s.email ?? "",
        phone: s.phone ?? s.mobile ?? "",
        role,
      });

      try {
        const tRes = await api.get("/notifications/templates") as any;
setTemplates(tRes?.data ?? tRes?.items ?? (Array.isArray(tRes) ? tRes : []));
      } catch (err) {
        console.error("Failed to load templates:", err);
        toast.error("Failed to load templates");
      }

      const [rawStudents, rawParents, rawTutors, rawAdmins] = await Promise.all([
        safeFetch("/students/"),
        safeFetch("/parents/"),
        safeFetch("/tutors/"),
        safeFetch("/users/?role=admin").then(r =>
          r.length > 0 ? r : safeFetch("/admins/")
        ),
      ]);

      const all: Recipient[] = [
        ...rawStudents.map((s: any) => toRecipient(s, "student")),
        ...rawParents.map((s: any)  => toRecipient(s, "parent")),
        ...rawTutors.map((s: any)   => toRecipient(s, "tutor")),
        ...rawAdmins.map((s: any)   => toRecipient(s, "admin")),
      ];

      setRecipients(all);
      setLoading(false);
    }
    load();
  }, []);

  function handleTemplateSelect(id: string) {
    const t = templates.find(t => t.id === id) ?? null;
    setSelectedTemplate(t);
    const vars: Record<string, string> = {};
    extractVars(t?.body ?? "").forEach(v => { vars[v] = ""; });
    setVariables(vars);
    setResult(null);
  }

  function toggleRecipient(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  const visibleRecipients = recipients.filter(r => {
    const matchRole   = roleFilter === "all" || r.role === roleFilter;
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) ||
                        r.email.toLowerCase().includes(search.toLowerCase()) ||
                        r.phone.includes(search);
    return matchRole && matchSearch;
  });

  function selectVisible() {
    setSelectedIds(prev => {
      const next = new Set(prev);
      visibleRecipients.forEach(r => next.add(r.id));
      return next;
    });
  }

  function clearAll() { setSelectedIds(new Set()); }

  const roleCounts = (["student", "parent", "tutor", "admin"] as Role[]).reduce((acc, role) => {
    acc[role] = recipients.filter(r => r.role === role).length;
    return acc;
  }, {} as Record<Role, number>);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTemplate)      return toast.error("Select a template");
    if (selectedIds.size === 0) return toast.error("Select at least one recipient");

    setSending(true);
    try {
      const res = await api.post("/notifications/send", {
        template_id: selectedTemplate.id,
        recipients: Array.from(selectedIds).map(id => {
          const r = recipients.find(r => r.id === id)!;
          return { id: r.id, email: r.email, phone: r.phone };
        }),
        variables,
      }) as any;
      setResult({ sent: res.data.sent ?? 0, failed: res.data.failed ?? 0 });
      toast.success(`Sent to ${res.data.sent} recipients!`);
      setSelectedIds(new Set());
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Failed to send");
    } finally {
      setSending(false);
    }
  }

  if (loading) return (
    <div className="space-y-4 max-w-2xl">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
      ))}
    </div>
  );

  const templateVars = extractVars(selectedTemplate?.body ?? "");

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/notifications")}
          className="rounded-lg p-2 hover:bg-accent text-muted-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Send Notification</h1>
          <p className="text-sm text-muted-foreground">Choose a template and recipients</p>
        </div>
      </div>

      {result && (
        <div className="rounded-xl border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-700">
              {`Sent to ${result.sent} recipient${result.sent !== 1 ? "s" : ""}`}
              {result.failed > 0 && ` � ${result.failed} failed`}
            </p>
            <button onClick={() => router.push("/notifications")}
              className="text-xs text-emerald-600 hover:underline mt-0.5">
              View notification log ?
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSend} className="space-y-5">
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <p className="text-sm font-semibold">1. Select template</p>
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No templates yet.{" "}
              <button type="button" onClick={() => router.push("/notifications/templates")}
                className="text-primary hover:underline">Create one first ?</button>
            </p>
          ) : (
            <div className="space-y-2">
              {templates.map(t => (
                <button key={t.id} type="button" onClick={() => handleTemplateSelect(t.id)}
                  className={cn(
                    "w-full text-left rounded-lg border p-3 transition-colors",
                    selectedTemplate?.id === t.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  )}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{t.name}</p>
                    <span className="flex items-center gap-1 text-xs bg-muted rounded-full px-2 py-0.5 uppercase shrink-0">
                      {t.channel}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{t.body}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedTemplate && templateVars.length > 0 && (
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <p className="text-sm font-semibold">2. Fill variables</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {templateVars.map(v => (
                <div key={v} className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{`{{${v}}}`}</label>
                  <input value={variables[v] ?? ""}
                    onChange={e => setVariables(prev => ({ ...prev, [v]: e.target.value }))}
                    placeholder={`Enter ${v}`} className={inputCls} />
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-muted/50 border p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Preview</p>
              <p className="text-sm leading-relaxed">
                {resolveBody(selectedTemplate.body, variables)}
              </p>
            </div>
          </div>
        )}

        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {selectedTemplate && templateVars.length > 0 ? "3." : "2."} Select recipients
              {selectedIds.size > 0 && (
                <span className="rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5 font-semibold ml-1">
                  {selectedIds.size} selected
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={selectVisible}
                className="text-xs text-primary hover:underline">Select visible</button>
              <button type="button" onClick={clearAll}
                className="text-xs text-muted-foreground hover:underline">Clear all</button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setRoleFilter("all")}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                roleFilter === "all" ? "bg-foreground text-background" : "hover:bg-accent"
              )}>
              All ({recipients.length})
            </button>
            {(["student","parent","tutor","admin"] as Role[]).map(role => (
              <button key={role} type="button" onClick={() => setRoleFilter(role)}
                style={roleFilter === role ? { background: ROLE_CONFIG[role].bg, color: ROLE_CONFIG[role].color, borderColor: ROLE_CONFIG[role].color } : {}}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors capitalize",
                  roleFilter !== role && "hover:bg-accent"
                )}>
                {ROLE_CONFIG[role].label} ({roleCounts[role]})
              </button>
            ))}
          </div>

          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or phone�" className={inputCls} />

          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {visibleRecipients.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No recipients found</p>
            )}
            {visibleRecipients.map(r => (
              <button key={r.id} type="button" onClick={() => toggleRecipient(r.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg border p-2.5 transition-colors text-left",
                  selectedIds.has(r.id) ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                )}>
                <div className={cn(
                  "h-4 w-4 rounded border-2 shrink-0 transition-colors",
                  selectedIds.has(r.id) ? "bg-primary border-primary" : "border-muted-foreground/30"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.email || r.phone || "No contact"}
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                  style={{ background: ROLE_CONFIG[r.role].bg, color: ROLE_CONFIG[r.role].color }}>
                  {ROLE_CONFIG[r.role].label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button type="submit"
          disabled={sending || !selectedTemplate || selectedIds.size === 0}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
          {sending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Sending�</>
          ) : (
            <><Send className="h-4 w-4" /> Send to {selectedIds.size} recipient{selectedIds.size !== 1 ? "s" : ""}</>
          )}
        </button>
      </form>
    </div>
  );
}

