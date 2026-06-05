// "use client";
// import { use, useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { ArrowLeft, Sparkles, Plus, Star, Trophy, TrendingUp, Target, Edit2, Check, X } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { api } from "@/lib/api";
// import { toast } from "sonner";

// interface GrowthCard {
//   id: string;
//   student_id: string;
//   period_label: string;
//   academic_score: number | null;
//   attendance_percent: number | null;
//   behavior_rating: number | null;
//   strengths: string | null;
//   improvement_areas: string | null;
//   tutor_remarks: string | null;
//   parent_seen: boolean;
//   created_at: string;
// }

// interface Student {
//   id: string;
//   name: string;
//   grade: string;
//   subjects: string[];
// }

// export default function GrowthCardPage({ params }: { params: Promise<{ studentId: string }> }) {
//   const { studentId } = use(params);
//   const router        = useRouter();

//   const [student,   setStudent]   = useState<Student | null>(null);
//   const [cards,     setCards]     = useState<GrowthCard[]>([]);
//   const [loading,   setLoading]   = useState(true);
//   const [creating,  setCreating]  = useState(false);
//   const [showForm,  setShowForm]  = useState(false);
//   const [editing,   setEditing]   = useState<string | null>(null);

//   const [form, setForm] = useState({
//     period_label:       "",
//     academic_score:     "",
//     attendance_percent: "",
//     behavior_rating:    "3",
//     strengths:          "",
//     improvement_areas:  "",
//     tutor_remarks:      "",
//   });

//   useEffect(() => {
//     async function load() {
//       try {
//         const [sRes, cRes] = await Promise.all([
//           api.get(`/students/${studentId}`),
//           api.get(`/growth-cards/student/${studentId}`),
//         ]);
//         const s = sRes.data?.data ?? sRes.data;
//         setStudent({
//           id:       String(s.id),
//           name:     `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
//           grade:    s.current_class ?? "",
//           subjects: s.subjects ?? [],
//         });
//         setCards(cRes.data?.data ?? []);
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     }
//     load();
//   }, [studentId]);

//   async function handleCreate(e: React.FormEvent) {
//     e.preventDefault();
//     if (!form.period_label.trim()) return toast.error("Period label is required");
//     setCreating(true);
//     try {
//       const res = await api.post("/growth-cards/", {
//         student_id:         studentId,
//         period_label:       form.period_label.trim(),
//         academic_score:     form.academic_score     ? parseFloat(form.academic_score)     : null,
//         attendance_percent: form.attendance_percent ? parseFloat(form.attendance_percent) : null,
//         behavior_rating:    form.behavior_rating    ? parseInt(form.behavior_rating)      : null,
//         strengths:          form.strengths.trim()          || null,
//         improvement_areas:  form.improvement_areas.trim()  || null,
//         tutor_remarks:      form.tutor_remarks.trim()       || null,
//       });
//       setCards(prev => [res.data.data, ...prev]);
//       setShowForm(false);
//       setForm({ period_label: "", academic_score: "", attendance_percent: "", behavior_rating: "3", strengths: "", improvement_areas: "", tutor_remarks: "" });
//       toast.success("Growth card created");
//     } catch (err: any) {
//       toast.error(err.message ?? "Failed to create card");
//     } finally {
//       setCreating(false);
//     }
//   }

//   async function handleUpdate(cardId: string, data: Partial<GrowthCard>) {
//     try {
//       const res = await api.patch(`/growth-cards/${cardId}`, data);
//       setCards(prev => prev.map(c => c.id === cardId ? res.data.data : c));
//       setEditing(null);
//       toast.success("Card updated");
//     } catch (err: any) {
//       toast.error("Failed to update");
//     }
//   }

//   if (loading) return (
//     <div className="space-y-4 max-w-3xl">
//       <div className="h-8 w-48 bg-muted rounded animate-pulse" />
//       <div className="h-64 bg-muted rounded-xl animate-pulse" />
//     </div>
//   );

//   if (!student) return (
//     <div className="flex flex-col items-center justify-center h-64 gap-3">
//       <p className="text-muted-foreground">Student not found.</p>
//       <button onClick={() => router.push("/growth-cards")}
//         className="rounded-lg border px-4 py-2 text-sm hover:bg-accent">Back</button>
//     </div>
//   );

