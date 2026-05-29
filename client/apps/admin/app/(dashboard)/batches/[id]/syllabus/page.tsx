// "use client";
// import { use, useState, useEffect } from "react";
// import Link from "next/link";
// import { ArrowLeft, CheckCircle2, Circle, Plus, X } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { toast } from "sonner";

// const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// function authHeaders(): HeadersInit {
//   let token: string | null = null;
//   let tenantId: string | null = null;
//   try {
//     const raw   = localStorage.getItem("coachgenie-auth");
//     const state = raw ? JSON.parse(raw)?.state : null;
//     token    = state?.accessToken ?? null;
//     tenantId = state?.tenantId    ?? null;
//   } catch {}
//   return {
//     "Content-Type": "application/json",
//     ...(token    ? { Authorization: `Bearer ${token}` } : {}),
//     ...(tenantId ? { "X-Tenant-Id": tenantId }          : {}),
//   };
// }

// type Topic = {
//   id: string;
//   title: string;
//   completed: boolean;
//   sessions: number;
// };

// export default function BatchSyllabusPage({ params }: { params: Promise<{ id: string }> }) {
//   const { id }  = use(params);
//   const [topics,    setTopics]    = useState<Topic[]>([]);
//   const [batchName, setBatchName] = useState("");
//   const [loading,   setLoading]   = useState(true);
//   const [showForm,  setShowForm]  = useState(false);
//   const [title,     setTitle]     = useState("");
//   const [sessions,  setSessions]  = useState("1");
//   const [saving,    setSaving]    = useState(false);

//   // ── Load syllabus from backend ──────────────────────────────
//   useEffect(() => {
//     async function load() {
//       setLoading(true);
//       try {
//         // Load batch name
//         const bRes  = await fetch(`${API}/batches/${id}`, { headers: authHeaders() });
//         if (bRes.ok) {
//           const b = await bRes.json();
//           setBatchName(b.name ?? "");
//         }
//         // Load syllabus topics
//         const sRes  = await fetch(`${API}/batches/${id}/syllabus`, { headers: authHeaders() });
//         if (sRes.ok) {
//           const data = await sRes.json();
//           const raw: any[] = Array.isArray(data) ? data : (data.data ?? data.topics ?? []);
//           setTopics(raw.map(t => ({
//             id:        String(t.id),
//             title:     t.title ?? t.name ?? "",
//             completed: t.completed ?? t.is_completed ?? false,
//             sessions:  t.sessions  ?? t.session_count ?? 0,
//           })));
//         }
//       } catch (err) {
//         toast.error("Failed to load syllabus");
//       } finally {
//         setLoading(false);
//       }
//     }
//     load();
//   }, [id]);

//   // ── Toggle topic complete ───────────────────────────────────
//   async function toggle(topic: Topic) {
//     // Optimistic update
//     setTopics(prev => prev.map(t => t.id === topic.id ? { ...t, completed: !t.completed } : t));
//     try {
//       const res = await fetch(`${API}/batches/${id}/syllabus/${topic.id}/progress`, {
//         method:  "PATCH",
//         headers: authHeaders(),
//         body:    JSON.stringify({ completed: !topic.completed }),
//       });
//       if (!res.ok) throw new Error("Failed to update");
//       toast.success("Syllabus updated");
//     } catch {
//       // Revert on failure
//       setTopics(prev => prev.map(t => t.id === topic.id ? { ...t, completed: topic.completed } : t));
//       toast.error("Failed to update topic");
//     }
//   }

//   // ── Add topic ───────────────────────────────────────────────
//   async function handleAdd() {
//     const trimmed = title.trim();
//     if (!trimmed) { toast.error("Topic title is required"); return; }
//     const numSessions = parseInt(sessions, 10);
//     if (!numSessions || numSessions < 1) { toast.error("Enter a valid session count"); return; }
//     setSaving(true);
//     try {
//       // Your backend uses subjects for syllabus topics — post to batch syllabus
//       // Try batch-level syllabus endpoint first
//       const res = await fetch(`${API}/batches/${id}/syllabus`, {
//         method:  "POST",
//         headers: authHeaders(),
//         body:    JSON.stringify({
//           title:         trimmed,
//           session_count: numSessions,
//           completed:     false,
//         }),
//       });
//       if (!res.ok) throw new Error(`HTTP ${res.status}`);
//       const created = await res.json();
//       setTopics(prev => [...prev, {
//         id:        String(created.id),
//         title:     created.title ?? trimmed,
//         completed: false,
//         sessions:  created.sessions ?? created.session_count ?? numSessions,
//       }]);
//       setTitle(""); setSessions("1"); setShowForm(false);
//       toast.success("Topic added");
//     } catch (err: any) {
//       toast.error(err.message ?? "Failed to add topic");
//     } finally {
//       setSaving(false);
//     }
//   }

