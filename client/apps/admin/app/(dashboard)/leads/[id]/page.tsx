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



const API = "/api/proxy";






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



  function authHeaders(): HeadersInit {
    return { "Content-Type": "application/json" };
  }





  async function handleAddActivity(type: ActivityType, content: string) {
    const createdBy = (currentUser?.first_name ?? currentUser?.last_name) ?? currentUser?.email ?? "Staff";
    store.addActivity(id, { type, content, createdBy });
    try {
      const res = await fetch(`${API}/leads/${lead!.id}/activities`, {
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









  async function handleConvert() {
  if (!lead) return;
  try {
    const res = await fetch(`${API}/admissions`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        lead_id:        lead.id,
        student_name:   lead.name,
        email:          lead.email,
        phone:          lead.phone,
        parent_name:    lead.parentName,
        parent_phone:   lead.parentContactNumber,
        school_name:    lead.schoolName,
        grade:          lead.grade,
        board_name:     lead.boardName,
        batch_id:       lead.batchId   || null,
        batch_name:     lead.batchName || null,
        subjects:       Array.isArray(lead.subject) ? lead.subject : [lead.subject].filter(Boolean),
        applied_course: Array.isArray(lead.subject) ? lead.subject[0] : lead.subject,
        status:         "PENDING_DOCS",
        documents: [
  { name: "Aadhar Card",         required: true,  submitted: false },
  { name: "Previous Marksheet",  required: true,  submitted: false },
  { name: "Passport Photo",      required: true,  submitted: false },
  { name: "Transfer Certificate",required: false, submitted: false },
  { name: "Address Proof",       required: false, submitted: false },
  { name: "Birth Certificate",   required: false, submitted: false },
],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail ?? "Failed to create admission");
    }

    const json      = await res.json();
    const admission = json.data ?? json;

    // Update lead stage to ENROLLED in the store + backend
    store.updateStage(lead.id, "ENROLLED");
    await fetch(`${API}/leads/${lead.id}`, {
      method:  "PATCH",
      headers: authHeaders(),
      body:    JSON.stringify({ status: "enrolled" }),
    });

    toast.success(`${lead.name} converted to admission!`);
    router.push(`/admissions/${admission.id}`);

  } catch (err: any) {
    toast.error(err.message ?? "Conversion failed");
  }
}

async function handleDelete() {
  try {
    const res = await fetch(`${API}/leads/${lead!.id}`, {
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
  



  const alreadyAdmitted = lead.stage === "ENROLLED" ||
    store.admissions.some(
      (a) => a.leadId === lead!.id || (a as any).lead_id === lead!.id
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

          {/* Academic Details */}


          {/* Academic Details */}

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
                      store.updateStage(lead!.id, s);
                      try {
                        const res = await fetch(`${API}/leads/${lead!.id}`, {
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
