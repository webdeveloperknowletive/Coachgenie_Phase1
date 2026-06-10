"use client";
import { cn } from "@/lib/utils";
import type { Student } from "@/lib/types/academic";
import type { ExamResult } from "@/lib/types/academic";

interface BulkResultEntryProps {
  students:  Student[];
  results:   ExamResult[];
  maxMarks:  number;
  onUpdate:  (studentId: string, marks: number | null) => void;
}

export function BulkResultEntry({ students, results, maxMarks, onUpdate }: BulkResultEntryProps) {
  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-8">#</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Student</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Marks (/{maxMarks})</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">%</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Grade</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, i) => {
            const result = results.find(r => r.studentId === student.id);
            const marks  = result?.marks ?? null;
            const pct    = marks !== null ? Math.round((marks / maxMarks) * 100) : null;
            const grade  = pct !== null
              ? pct>=90?"A+":pct>=80?"A":pct>=70?"B+":pct>=60?"B":pct>=50?"C":"D"
              : "—";
            const gradeColor =
              grade==="A+"||grade==="A" ? "text-emerald-600" :
              grade==="B+"||grade==="B" ? "text-blue-600"    :
              grade==="C"               ? "text-amber-600"   :
              grade==="D"               ? "text-red-500"     : "text-muted-foreground";

            return (
              <tr key={student.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{i+1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                      {student.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                    </div>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.grade}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={0}
                    max={maxMarks}
                    value={marks ?? ""}
                    onChange={e => onUpdate(student.id, e.target.value === "" ? null : Number(e.target.value))}
                    placeholder="—"
                    className="w-24 mx-auto block text-center h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  {pct !== null ? (
                    <div className="flex items-center gap-1.5 justify-center">
                      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                        <div className={cn("h-full rounded-full",
                          pct>=75?"bg-emerald-500":pct>=50?"bg-amber-500":"bg-red-500"
                        )} style={{width:`${pct}%`}} />
                      </div>
                      <span className="text-xs font-medium">{pct}%</span>
                    </div>
                  ) : <span className="text-muted-foreground">—</span>}
                </td>
                <td className={cn("px-4 py-3 text-center text-sm font-bold", gradeColor)}>{grade}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