//   return (
//     <div className="space-y-5 max-w-3xl">
//       {/* Header */}
//       <div className="flex items-start justify-between gap-4">
//         <div className="flex items-start gap-3">
//           <button onClick={() => router.push("/growth-cards")}
//             className="mt-1 rounded-lg p-2 hover:bg-accent text-muted-foreground transition-colors">
//             <ArrowLeft className="h-4 w-4" />
//           </button>
//           <div>
//             <h1 className="text-2xl font-bold flex items-center gap-2">
//               {student.name}
//               <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
//                 <Sparkles className="h-3 w-3" /> Growth Cards
//               </span>
//             </h1>
//             <p className="text-sm text-muted-foreground">{student.grade} · {student.subjects.join(", ")}</p>
//           </div>
//         </div>
//         <button onClick={() => setShowForm(v => !v)}
//           className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
//           <Plus className="h-4 w-4" /> New Card
//         </button>
//       </div>

//       {/* Create Form */}
//       {showForm && (
//         <form onSubmit={handleCreate} className="rounded-xl border bg-card p-5 space-y-4">
//           <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">New Growth Card</p>
//           <div className="grid gap-3 sm:grid-cols-2">
//             <div className="space-y-1 sm:col-span-2">
//               <label className="text-xs font-medium text-muted-foreground">Period Label *</label>
//               <input required value={form.period_label}
//                 onChange={e => setForm(f => ({ ...f, period_label: e.target.value }))}
//                 placeholder="e.g. Q1 2025, April–June 2025"
//                 className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
//             </div>
//             <div className="space-y-1">
//               <label className="text-xs font-medium text-muted-foreground">Academic Score (%)</label>
//               <input type="number" min="0" max="100" value={form.academic_score}
//                 onChange={e => setForm(f => ({ ...f, academic_score: e.target.value }))}
//                 placeholder="e.g. 78.5"
//                 className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
//             </div>
//             <div className="space-y-1">
//               <label className="text-xs font-medium text-muted-foreground">Attendance (%)</label>
//               <input type="number" min="0" max="100" value={form.attendance_percent}
//                 onChange={e => setForm(f => ({ ...f, attendance_percent: e.target.value }))}
//                 placeholder="e.g. 90"
//                 className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
//             </div>
//             <div className="space-y-1 sm:col-span-2">
//               <label className="text-xs font-medium text-muted-foreground">Behavior Rating (1–5)</label>
//               <div className="flex gap-2">
//                 {[1,2,3,4,5].map(n => (
//                   <button key={n} type="button"
//                     onClick={() => setForm(f => ({ ...f, behavior_rating: String(n) }))}
//                     className={cn("h-9 w-9 rounded-lg border text-sm font-medium transition-colors",
//                       form.behavior_rating === String(n)
//                         ? "bg-primary text-primary-foreground border-primary"
//                         : "hover:bg-accent"
//                     )}>{n}</button>
//                 ))}
//               </div>
//             </div>
//             <div className="space-y-1">
//               <label className="text-xs font-medium text-muted-foreground">Strengths</label>
//               <textarea rows={3} value={form.strengths}
//                 onChange={e => setForm(f => ({ ...f, strengths: e.target.value }))}
//                 placeholder="e.g. Strong in Maths, consistent effort..."
//                 className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
//             </div>
//             <div className="space-y-1">
//               <label className="text-xs font-medium text-muted-foreground">Areas to Improve</label>
//               <textarea rows={3} value={form.improvement_areas}
//                 onChange={e => setForm(f => ({ ...f, improvement_areas: e.target.value }))}
//                 placeholder="e.g. Physics needs more practice..."
//                 className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
//             </div>
//             <div className="space-y-1 sm:col-span-2">
//               <label className="text-xs font-medium text-muted-foreground">Tutor Remarks</label>
//               <textarea rows={2} value={form.tutor_remarks}
//                 onChange={e => setForm(f => ({ ...f, tutor_remarks: e.target.value }))}
//                 placeholder="Overall remarks for parents..."
//                 className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
//             </div>
//           </div>
//           <div className="flex justify-end gap-2">
//             <button type="button" onClick={() => setShowForm(false)}
//               className="rounded-lg border px-4 py-1.5 text-sm hover:bg-accent transition-colors">Cancel</button>
//             <button type="submit" disabled={creating}
//               className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
//               {creating ? "Creating..." : "Create Card"}
//             </button>
//           </div>
//         </form>
//       )}

