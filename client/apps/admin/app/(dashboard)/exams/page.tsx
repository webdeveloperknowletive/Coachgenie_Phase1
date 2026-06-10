"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, X, ChevronRight, Clock, CheckCircle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAcademicStore } from "@/lib/stores/academic.store";
import { ExamForm, type ExamFormValues } from "@/components/exams/ExamForm";
import type { Exam } from "@/lib/types/academic";

const STATUS_CONFIG: Record<Exam["status"], { label: string; color: string; bg: string; icon: React.ElementType }> = {
  UPCOMING:  { label:"Upcoming",  color:"text-blue-600",    bg:"bg-blue-50 dark:bg-blue-950",    icon: Calendar },
  ONGOING:   { label:"Ongoing",   color:"text-amber-600",   bg:"bg-amber-50 dark:bg-amber-950",  icon: Clock },
  COMPLETED: { label:"Completed", color:"text-emerald-600", bg:"bg-emerald-50 dark:bg-emerald-950", icon: CheckCircle },
};

export default function ExamsPage() {
  const { exams, addExam, batches } = useAcademicStore();
  const [showForm, setShowForm]     = useState(false);
  const [filter, setFilter]         = useState<Exam["status"] | "ALL">("ALL");

  const filtered = filter === "ALL" ? exams : exams.filter(e => e.status === filter);

  async function handleCreate(data: ExamFormValues) {
    await new Promise(r => setTimeout(r, 500));
    addExam(data);
    toast.success("Exam created!");
    setShowForm(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exams</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{exams.length} total exams</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Create Exam
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL","UPCOMING","ONGOING","COMPLETED"] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filter===s ? "bg-foreground text-background" : "hover:bg-accent"
            )}>
            {s} ({s==="ALL" ? exams.length : exams.filter(e=>e.status===s).length})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(exam => {
          const cfg   = STATUS_CONFIG[exam.status];
          const batch = batches.find(b => b.id === exam.batchId);
          const StatusIcon = cfg.icon;
          return (
            <Link key={exam.id} href={`/exams/${exam.id}`}
              className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group">
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", cfg.bg)}>
                <StatusIcon className={cn("h-5 w-5", cfg.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{exam.name}</p>
                <p className="text-xs text-muted-foreground">
                  {exam.subject} · {batch?.name} · {format(new Date(exam.date), "dd MMM yyyy")}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                <span>Max: {exam.maxMarks}</span>
                <span>{exam.duration}min</span>
                <span className={cn("font-medium", cfg.color)}>{cfg.label}</span>
              </div>
              {exam.status === "COMPLETED" && (
                <span className="hidden md:block text-xs text-muted-foreground">
                  {exam.results.length} results
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-40 rounded-xl border bg-card text-sm text-muted-foreground">
            No exams found.
          </div>
        )}
      </div>

      {showForm && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl rounded-2xl border bg-background shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">Create Exam</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <div className="px-6 py-5">
              <ExamForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