//   const completed = topics.filter(t => t.completed).length;
//   const pct       = topics.length > 0 ? Math.round((completed / topics.length) * 100) : 0;

//   if (loading) return (
//     <div className="space-y-4 max-w-2xl">
//       <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
//       <div className="h-20 rounded-xl bg-muted animate-pulse" />
//       {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
//     </div>
//   );

//   return (
//     <div className="space-y-5 max-w-2xl">
//       {/* Header */}
//       <div className="flex items-center gap-3">
//         <Link href={`/batches/${id}`}
//           className="rounded-lg p-2 hover:bg-accent text-muted-foreground transition-colors">
//           <ArrowLeft className="h-4 w-4" />
//         </Link>
//         <div className="flex-1">
//           <h1 className="text-xl font-bold">{batchName} — Syllabus</h1>
//           <p className="text-sm text-muted-foreground">{completed}/{topics.length} topics completed</p>
//         </div>
//         <button onClick={() => setShowForm(v => !v)}
//           className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
//           <Plus className="h-4 w-4" /> Add Topic
//         </button>
//       </div>

//       {/* Add form */}
//       {showForm && (
//         <div className="rounded-xl border bg-card p-5 space-y-4">
//           <div className="flex items-center justify-between">
//             <h2 className="text-sm font-semibold">New Topic</h2>
//             <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
//               <X className="h-4 w-4" />
//             </button>
//           </div>
//           <div className="flex gap-3">
//             <input autoFocus value={title}
//               onChange={e => setTitle(e.target.value)}
//               onKeyDown={e => e.key === "Enter" && handleAdd()}
//               placeholder="Topic title e.g. Kinematics"
//               className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
//             />
//             <input type="number" min={1} value={sessions}
//               onChange={e => setSessions(e.target.value)}
//               placeholder="Sessions"
//               className="w-24 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
//             />
//             <button onClick={handleAdd} disabled={saving}
//               className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
//               {saving ? "Adding…" : "Add"}
//             </button>
//           </div>
//           <p className="text-xs text-muted-foreground">Press Enter or click Add.</p>
//         </div>
//       )}

//       {/* Progress */}
//       <div className="rounded-xl border bg-card p-5 space-y-3">
//         <div className="flex justify-between text-sm">
//           <span className="font-medium">Overall Progress</span>
//           <span className="font-bold text-primary">{pct}%</span>
//         </div>
//         <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
//           <div className="h-full rounded-full bg-primary transition-all duration-500"
//             style={{ width: `${pct}%` }} />
//         </div>
//       </div>

//       {/* Topics */}
//       <div className="space-y-2">
//         {topics.length === 0 ? (
//           <div className="flex flex-col items-center justify-center gap-3 h-40 rounded-xl border bg-card text-sm text-muted-foreground">
//             <p>No syllabus topics added yet.</p>
//             <button onClick={() => setShowForm(true)}
//               className="flex items-center gap-1.5 text-primary text-xs font-medium hover:underline">
//               <Plus className="h-3.5 w-3.5" /> Add your first topic
//             </button>
//           </div>
//         ) : topics.map((topic, i) => (
//           <button key={topic.id} onClick={() => toggle(topic)}
//             className={cn(
//               "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all hover:shadow-sm",
//               topic.completed
//                 ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
//                 : "bg-card hover:bg-muted/50"
//             )}>
//             <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">{i + 1}</span>
//             {topic.completed
//               ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
//               : <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
//             }
//             <div className="flex-1 min-w-0">
//               <p className={cn("text-sm font-medium", topic.completed && "line-through text-muted-foreground")}>
//                 {topic.title}
//               </p>
//             </div>
//             <span className="text-xs text-muted-foreground shrink-0">{topic.sessions} sessions</span>
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// }


"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { authHeaders } from "@/lib/auth-headers";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface Topic {
  id: string;
  title: string;
  subject?: string;
  description?: string;
  order: number;
  completed: boolean;
  completed_at?: string | null;
  notes?: string | null;
}

