"use client";
import { use } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAcademicStore } from "@/lib/stores/academic.store";

export default function StudentFeesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }    = use(params);
  const store     = useAcademicStore();
  const student   = store.students.find(s => s.id === id);
  const records   = store.feeRecords.filter(r => r.studentId === id);

  const feePercent = student
    ? Math.round((student.fees.paid / student.fees.total) * 100) || 0
    : 0;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/students/${id}`} className="rounded-lg p-2 hover:bg-accent text-muted-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{student?.name} — Fee Ledger</h1>
          <p className="text-sm text-muted-foreground">{records.length} transactions</p>
        </div>
      </div>

      {/* Summary */}
      {student && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:"Total Fee",  value:`₹${student.fees.total.toLocaleString("en-IN")}`, color:"" },
            { label:"Paid",       value:`₹${student.fees.paid.toLocaleString("en-IN")}`,  color:"text-emerald-600" },
            { label:"Due",        value:`₹${student.fees.due.toLocaleString("en-IN")}`,   color:student.fees.due>0?"text-red-500":"text-emerald-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={cn("text-xl font-bold mt-1", color)}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Ledger */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="border-b px-5 py-3">
          <h3 className="text-sm font-semibold">Transaction History</h3>
        </div>
        {records.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">No transactions.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                {["Date","Description","Method","Amount","Status"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map(rec => (
                <tr key={rec.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {format(new Date(rec.date), "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-3 font-medium">{rec.description}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{rec.method ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("flex items-center gap-1 font-semibold",
                      rec.type==="CREDIT"?"text-emerald-600":"text-foreground"
                    )}>
                      {rec.type==="CREDIT"
                        ? <TrendingUp className="h-3.5 w-3.5" />
                        : <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />}
                      ₹{rec.amount.toLocaleString("en-IN")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium",
                      rec.status==="PAID"?"bg-emerald-50 text-emerald-700 border-emerald-200":
                      rec.status==="PENDING"?"bg-amber-50 text-amber-700 border-amber-200":
                      "bg-red-50 text-red-600 border-red-200"
                    )}>
                      {rec.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}