// "use client";
// import { useEffect, useState } from "react";
// import Link from "next/link";
// import { Sparkles, ChevronRight, Plus } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { api } from "@/lib/api";

// interface Student {
//   id: string;
//   name: string;
//   grade: string;
//   subjects: string[];
// }

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
//   created_at: string;
// }

// export default function GrowthCardsPage() {
//   const [students, setStudents] = useState<Student[]>([]);
//   const [cards,    setCards]    = useState<Record<string, GrowthCard[]>>({});
//   const [loading,  setLoading]  = useState(true);

//   useEffect(() => {
//     async function load() {
//       try {
//         const [sRes, cRes] = await Promise.all([
//           api.get("/students/"),
//           api.get("/growth-cards/"),
//         ]);

//         const rawStudents = sRes.data?.data?.items ?? sRes.data?.data ?? sRes.data ?? [];
//         setStudents(rawStudents.map((s: any) => ({
//           id:       String(s.id),
//           name:     `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
//           grade:    s.current_class ?? "",
//           subjects: s.subjects ?? [],
//         })));

       
//         const rawCards: GrowthCard[] = cRes.data?.data ?? [];
//         const byStudent: Record<string, GrowthCard[]> = {};
//         rawCards.forEach(c => {
//           const sid = String(c.student_id);
//           if (!byStudent[sid]) byStudent[sid] = [];
//           byStudent[sid]!.push(c);
//         });
//         setCards(byStudent);
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     }
//     load();
//   }, []);

//   if (loading) return (
//     <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
//       {[...Array(6)].map((_, i) => (
//         <div key={i} className="rounded-xl border bg-card p-5 h-32 animate-pulse" />
//       ))}
//     </div>
//   );

//   return (
//     <div className="space-y-5">
//       <div>
//         <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
//           Growth Cards
//           <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
//             <Sparkles className="h-3 w-3" /> AI
//           </span>
//         </h1>
//         <p className="text-sm text-muted-foreground mt-0.5">
//           AI-generated performance summaries for each student
//         </p>
//       </div>

//       {students.length === 0 && (
//         <div className="flex flex-col items-center justify-center py-16 gap-2">
//           <p className="text-sm text-muted-foreground">No students found.</p>
//         </div>
//       )}

//       <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
//         {students.map((student, i) => {
//           const studentCards = cards[student.id] ?? [];
//           console.log("cards state:", cards);
//           console.log("students state:", students.map(s => s.id));
//           const latest       = studentCards[0];
//           const avgScore     = latest?.academic_score ?? null;

//           return (
//             <Link key={student.id} href={`/growth-cards/${student.id}`}
//               className="rounded-xl border bg-card p-5 hover:shadow-md hover:border-primary/20 transition-all group fade-in"
//               style={{ animationDelay: `${i * 50}ms` }}>
//               <div className="flex items-start justify-between mb-3">
//                 <div className="flex items-center gap-3">
//                   <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary shrink-0">
//                     {student.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
//                   </div>
//                   <div>
//                     <p className="font-semibold text-sm group-hover:text-primary transition-colors">{student.name}</p>
//                     <p className="text-xs text-muted-foreground">{student.grade}</p>
//                   </div>
//                 </div>
//                 <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-1" />
//               </div>

//               <div className="space-y-2">
//                 <div className="flex justify-between text-xs text-muted-foreground">
//                   <span>Avg Score</span>
//                   <span className={cn("font-semibold",
//                     avgScore === null     ? "text-muted-foreground" :
//                     avgScore >= 75        ? "text-emerald-600"      :
//                     avgScore >= 50        ? "text-amber-600"        : "text-red-500"
//                   )}>
//                     {avgScore !== null ? `${avgScore}%` : "No data"}
//                   </span>
//                 </div>
//                 {avgScore !== null && (
//                   <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
//                     <div className={cn("h-full rounded-full",
//                       avgScore >= 75 ? "bg-emerald-500" : avgScore >= 50 ? "bg-amber-500" : "bg-red-500"
//                     )} style={{ width: `${avgScore}%` }} />
//                   </div>
//                 )}
//                 <div className="flex justify-between text-xs text-muted-foreground">
//                   <span>{studentCards.length} cards</span>
//                   <span className="flex items-center gap-0.5 text-primary">
//                     {studentCards.length > 0
//                       ? <><Sparkles className="h-2.5 w-2.5" /> Card Ready</>
//                       : <><Plus className="h-2.5 w-2.5" /> Create Card</>
//                     }
//                   </span>
//                 </div>
//               </div>
//             </Link>
//           );
//         })}
//       </div>
//     </div>
//   );
// }


"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface Student {
  id: string;
  name: string;
  grade: string;
  subjects: string[];
}

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
  created_at: string;
}

export default function GrowthCardsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [cards,    setCards]    = useState<Record<string, GrowthCard[]>>({});
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sRes, cRes] = await Promise.all([
          api.get<{ data: any[] }>("/students/"),
          api.get<{ data: GrowthCard[] }>("/growth-cards/"),
        ]);

        // ✅ sRes is the raw JSON body, so sRes.data is the students array
        const rawStudents: any[] = sRes.data ?? [];
        setStudents(rawStudents.map((s: any) => ({
          id:       String(s.id),
          name:     `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
          grade:    s.current_class ?? "",
          subjects: s.subjects ?? [],
        })));

        // ✅ cRes is the raw JSON body, so cRes.data is the cards array
        const rawCards: GrowthCard[] = cRes.data ?? [];
        const byStudent: Record<string, GrowthCard[]> = {};
        rawCards.forEach(c => {
          const sid = String(c.student_id);
          if (!byStudent[sid]) byStudent[sid] = [];
          byStudent[sid]!.push(c);
        });
        setCards(byStudent);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-5 h-32 animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          Growth Cards
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3 w-3" /> AI
          </span>
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          AI-generated performance summaries for each student
        </p>
      </div>

      {students.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <p className="text-sm text-muted-foreground">No students found.</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {students.map((student, i) => {
          const studentCards = cards[student.id] ?? [];
          const latest       = studentCards[0];
          const avgScore     = latest?.academic_score ?? null;

          return (
            <Link key={student.id} href={`/growth-cards/${student.id}`}
              className="rounded-xl border bg-card p-5 hover:shadow-md hover:border-primary/20 transition-all group fade-in"
              style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {student.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm group-hover:text-primary transition-colors">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.grade}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-1" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Avg Score</span>
                  <span className={cn("font-semibold",
                    avgScore === null     ? "text-muted-foreground" :
                    avgScore >= 75        ? "text-emerald-600"      :
                    avgScore >= 50        ? "text-amber-600"        : "text-red-500"
                  )}>
                    {avgScore !== null ? `${avgScore}%` : "No data"}
                  </span>
                </div>
                {avgScore !== null && (
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className={cn("h-full rounded-full",
                      avgScore >= 75 ? "bg-emerald-500" : avgScore >= 50 ? "bg-amber-500" : "bg-red-500"
                    )} style={{ width: `${avgScore}%` }} />
                  </div>
                )}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{studentCards.length} cards</span>
                  <span className="flex items-center gap-0.5 text-primary">
                    {studentCards.length > 0
                      ? <><Sparkles className="h-2.5 w-2.5" /> Card Ready</>
                      : <><Plus className="h-2.5 w-2.5" /> Create Card</>
                    }
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}