export default function SyllabusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [topics, setTopics]       = useState<Topic[]>([]);
  const [loading, setLoading]     = useState(true);
  const [batchName, setBatchName] = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", subject: "", description: "" });

  // fetch batch name + syllabus
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [bRes, sRes] = await Promise.all([
          fetch(`${API}/batches/${id}`, { headers: authHeaders() }),
          fetch(`${API}/syllabus/${id}`, { headers: authHeaders() }),
        ]);
        if (bRes.ok) {
          const bJson = await bRes.json();
          const b = bJson.data ?? bJson;
          setBatchName(b.name ?? "");
        }
        if (sRes.ok) {
          const sJson = await sRes.json();
          setTopics(sJson.data ?? []);
        }
      } catch (err: any) {
        toast.error("Failed to load syllabus");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/syllabus/${id}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          title: form.title.trim(),
          subject: form.subject.trim() || null,
          description: form.description.trim() || null,
          order: topics.length,
        }),
      });
      if (!res.ok) throw new Error("Failed to add topic");
      const json = await res.json();
      setTopics(prev => [...prev, json.data]);
      setForm({ title: "", subject: "", description: "" });
      setShowForm(false);
      toast.success("Topic added");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(topic: Topic) {
    const newVal = !topic.completed;
    // optimistic update
    setTopics(prev => prev.map(t => t.id === topic.id ? { ...t, completed: newVal } : t));
    try {
      const res = await fetch(`${API}/syllabus/${id}/${topic.id}/toggle`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ completed: newVal }),
      });
      if (!res.ok) throw new Error("Failed to update");
    } catch {
      // revert
      setTopics(prev => prev.map(t => t.id === topic.id ? { ...t, completed: topic.completed } : t));
      toast.error("Failed to update topic");
    }
  }

  async function handleDelete(topicId: string) {
    setTopics(prev => prev.filter(t => t.id !== topicId));
    try {
      const res = await fetch(`${API}/syllabus/${id}/${topicId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Topic deleted");
    } catch {
      toast.error("Failed to delete topic");
    }
  }

  const completed = topics.filter(t => t.completed).length;
  const progress  = topics.length > 0 ? Math.round((completed / topics.length) * 100) : 0;

  if (loading) return (
    <div className="space-y-4 max-w-2xl">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <div className="h-4 w-full bg-muted rounded animate-pulse" />
      {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/batches/${id}`)}
            className="rounded-lg p-2 hover:bg-accent text-muted-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold">— Syllabus</h1>
            <p className="text-xs text-muted-foreground">{completed}/{topics.length} topics completed</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Topic
        </button>
      </div>

      {/* Progress */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm font-semibold text-primary">{progress}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Add Topic Form */}
      {showForm && (
        <form onSubmit={handleAdd} className="rounded-xl border bg-card p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">New Topic</p>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Title *</label>
            <input
              required
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Newton's Laws of Motion"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Subject</label>
              <input
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="e.g. Physics"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional notes"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-lg border px-4 py-1.5 text-sm hover:bg-accent transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
              {submitting ? "Adding..." : "Add Topic"}
            </button>
          </div>
        </form>
      )}

      {/* Topics List */}
      <div className="rounded-xl border bg-card p-4 space-y-2">
        {topics.length === 0 && !showForm && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
            <p className="text-sm text-muted-foreground">No syllabus topics added yet.</p>
            <button onClick={() => setShowForm(true)}
              className="text-xs text-primary hover:underline flex items-center gap-1">
              <Plus className="h-3 w-3" /> Add your first topic
            </button>
          </div>
        )}

        {topics.map(topic => (
          <div key={topic.id}
            className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/40 transition-colors group">
            <button onClick={() => handleToggle(topic)} className="shrink-0">
              {topic.completed
                ? <CheckCircle2 className="h-5 w-5 text-primary" />
                : <Circle className="h-5 w-5 text-muted-foreground/40 hover:text-primary transition-colors" />
              }
            </button>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium", topic.completed && "line-through text-muted-foreground")}>
                {topic.title}
              </p>
              {(topic.subject || topic.description) && (
                <p className="text-xs text-muted-foreground truncate">
                  {[topic.subject, topic.description].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
            {topic.completed && topic.completed_at && (
              <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">
                {new Date(topic.completed_at).toLocaleDateString()}
              </span>
            )}
            <button
              onClick={() => handleDelete(topic.id)}
              className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}