//       {/* Cards List */}
//       {cards.length === 0 && !showForm && (
//         <div className="rounded-xl border bg-card p-12 flex flex-col items-center justify-center gap-3">
//           <Sparkles className="h-8 w-8 text-muted-foreground/40" />
//           <p className="text-sm text-muted-foreground">No growth cards yet.</p>
//           <button onClick={() => setShowForm(true)}
//             className="text-xs text-primary hover:underline flex items-center gap-1">
//             <Plus className="h-3 w-3" /> Create first card
//           </button>
//         </div>
//       )}

//       {cards.map(card => (
//         <div key={card.id}
//           className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-6 space-y-5 shadow-lg">
//           {/* Card Header */}
//           <div className="flex items-start justify-between">
//             <div>
//               <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Academic Growth Card</p>
//               <h2 className="text-xl font-bold">{student.name}</h2>
//               <p className="text-sm text-muted-foreground">{student.grade} · {card.period_label}</p>
//             </div>
//             <div className="text-center">
//               <div className="flex gap-0.5 mb-1">
//                 {Array.from({ length: 5 }).map((_, i) => (
//                   <Star key={i} className={cn("h-4 w-4",
//                     i < (card.behavior_rating ?? 0)
//                       ? "fill-amber-400 text-amber-400"
//                       : "text-muted-foreground/30"
//                   )} />
//                 ))}
//               </div>
//               <p className="text-xs text-muted-foreground">Behavior</p>
//               {card.academic_score !== null && (
//                 <p className="text-2xl font-bold text-primary mt-1">{card.academic_score}%</p>
//               )}
//             </div>
//           </div>

//           {/* Stats row */}
//           <div className="grid grid-cols-2 gap-3">
//             {card.academic_score !== null && (
//               <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 text-center">
//                 <p className="text-xs text-muted-foreground mb-1">Academic Score</p>
//                 <p className="text-xl font-bold text-primary">{card.academic_score}%</p>
//               </div>
//             )}
//             {card.attendance_percent !== null && (
//               <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 text-center">
//                 <p className="text-xs text-muted-foreground mb-1">Attendance</p>
//                 <p className="text-xl font-bold text-emerald-600">{card.attendance_percent}%</p>
//               </div>
//             )}
//           </div>

//           <div className="grid gap-4 sm:grid-cols-2">
//             {/* Strengths */}
//             {card.strengths && (
//               <div className="rounded-xl border bg-card p-4">
//                 <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-3 flex items-center gap-1">
//                   <Trophy className="h-3.5 w-3.5" /> Strengths
//                 </p>
//                 <p className="text-sm leading-relaxed">{card.strengths}</p>
//               </div>
//             )}
//             {/* Areas */}
//             {card.improvement_areas && (
//               <div className="rounded-xl border bg-card p-4">
//                 <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-3 flex items-center gap-1">
//                   <TrendingUp className="h-3.5 w-3.5" /> Areas to Improve
//                 </p>
//                 <p className="text-sm leading-relaxed">{card.improvement_areas}</p>
//               </div>
//             )}
//           </div>

//           {/* Tutor Remarks */}
//           {card.tutor_remarks && (
//             <div className="rounded-xl border bg-card p-4 flex items-start gap-3">
//               <Target className="h-5 w-5 text-primary shrink-0 mt-0.5" />
//               <div>
//                 <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Tutor Remarks</p>
//                 <p className="text-sm">{card.tutor_remarks}</p>
//               </div>
//             </div>
//           )}

