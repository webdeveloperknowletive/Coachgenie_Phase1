// "use client";
// import { useState } from "react";
// import { X, CheckCircle } from "lucide-react";
// import { toast } from "sonner";
// import { useAcademicStore } from "@/lib/stores/academic.store";
// import { cn } from "@/lib/utils";

// interface EnrollmentDialogProps {
//   studentId: string;
//   studentName: string;
//   onClose: () => void;
// }

// export function EnrollmentDialog({ studentId, studentName, onClose }: EnrollmentDialogProps) {
//   const { batches, students, enrollStudent } = useAcademicStore();
//   const student    = students.find(s => s.id === studentId);
//   const [selected, setSelected] = useState<string[]>(student?.batchIds ?? []);

//   function handleToggle(batchId: string) {
//     setSelected(prev =>
//       prev.includes(batchId) ? prev.filter(b => b !== batchId) : [...prev, batchId]
//     );
//   }

//   function handleSave() {
//     selected.forEach(batchId => enrollStudent(batchId, studentId));
//     toast.success(`Enrollment updated for ${studentName}`);
//     onClose();
//   }

//   return (
//     <>
//       <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
//       <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-2xl border bg-background shadow-2xl">
//         <div className="flex items-center justify-between border-b px-6 py-4">
//           <div>
//             <h2 className="font-semibold">Enroll in Batches</h2>
//             <p className="text-sm text-muted-foreground">{studentName}</p>
//           </div>
//           <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent transition-colors">
//             <X className="h-4 w-4" />
//           </button>
//         </div>
//         <div className="p-5 space-y-2 max-h-96 overflow-y-auto">
//           {batches.map(batch => {
//             const enrolled = selected.includes(batch.id);
//             return (
//               <label key={batch.id}
//                 className={cn(
//                   "flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all",
//                   enrolled ? "border-primary/40 bg-primary/5" : "hover:bg-muted/50"
//                 )}>
//                 <input type="checkbox" checked={enrolled} onChange={() => handleToggle(batch.id)}
//                   className="h-4 w-4 accent-primary" />
//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm font-medium">{batch.name}</p>
//                   <p className="text-xs text-muted-foreground">{batch.teacher} · {batch.grade} · {batch.room}</p>
//                   <p className="text-xs text-muted-foreground">{batch.schedule.map(s => `${s.day} ${s.time}`).join(", ")}</p>
//                 </div>
//                 <div className="text-right shrink-0">
//                   <p className="text-xs font-medium">{batch.studentIds.length}/{batch.maxSize}</p>
//                   <p className="text-xs text-muted-foreground">students</p>
//                 </div>
//                 {enrolled && <CheckCircle className="h-4 w-4 text-primary shrink-0" />}
//               </label>
//             );
//           })}
//         </div>
//         <div className="border-t p-4 flex justify-end gap-3">
//           <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm hover:bg-accent transition-colors">Cancel</button>
//           <button onClick={handleSave} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
//             Save Enrollment
//           </button>
//         </div>
//       </div>
//     </>
//   );
// }


"use client";
import { useState, useEffect } from "react";
import { X, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const API = "/api/proxy"

function authHeaders(): HeadersInit {
  let token: string | null = null;
  let tenantId: string | null = null;
  try {
    const raw   = localStorage.getItem("coachgenie-auth");
    const state = raw ? JSON.parse(raw)?.state : null;
    token    = state?.accessToken ?? null;
    tenantId = state?.tenantId    ?? null;
  } catch {}
  return {
    "Content-Type": "application/json",
    ...(token    ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantId ? { "X-Tenant-Id": tenantId }          : {}),
  };
}

interface EnrollmentDialogProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
}

export function EnrollmentDialog({ studentId, studentName, onClose }: EnrollmentDialogProps) {
  const [batches,        setBatches]        = useState<any[]>([]);
  const [enrolledIds,    setEnrolledIds]    = useState<Set<string>>(new Set());
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState<string | null>(null); // batchId being toggled

  // Fetch all batches + this student's current enrollments
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // All batches
        const bRes  = await fetch(`${API}/batches/?limit=100`, { headers: authHeaders() });
        const bJson = bRes.ok ? await bRes.json() : {};
        const allBatches: any[] = Array.isArray(bJson)
          ? bJson
          : (bJson.data ?? bJson.items ?? []);
        setBatches(allBatches);

        // Student's enrolled batches
        const eRes  = await fetch(`${API}/batches/by-student/${studentId}`, { headers: authHeaders() });
        const eJson = eRes.ok ? await eRes.json() : {};
        const enrolled: any[] = eJson.data ?? [];
        setEnrolledIds(new Set(enrolled.map((b: any) => String(b.id))));
      } catch (err) {
        toast.error("Failed to load batches");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [studentId]);

  async function handleToggle(batchId: string) {
    const isEnrolled = enrolledIds.has(batchId);
    setSaving(batchId);
    try {
      const res = await fetch(`${API}/batches/${batchId}/enroll/${studentId}`, {
        method:  isEnrolled ? "DELETE" : "POST",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? (isEnrolled ? "Failed to remove" : "Failed to enroll"));
      }
      setEnrolledIds(prev => {
        const next = new Set(prev);
        isEnrolled ? next.delete(batchId) : next.add(batchId);
        return next;
      });
      toast.success(isEnrolled ? "Removed from batch" : "Enrolled in batch");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-2xl border bg-background shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="font-semibold">Manage Batches</h2>
            <p className="text-sm text-muted-foreground">{studentName}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-2 max-h-96 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && batches.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No batches found.</p>
          )}

          {!loading && batches.map(batch => {
            const enrolled = enrolledIds.has(String(batch.id));
            const isSaving = saving === String(batch.id);
            return (
              <button
                key={batch.id}
                onClick={() => handleToggle(String(batch.id))}
                disabled={isSaving}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl border p-4 text-left transition-all disabled:opacity-60",
                  enrolled ? "border-primary/40 bg-primary/5" : "hover:bg-muted/50"
                )}
              >
                {isSaving
                  ? <RefreshCw className="h-4 w-4 animate-spin shrink-0 text-muted-foreground" />
                  : <div className={cn(
                      "h-4 w-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors",
                      enrolled ? "border-primary bg-primary" : "border-muted-foreground/40"
                    )}>
                      {enrolled && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{batch.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[batch.tutor_name, batch.academic_year, batch.room_or_link].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium">
                    {(batch.student_ids?.length ?? 0)}/{batch.capacity ?? "∞"}
                  </p>
                  <p className="text-xs text-muted-foreground">students</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
