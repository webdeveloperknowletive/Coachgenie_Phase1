"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Circle, Clock, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const API = "/api/proxy";

// ─── Types ────────────────────────────────────────────────────
interface Subject {
  id:   string;
  name: string;
  code: string | null;
}

interface SyllabusTopic {
  id:           string;
  title:        string;
  description:  string | null;
  sort_order:   number;
  status:       "not_started" | "in_progress" | "completed";
  notes:        string | null;
  completed_at: string | null;
  progress_id:  string | null;
}

const STATUS_CONFIG = {
  not_started: { label: "Not Started", icon: Circle,        color: "text-muted-foreground",  bg: "bg-muted"         },
  in_progress: { label: "In Progress", icon: Clock,         color: "text-amber-600",          bg: "bg-amber-50"      },
  completed:   { label: "Completed",   icon: CheckCircle2,  color: "text-emerald-600",        bg: "bg-emerald-50"    },
} as const;

type TopicStatus = keyof typeof STATUS_CONFIG;

// ─── Page ─────────────────────────────────────────────────────
export default function BatchSyllabusPage() {
  const params  = useParams();
  const batchId = params?.id as string;

  const [subjects,        setSubjects]        = useState<Subject[]>([]);
  const [activeSubject,   setActiveSubject]   = useState<Subject | null>(null);
  const [topics,          setTopics]          = useState<SyllabusTopic[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingTopics,   setLoadingTopics]   = useState(false);
  const [updatingId,      setUpdatingId]      = useState<string | null>(null);
  const [showAddTopic,    setShowAddTopic]    = useState(false);
  const [newTitle,        setNewTitle]        = useState("");
  const [newDesc,         setNewDesc]         = useState("");
  const [adding,          setAdding]          = useState(false);
  const [subjectError,    setSubjectError]    = useState<string | null>(null);
  const [topicError,      setTopicError]      = useState<string | null>(null);

  // Step 1: fetch batch → then fetch all subjects → filter by batch subjects
  // useEffect(() => {
  //   if (!batchId) return;
  //   (async () => {
  //     setLoadingSubjects(true);
  //     setSubjectError(null);
  //     try {
  //       const [batchRes, subjectsRes] = await Promise.all([
  //         fetch(`${API}/batches/${batchId}`,  { headers: { "Content-Type": "application/json" } }),
  //         fetch(`${API}/batches/subjects`,    { headers: { "Content-Type": "application/json" } }),
  //       ]);

  //       if (!batchRes.ok)    throw new Error(`Failed to load batch (HTTP ${batchRes.status})`);
  //       if (!subjectsRes.ok) throw new Error(`Failed to load subjects (HTTP ${subjectsRes.status})`);

  //       const batchJson    = await batchRes.json();
  //       const subjectsJson = await subjectsRes.json();

  //       const batch: { subjects?: string[] } = batchJson.data ?? batchJson;
  //       const allSubjects: Subject[]         = subjectsJson.data ?? subjectsJson ?? [];

  //       // batch.subjects is string[] of names — match to get IDs
  //       const batchSubjectNames = new Set(
  //         (batch.subjects ?? []).map((s: string) => s.toLowerCase().trim())
  //       );

  //       const matched = allSubjects.filter(
  //         (s) => batchSubjectNames.has(s.name.toLowerCase().trim())
  //       );

  //       setSubjects(matched);
  //       if (matched.length > 0) setActiveSubject(matched[0]);

  //     } catch (e: any) {
  //       setSubjectError(e.message ?? "Failed to load subjects");
  //     } finally {
  //       setLoadingSubjects(false);
  //     }
  //   })();
  // }, [batchId]);

useEffect(() => {
  if (!batchId) return;
  (async () => {
    setLoadingSubjects(true);
    setSubjectError(null);
    try {
      const [batchRes, subjectsRes] = await Promise.all([
        fetch(`${API}/batches/${batchId}`,  { headers: { "Content-Type": "application/json" } }),
        fetch(`${API}/batches/subjects`,    { headers: { "Content-Type": "application/json" } }),
      ]);

      if (!batchRes.ok)    throw new Error(`Failed to load batch (HTTP ${batchRes.status})`);
      if (!subjectsRes.ok) throw new Error(`Failed to load subjects (HTTP ${subjectsRes.status})`);

      const batchJson    = await batchRes.json();
      const subjectsJson = await subjectsRes.json();

      const batch: { subjects?: string[] } = batchJson.data ?? batchJson;
      const allSubjects: Subject[]         = subjectsJson.data ?? subjectsJson ?? [];
      const batchSubjectNames: string[]    = batch.subjects ?? [];

      if (batchSubjectNames.length === 0) {
        setSubjects([]);
        return;
      }

      // Match existing subjects by name (case-insensitive)
      const existingMap = new Map(
        allSubjects.map((s) => [s.name.toLowerCase().trim(), s])
      );

      // Find which batch subject names don't have a subject record yet
      const missing = batchSubjectNames.filter(
        (name) => !existingMap.has(name.toLowerCase().trim())
      );

      // Auto-create missing subjects
      if (missing.length > 0) {
        await Promise.all(
          missing.map((name) =>
            fetch(`${API}/batches/subjects`, {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify({ name }),
            })
          )
        );

        // Re-fetch subjects after creation
        const refreshed = await fetch(`${API}/batches/subjects`, {
          headers: { "Content-Type": "application/json" },
        });
        if (!refreshed.ok) throw new Error("Failed to reload subjects");
        const refreshedJson = await refreshed.json();
        const updatedAll: Subject[] = refreshedJson.data ?? refreshedJson ?? [];

        const matched = updatedAll.filter((s) =>
          batchSubjectNames.some(
            (name) => name.toLowerCase().trim() === s.name.toLowerCase().trim()
          )
        );
        setSubjects(matched);
        if (matched.length > 0) setActiveSubject(matched[0]);
      } else {
        // All subjects already exist — just match them
        const matched = allSubjects.filter((s) =>
          batchSubjectNames.some(
            (name) => name.toLowerCase().trim() === s.name.toLowerCase().trim()
          )
        );
        setSubjects(matched);
        if (matched.length > 0) setActiveSubject(matched[0]);
      }

    } catch (e: any) {
      setSubjectError(e.message ?? "Failed to load subjects");
    } finally {
      setLoadingSubjects(false);
    }
  })();
}, [batchId]);

  // Step 2: fetch topics whenever active subject changes
  const fetchTopics = useCallback(async (subjectId: string) => {
    setLoadingTopics(true);
    setTopicError(null);
    try {
      const res = await fetch(
        `${API}/batches/${batchId}/syllabus?subject_id=${subjectId}`,
        { headers: { "Content-Type": "application/json" } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setTopics(json.data ?? json ?? []);
    } catch (e: any) {
      setTopicError(e.message ?? "Failed to load topics");
      setTopics([]);
    } finally {
      setLoadingTopics(false);
    }
  }, [batchId]);

  useEffect(() => {
    if (activeSubject) fetchTopics(activeSubject.id);
  }, [activeSubject, fetchTopics]);

  // Update topic progress
  async function updateStatus(topic: SyllabusTopic, status: TopicStatus) {
    setUpdatingId(topic.id);
    try {
      const res = await fetch(`${API}/batches/${batchId}/syllabus/${topic.id}/progress`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setTopics((prev) =>
        prev.map((t) => t.id === topic.id ? { ...t, status } : t)
      );
      toast.success(`Marked as ${STATUS_CONFIG[status].label}`);
    } catch {
      toast.error("Failed to update progress");
    } finally {
      setUpdatingId(null);
    }
  }

  // Add new topic
  async function handleAddTopic() {
    if (!newTitle.trim() || !activeSubject) return;
    setAdding(true);
    try {
      const res = await fetch(`${API}/batches/subjects/${activeSubject.id}/syllabus`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          subject_id:  activeSubject.id,
          title:       newTitle.trim(),
          description: newDesc.trim() || null,
          sort_order:  topics.length,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Topic added");
      setNewTitle("");
      setNewDesc("");
      setShowAddTopic(false);
      fetchTopics(activeSubject.id);
    } catch {
      toast.error("Failed to add topic");
    } finally {
      setAdding(false);
    }
  }

  // ─── Stats ───────────────────────────────────────────────────
  const total     = topics.length;
  const completed = topics.filter((t) => t.status === "completed").length;
  const inProg    = topics.filter((t) => t.status === "in_progress").length;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

  // ─── Render ──────────────────────────────────────────────────
  if (loadingSubjects) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
        Loading subjects…
      </div>
    );
  }

  if (subjectError) {
    return (
      <div className="flex items-center justify-center py-24 text-destructive text-sm">
        {subjectError}
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
        No subjects found for this batch.
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Syllabus</h1>
        {activeSubject && (
          <button
            onClick={() => setShowAddTopic(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add Topic
          </button>
        )}
      </div>

      {/* Subject tabs */}
      <div className="flex gap-2 flex-wrap border-b pb-3">
        {subjects.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSubject(s)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium border transition-colors",
              activeSubject?.id === s.id
                ? "bg-primary text-primary-foreground border-primary"
                : "hover:bg-accent"
            )}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{activeSubject?.name} Progress</span>
            <span className="text-muted-foreground">{completed}/{total} topics · {pct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500",
                pct === 100 ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : "bg-amber-500"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="text-emerald-600">{completed} completed</span>
            <span className="text-amber-600">{inProg} in progress</span>
            <span>{total - completed - inProg} not started</span>
          </div>
        </div>
      )}

      {/* Topics */}
      {loadingTopics ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : topicError ? (
        <div className="text-destructive text-sm py-8 text-center">{topicError}</div>
      ) : topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed text-center gap-2">
          <p className="text-sm font-medium">No topics yet</p>
          <p className="text-xs text-muted-foreground">Add your first syllabus topic above</p>
        </div>
      ) : (
        <ol className="space-y-3">
          {[...topics].sort((a, b) => a.sort_order - b.sort_order).map((topic, idx) => {
            const cfg  = STATUS_CONFIG[topic.status] ?? STATUS_CONFIG.not_started;
            const Icon = cfg.icon;
            return (
              <li key={topic.id}
                className="flex gap-4 rounded-xl border bg-card p-4 hover:shadow-sm transition-all">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{topic.title}</p>
                  {topic.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{topic.description}</p>
                  )}
                  {topic.notes && (
                    <p className="text-xs italic text-muted-foreground mt-1">"{topic.notes}"</p>
                  )}
                </div>
                {/* Status cycling button */}
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={topic.status}
                    disabled={updatingId === topic.id}
                    onChange={(e) => updateStatus(topic, e.target.value as TopicStatus)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium border cursor-pointer transition-colors disabled:opacity-50",
                      cfg.bg, cfg.color
                    )}
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <Icon className={cn("h-4 w-4 shrink-0", cfg.color)} />
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {/* Add Topic Modal */}
      {showAddTopic && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddTopic(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-semibold">Add Topic — {activeSubject?.name}</h2>
              <button onClick={() => setShowAddTopic(false)} className="rounded-lg p-1.5 hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title *</label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="e.g. Chapter 1: Motion"
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  rows={3}
                  placeholder="Optional description…"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t px-5 py-4">
              <button onClick={() => setShowAddTopic(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-accent">Cancel</button>
              <button
                onClick={handleAddTopic}
                disabled={!newTitle.trim() || adding}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {adding ? "Adding…" : "Add Topic"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}