//           {/* Footer */}
//           <div className="flex items-center justify-between pt-2 border-t">
//             <p className="text-xs text-muted-foreground">
//               Created {new Date(card.created_at).toLocaleDateString()}
//             </p>
//             <div className="flex items-center gap-2">
//               {card.parent_seen && (
//                 <span className="text-xs text-emerald-600 flex items-center gap-1">
//                   <Check className="h-3 w-3" /> Seen by parent
//                 </span>
//               )}
//               <button
//                 onClick={() => handleUpdate(card.id, { parent_seen: true })}
//                 disabled={card.parent_seen}
//                 className="text-xs text-primary hover:underline disabled:opacity-40 disabled:no-underline">
//                 Mark parent seen
//               </button>
//             </div>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }

"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, RefreshCw, Star, Trophy, TrendingUp, Target, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface GrowthCard {
  id: string;
  student_id: string;
  period_label: string;
  academic_score: number | null;
  attendance_percent: number | null;
  behavior_rating: number | null;
  strengths: string | null;
  improvement_areas: string | null;
  tutor_remarks: string | null;
  parent_seen: boolean;
  created_at: string;
}

interface Student {
  id: string;
  name: string;
  grade: string;
  subjects: string[];
}

export default function GrowthCardPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  const router        = useRouter();

  const [student,    setStudent]    = useState<Student | null>(null);
  const [cards,      setCards]      = useState<GrowthCard[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [generating, setGenerating] = useState(false);

  // useEffect(() => {
  //   async function load() {
  //     try {
  //       const [sRes, cRes] = await Promise.all([
  //         api.get(`/students/${studentId}`),
  //         api.get(`/growth-cards/student/${studentId}`),
  //       ]);
  //       const s = sRes.data?.data ?? sRes.data;
  //       setStudent({
  //         id:       String(s.id),
  //         name:     `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
  //         grade:    s.current_class ?? "",
  //         subjects: s.subjects ?? [],
  //       });
  //       setCards(cRes.data?.data ?? []);
  //     } catch (err) {
  //       console.error(err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }
  //   load();
  // }, [studentId]);
  useEffect(() => {
  async function load() {
    try {
      const [sRes, cRes] = await Promise.all([
        api.get(`/students/${studentId}`),
        api.get(`/growth-cards/student/${studentId}`),
      ]);
      const s = sRes.data?.data ?? sRes.data;
      setStudent({
        id:       String(s.id),
        name:     `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
        grade:    s.current_class ?? "",
        subjects: s.subjects ?? [],
      });
      
      // ✅ Fix: handle different response shapes
      // const raw = cRes.data?.data ?? cRes.data ?? [];
      // console.log("cards raw:", raw);
      // setCards(Array.isArray(raw) ? raw : []);
      const raw = cRes.data?.data ?? cRes.data ?? [];
      setCards(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  load();
}, [studentId]);

  // async function handleGenerate() {
  //   setGenerating(true);
  //   try {
  //     const res = await api.post(`/growth-cards/generate/${studentId}`, {});
  //     setCards(prev => [res.data.data, ...prev]);
  //     toast.success("Growth card generated!");
  //   } catch (err: any) {
  //     toast.error(err.response?.data?.detail ?? "Failed to generate card");
  //   } finally {
  //     setGenerating(false);
  //   }
  // }
  async function handleGenerate() {
  setGenerating(true);
  try {
    const res = await api.post(`/growth-cards/generate/${studentId}`, {});
    const newCard = res.data?.data ?? res.data;
    setCards(prev => [newCard, ...prev]);
    toast.success("Growth card generated!");
  } catch (err: any) {
    toast.error(err.response?.data?.detail ?? "Failed to generate card");
  } finally {
    setGenerating(false);
  }
}

  // async function handleMarkParentSeen(cardId: string) {
  //   try {
  //     const res = await api.patch(`/growth-cards/${cardId}`, { parent_seen: true });
  //     setCards(prev => prev.map(c => c.id === cardId ? res.data.data : c));
  //     toast.success("Marked as seen by parent");
  //   } catch {
  //     toast.error("Failed to update");
  //   }
  // }
  async function handleMarkParentSeen(cardId: string) {
  try {
    await api.patch(`/growth-cards/${cardId}`, { parent_seen: true });
    // Update locally instead of relying on response shape
    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, parent_seen: true } : c
    ));
    toast.success("Marked as seen by parent");
  } catch {
    toast.error("Failed to update");
  }
}

  if (loading) return (
    <div className="space-y-4 max-w-3xl">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <div className="h-64 bg-muted rounded-xl animate-pulse" />
    </div>
  );

  if (!student) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-muted-foreground">Student not found.</p>
      <button onClick={() => router.push("/growth-cards")}
        className="rounded-lg border px-4 py-2 text-sm hover:bg-accent">Back</button>
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => router.push("/growth-cards")}
            className="mt-1 rounded-lg p-2 hover:bg-accent text-muted-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {student.name}
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                <Sparkles className="h-3 w-3" /> Growth Cards
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">{student.grade} · {student.subjects.join(", ")}</p>
          </div>
        </div>
        <button onClick={handleGenerate} disabled={generating}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
          {generating
            ? <><RefreshCw className="h-4 w-4 animate-spin" /> Generating...</>
            : <><Sparkles className="h-4 w-4" /> Generate Card</>
          }
        </button>
      </div>

      {/* Empty state */}
      {cards.length === 0 && !generating && (
        <div className="rounded-xl border bg-card p-12 flex flex-col items-center justify-center gap-3">
          <Sparkles className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No growth cards yet.</p>
          <button onClick={handleGenerate}
            className="text-xs text-primary hover:underline flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Generate first card
          </button>
        </div>
      )}

      {/* Generating skeleton */}
      {generating && (
        <div className="rounded-2xl border-2 border-primary/20 bg-card p-6 space-y-4 animate-pulse">
          <div className="h-5 w-48 bg-muted rounded" />
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-3/4 bg-muted rounded" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 bg-muted rounded-xl" />
            <div className="h-16 bg-muted rounded-xl" />
          </div>
        </div>
      )}

      {/* Cards */}
      {cards.filter(Boolean).map(card => (
        <div key={card.id}
          className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-6 space-y-5 shadow-lg">

          {/* Card Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Academic Growth Card</p>
              <h2 className="text-xl font-bold">{student.name}</h2>
              <p className="text-sm text-muted-foreground">{student.grade} · {card.period_label}</p>
            </div>
            <div className="text-center">
              <div className="flex gap-0.5 mb-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn("h-4 w-4",
                    i < (card.behavior_rating ?? 0)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30"
                  )} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Behavior</p>
              {card.academic_score !== null && (
                <p className="text-2xl font-bold text-primary mt-1">{card.academic_score}%</p>
              )}
            </div>
          </div>

          {/* Stats */}
          {(card.academic_score !== null || card.attendance_percent !== null) && (
            <div className="grid grid-cols-2 gap-3">
              {card.academic_score !== null && (
                <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Academic Score</p>
                  <p className="text-xl font-bold text-primary">{card.academic_score}%</p>
                </div>
              )}
              {card.attendance_percent !== null && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Attendance</p>
                  <p className="text-xl font-bold text-emerald-600">{card.attendance_percent}%</p>
                </div>
              )}
            </div>
          )}

          {/* Strengths + Areas */}
          <div className="grid gap-4 sm:grid-cols-2">
            {card.strengths && (
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-3 flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5" /> Strengths
                </p>
                <p className="text-sm leading-relaxed">{card.strengths}</p>
              </div>
            )}
            {card.improvement_areas && (
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-3 flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" /> Areas to Improve
                </p>
                <p className="text-sm leading-relaxed">{card.improvement_areas}</p>
              </div>
            )}
          </div>

          {/* Tutor Remarks */}
          {card.tutor_remarks && (
            <div className="rounded-xl border bg-card p-4 flex items-start gap-3">
              <Target className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Tutor Remarks</p>
                <p className="text-sm">{card.tutor_remarks}</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Created {new Date(card.created_at).toLocaleDateString()}
            </p>
            <div className="flex items-center gap-2">
              {card.parent_seen ? (
                <span className="text-xs text-emerald-600 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Seen by parent
                </span>
              ) : (
                <button onClick={() => handleMarkParentSeen(card.id)}
                  className="text-xs text-primary hover:underline">
                  Mark parent seen
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}