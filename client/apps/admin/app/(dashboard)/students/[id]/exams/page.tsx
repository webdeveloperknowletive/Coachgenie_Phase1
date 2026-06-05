"use client";
import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAcademicStore } from "@/lib/stores/academic.store";

export default function StudentExamsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }   = use(params);
  const store    = useAcademicStore();
  const student  = store.students.find(s => s.id === id);

  const examResults = store.exams
    .map(exam => ({ exam, result: exam.results.find(r => r.studentId === id) }))
    .filter(({ result }) => result !== undefined);

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/students/${id}`} className="rounded-lg p-2 hover:bg-accent text-muted-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{student?.name} — Exam Results</h1>
          <p className="text-sm text-muted-foreground">{examResults.length} exams taken</p>
        </div>
      </div>

      {examResults.length === 0 ? (
        <div className="flex items-center justify-center h-40 rounded-xl border bg-card text-sm text-muted-foreground">
          No exam results yet.
        </div>
      ) : (
        <div className="space-y-3">
          {examResults.map(({ exam, result }) => {
            const pct      = result!.marks !== null ? Math.round((result!.marks! / exam.maxMarks) * 100) : 0;
            const grade    = result!.grade ?? "—";
            const gradeColor =
              grade === "A+" ? "text-emerald-600" :
              grade === "A"  ? "text-blue-600"    :
              grade === "B+" ? "text-blue-500"    :
              grade === "B"  ? "text-amber-600"   :
                               "text-red-500";
            return (
              <div key={exam.id} className="rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{exam.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {exam.subject} · {format(new Date(exam.date), "dd MMM yyyy")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold">
                      {result!.marks !== null ? result!.marks : "—"}<span className="text-base text-muted-foreground">/{exam.maxMarks}</span>
                    </p>
                    <p className={cn("text-sm font-semibold", gradeColor)}>{grade}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{pct}%</span>
                    {result!.rank && <span className="flex items-center gap-1"><Trophy className="h-3 w-3 text-amber-500" /> Rank {result!.rank}</span>}
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className={cn("h-full rounded-full",
                      pct>=80?"bg-emerald-500":pct>=60?"bg-blue-500":pct>=40?"bg-amber-500":"bg-red-500"
                    )} style={{ width:`${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}