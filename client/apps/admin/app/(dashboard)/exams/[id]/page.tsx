"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAcademicStore } from "@/lib/stores/academic.store";
import { RankTable } from "@/components/exams/RankTable";

export default function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = use(params);
  const router  = useRouter();
  const store   = useAcademicStore();
  const exam    = store.exams.find(e => e.id === id);

  if (!exam) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Exam not found.</p>
    </div>
  );

  const batch    = store.batches.find(b => b.id === exam.batchId);
  const students = store.students.filter(s => batch?.studentIds.includes(s.id));
  const hasResults = exam.results.length > 0 && exam.results.some(r => r.marks !== null);

  const avg = hasResults
    ? Math.round(exam.results.filter(r=>r.marks!==null).reduce((a,b)=>a+(b.marks??0),0) / exam.results.filter(r=>r.marks!==null).length)
    : null;
  const highest = hasResults
    ? Math.max(...exam.results.filter(r=>r.marks!==null).map(r=>r.marks!))
    : null;

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => router.push("/exams")}
            className="mt-1 rounded-lg p-2 hover:bg-accent text-muted-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{exam.name}</h1>
            <p className="text-sm text-muted-foreground">
              {exam.subject} · {batch?.name} · {format(new Date(exam.date), "dd MMM yyyy")} · {exam.duration} min · Max {exam.maxMarks}
            </p>
          </div>
        </div>
        <Link href={`/exams/${id}/results`}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <ClipboardList className="h-4 w-4" />
          {hasResults ? "Edit Results" : "Enter Results"}
        </Link>
      </div>

      {hasResults && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:"Students", value: exam.results.filter(r=>r.marks!==null).length },
            { label:"Average",  value: avg !== null ? `${avg}/${exam.maxMarks}` : "—" },
            { label:"Highest",  value: highest !== null ? `${highest}/${exam.maxMarks}` : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border bg-card p-4 text-center">
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {hasResults ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Rankings</h3>
          <RankTable students={students} results={exam.results} maxMarks={exam.maxMarks} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 rounded-xl border bg-card gap-3">
          <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No results entered yet.</p>
          <Link href={`/exams/${id}/results`}
            className="text-sm text-primary hover:underline">Enter results →</Link>
        </div>
      )}
    </div>
  );
}