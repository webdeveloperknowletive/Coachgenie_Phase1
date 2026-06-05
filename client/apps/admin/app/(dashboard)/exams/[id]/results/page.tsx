"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useAcademicStore } from "@/lib/stores/academic.store";
import { BulkResultEntry } from "@/components/exams/BulkResultEntry";
import { useBulkResultEntry } from "@/hooks/useBulkResultEntry";
import type { ExamResult } from "@/lib/types/academic";

export default function ExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = use(params);
  const router  = useRouter();
  const store   = useAcademicStore();
  const exam    = store.exams.find(e => e.id === id);
  const [saving, setSaving] = useState(false);

  const batch    = store.batches.find(b => b.id === exam?.batchId);
  const students = store.students.filter(s => batch?.studentIds.includes(s.id));

  // Ensure all students have a result entry
  const initial: ExamResult[] = students.map(s => ({
    studentId: s.id,
    marks: exam?.results.find(r => r.studentId === s.id)?.marks ?? null,
  }));

  const { results, update, dirty, reset } = useBulkResultEntry(initial);

  if (!exam) return null;

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    store.saveResults(id, results);
    setSaving(false);
    toast.success("Results saved and ranked!");
    router.push(`/exams/${id}`);
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href={`/exams/${id}`} className="mt-1 rounded-lg p-2 hover:bg-accent text-muted-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Enter Results</h1>
            <p className="text-sm text-muted-foreground">{exam.name} · Max {exam.maxMarks} marks</p>
          </div>
        </div>
        <div className="flex gap-2">
          {dirty && (
            <button onClick={() => reset(initial)}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm hover:bg-accent transition-colors">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          )}
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
            {saving ? "Saving…" : <><Save className="h-4 w-4" /> Save & Rank</>}
          </button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs text-muted-foreground">
          Enter marks for each student. Leave blank for absent/not evaluated. Click "Save & Rank" to auto-calculate rankings and percentiles.
        </p>
      </div>

      <BulkResultEntry students={students} results={results} maxMarks={exam.maxMarks} onUpdate={update} />
    </div>
  );
}
