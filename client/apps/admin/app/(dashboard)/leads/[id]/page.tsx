"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useLeadStore }       from "@/lib/stores/leads.store";
import { StageBadge }         from "@/components/leads/StageBadge";
import { ActivityTimeline }   from "@/components/leads/ActivityTimeline";
import { STAGE_CONFIG, STAGES, SOURCE_LABELS } from "@/lib/constants/leads";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth.store";
import type { ActivityType, LeadStage } from "@/lib/types/lead";

// Add this line after the imports, before the component
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const store  = useLeadStore();
  const currentUser = useAuthStore((s) => s.user);
  const lead   = store.leads.find((l) => l.id === id);

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-lg font-semibold">Lead not found</p>
        <button onClick={() => router.push("/leads")}
          className="text-sm text-primary hover:underline">← Back to Leads</button>
      </div>
    );
  }

  // async function handleAddActivity(type: ActivityType, content: string) {
  //   await new Promise((r) => setTimeout(r, 400));
  //   store.addActivity(id, { type, content, createdBy: "Rahul Verma" });
  //   toast.success("Activity logged");
  // }
  async function handleAddActivity(type: ActivityType, content: string) {
    const createdBy = currentUser?.name ?? currentUser?.email ?? "Staff";
    store.addActivity(id, { type, content, createdBy });
    try {
      const res = await fetch(`${API}/leads/${lead.id}/activities`, {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify({ type: type.toLowerCase(), content, created_by: createdBy }),
      });
      if (!res.ok) throw new Error();
      toast.success("Activity logged");
    } catch {
      toast.error("Failed to save activity");
    }
  }

  function authHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    try {
      const raw      = localStorage.getItem("coachgenie-auth");
      const state    = raw ? JSON.parse(raw)?.state : null;
      const token    = state?.accessToken;
      const tenantId = state?.tenantId;
      if (token)    headers["Authorization"] = `Bearer ${token}`;
      if (tenantId) headers["X-Tenant-Id"]   = tenantId;
    } catch {}
    return headers;
  }

  async function handleConvert() {
    console.log("handleConvert called, lead id:", lead.id);
    try {
      console.log("making admission POST request");
      const res = await fetch("/api/admissions", {
        method:  "POST",
        headers: authHeaders(),
        // body: JSON.stringify({
        //   lead_id:      lead.id,
        //   student_name: lead.name,
        //   grade:        lead.grade,
        //   subjects:     lead.subject ? [lead.subject] : [],
        //   status:       "PENDING_DOCS",
        //   documents: [
        //     { name: "Aadhar Card",        required: true, submitted: false },
        //     { name: "Previous Marksheet", required: true, submitted: false },
        //     { name: "Passport Photo",     required: true, submitted: false },
        //   ],
        // }),
        body: JSON.stringify({
        lead_id:      lead.id,
        student_name: lead.name,
        grade:        lead.grade,
        board_name:   lead.boardName   || undefined,
        batch_id:     lead.batchId     || undefined,
        batch_name:   lead.batchName   || undefined,
        phone:        lead.phone       || undefined,
        email:        lead.email       || undefined,
        parent_name:  lead.parentName  || undefined,
        parent_phone: lead.parentContactNumber || undefined,
        school_name:  lead.schoolName  || undefined,
        subjects:     lead.subjects?.length ? lead.subjects : lead.subject ? [lead.subject] : [],
        status:       "CONFIRMED",
        documents: [
          { name: "Aadhar Card",        required: true,  submitted: false },
          { name: "Previous Marksheet", required: true,  submitted: false },
          { name: "Passport Photo",     required: true,  submitted: false },
        ],
      }),
      });
    //   const result = await res.json();
    //   if (!res.ok) throw new Error(result?.detail ?? "Failed to create admission");
    //   await fetch(`${API}/leads/${lead.id}`, {
    //   method:  "PATCH",
    //   headers: authHeaders(),
    //   body:    JSON.stringify({ status: "enrolled" }),
    // });
    const result = await res.json();
if (!res.ok) throw new Error(result?.detail ?? "Failed to create admission");

const patchRes = await fetch(`${API}/leads/${lead.id}`, {
  method:  "PATCH",
  headers: authHeaders(),
  body:    JSON.stringify({ status: "enrolled" }),
});
console.log("Lead PATCH status:", patchRes.status);
const patchJson = await patchRes.json().catch(() => ({}));
console.log("Lead PATCH response:", JSON.stringify(patchJson));


    store.updateStage(lead.id, "ENROLLED");
    toast.success("Lead converted to admission!");
    router.push(`/admissions/${result.data.id}`);
    } catch (err: any) {
      toast.error(err?.message || "Could not convert lead. Please try again.");
    }
  }

  // function handleDelete() {
  //   store.deleteLead(id);
  //   toast.success("Lead deleted");
  //   router.push("/leads");
  // }
  async function handleDelete() {
    try {
      const res = await fetch(`${API}/leads/${lead.id}`, {
        method:  "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      store.deleteLead(id);
      toast.success("Lead deleted");
      router.push("/leads");
    } catch {
      toast.error("Failed to delete lead");
    }
  }

  // const isEnrolled      = lead.stage === "ENROLLED";
  // const alreadyAdmitted = store.admissions.some((a) => a.leadId === lead.id);
  const alreadyAdmitted = lead.stage === "ENROLLED" ||
    store.admissions.some(
      (a) => a.leadId === lead.id || (a as any).lead_id === lead.id
    );

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Back + header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => router.push("/leads")}
            className="mt-0.5 rounded-lg p-2 hover:bg-accent transition-colors text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{lead.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StageBadge stage={lead.stage} />
              <span className="text-sm text-muted-foreground">
                {[lead.grade, lead.standard, lead.subject].filter(Boolean).join(" · ")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {!alreadyAdmitted && (
            <button onClick={handleConvert}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors shadow-sm">
              <UserCheck className="h-4 w-4" /> Convert to Admission
            </button>
          )}
          <button onClick={handleDelete}
            className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* ── Left column ─────────────────────────────────────────────── */}
        <div className="space-y-4 lg:col-span-1">

          {/* Contact info */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold">Contact Info</h3>
            {[
              { label: "Email",          value: lead.email },
              { label: "Phone",          value: lead.phone },
              { label: "Parent",         value: lead.parentName },
              { label: "Parent Contact", value: lead.parentContactNumber },
              { label: "Source",         value: SOURCE_LABELS[lead.source] },
              { label: "Assigned To",    value: lead.assignedTo },
              { label: "Added",          value: format(new Date(lead.createdAt), "dd MMM yyyy") },
            ].map(({ label, value }) =>
              value ? (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-right max-w-[55%] truncate">{value}</span>
                </div>
              ) : null
            )}
          </div>

          {/* ── Academic Details (NEW) ──────────────────────────────── */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold">Academic Details</h3>
            {[
              { label: "School",    value: lead.schoolName },
              { label: "Grade",     value: lead.grade },
              { label: "Standard",  value: lead.standard },
              { label: "Board",     value: lead.boardName },
              { label: "Course",    value: lead.subject },
              { label: "Batch",     value: lead.batchName },
            ].map(({ label, value }) =>
              value ? (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-right max-w-[55%] truncate">
                    {label === "Batch" ? (
                      <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
                        {value}
                      </span>
                    ) : value}
                  </span>
                </div>
              ) : null
            )}
            {/* show placeholder if all academic fields empty */}
            {!lead.schoolName && !lead.grade && !lead.standard && !lead.boardName && !lead.subject && !lead.batchName && (
              <p className="text-xs text-muted-foreground">No academic details added.</p>
            )}
          </div>

          {/* Tags */}
          {lead.tags?.length > 0 && (
            <div className="rounded-xl border bg-card p-4">
              <h3 className="text-sm font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {lead.tags.map((t) => (
                  <span key={t} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {lead.notes && (
            <div className="rounded-xl border bg-card p-4">
              <h3 className="text-sm font-semibold mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground">{lead.notes}</p>
            </div>
          )}

          {/* Pipeline stage */}
          <div className="rounded-xl border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">Change Stage</h3>
            <div className="space-y-1.5">
              {STAGES.map((s) => {
                const cfg    = STAGE_CONFIG[s];
                const active = lead.stage === s;
                return (
                  <button
                    key={s}
                    // onClick={() => { store.updateStage(lead.id, s); toast.success(`Stage updated to ${cfg.label}`); }}
                    onClick={async () => {
                      store.updateStage(lead.id, s);
                      try {
                        const res = await fetch(`${API}/leads/${lead.id}`, {
                          method:  "PATCH",
                          headers: authHeaders(),
                          body:    JSON.stringify({ status: s.toLowerCase() }),
                        });
                        if (!res.ok) throw new Error();
                        toast.success(`Stage updated to ${cfg.label}`);
                      } catch {
                        toast.error("Failed to update stage");
                      }
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium border transition-all",
                      active
                        ? `${cfg.color} ${cfg.bg} ${cfg.border}`
                        : "hover:bg-accent text-muted-foreground"
                    )}
                  >
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      active ? cfg.color.replace("text-", "bg-") : "bg-muted-foreground/40"
                    )} />
                    {cfg.label}
                    {active && <span className="ml-auto text-[10px] opacity-70">Current</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right: activity timeline ────────────────────────────────── */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold mb-3">Activity Timeline</h3>
          <ActivityTimeline activities={lead.activities} onAdd={handleAddActivity} />
        </div>
      </div>
    </div>
  );
}