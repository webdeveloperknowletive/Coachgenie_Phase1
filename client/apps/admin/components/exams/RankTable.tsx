"use client";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Student } from "@/lib/types/academic";
import type { ExamResult } from "@/lib/types/academic";

interface RankTableProps {
  students:  Student[];
  results:   ExamResult[];
  maxMarks:  number;
}

export function RankTable({ students, results, maxMarks }: RankTableProps) {
  const sorted = [...results]
    .filter(r => r.marks !== null)
    .sort((a, b) => (b.marks ?? 0) - (a.marks ?? 0))
    .map((r, i) => ({ ...r, rank: i+1 }));

  const rankColors: Record<number, string> = {
    1: "text-amber-500",
    2: "text-slate-400",
    3: "text-amber-700",
  };

  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-16">Rank</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Student</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Marks</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Grade</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Percentile</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Score Bar</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((result) => {
            const student = students.find(s => s.id === result.studentId);
            if (!student) return null;
            const pct    = Math.round(((result.marks ?? 0) / maxMarks) * 100);
            const gradeColor =
              result.grade==="A+"||result.grade==="A" ? "text-emerald-600" :
              result.grade==="B+"||result.grade==="B" ? "text-blue-600"    :
              result.grade==="C"                       ? "text-amber-600"   : "text-red-500";

            return (
              <tr key={result.studentId}
                className={cn("border-b last:border-0 transition-colors",
                  result.rank <= 3 ? "hover:bg-amber-50/50 dark:hover:bg-amber-950/20" : "hover:bg-muted/20"
                )}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {result.rank <= 3
                      ? <Trophy className={cn("h-4 w-4", rankColors[result.rank] ?? "")} />
                      : <span className="text-xs text-muted-foreground font-mono w-4">{result.rank}</span>
                    }
                    {result.rank <= 3 && (
                      <span className={cn("text-sm font-bold", rankColors[result.rank] ?? "")}>#{result.rank}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                      {student.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                    </div>
                    <span className="font-medium">{student.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-mono font-semibold">
                  {result.marks}<span className="text-muted-foreground text-xs">/{maxMarks}</span>
                </td>
                <td className={cn("px-4 py-3 text-center font-bold", gradeColor)}>{result.grade}</td>
                <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                  {result.percentile}th
                </td>
                <td className="px-4 py-3">
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden min-w-[80px]">
                    <div className={cn("h-full rounded-full",
                      pct>=80?"bg-emerald-500":pct>=60?"bg-blue-500":pct>=40?"bg-amber-500":"bg-red-500"
                    )} style={{width:`${pct}%`}} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}