"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, LayoutGrid, List, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLeadStore } from "@/lib/stores/leads.store";
import { LeadTable }    from "@/components/leads/LeadTable";
import { LeadKanban }   from "@/components/leads/LeadKanban";
import { LeadDrawer }   from "@/components/leads/LeadDrawer";
import { LeadForm, type LeadFormValues } from "@/components/leads/LeadForm";
import type { Lead, LeadStage, LeadSource } from "@/lib/types/lead";
import { STAGE_CONFIG, STAGES } from "@/lib/constants/leads";

type View = "table" | "kanban";

// ─── helpers ────────────────────────────────────────────────────────────────
const API = "/api/proxy"
const TENANT = process.env.NEXT_PUBLIC_TENANT_SUBDOMAIN ?? "demo";




function authHeaders(): HeadersInit {
  return { "Content-Type": "application/json" };
}


/** Map a raw API lead object → your frontend Lead shape */
function mapLead(raw: any): Lead {
  return {
    id:                  raw.id,
    name:                raw.full_name             ?? raw.name          ?? "",
    email:               raw.email                 ?? "",
    phone:               raw.phone                 ?? "",
    parentContactNumber: raw.parent_contact_number ?? "",
    schoolName:          raw.school_name           ?? "",
    source:              (raw.source?.toUpperCase()  as LeadSource)     ?? "WEBSITE",
    stage:               (raw.status?.toUpperCase()  as LeadStage)      ?? "NEW",
    subject:             raw.interested_course     ?? raw.subject       ?? "",
    grade:               raw.grade                 ?? "",
    parentName:          raw.parent_name           ?? "",
    notes:               raw.notes                 ?? "",
    createdAt:           raw.created_at            ?? new Date().toISOString(),
    updatedAt:           raw.updated_at            ?? new Date().toISOString(),
    activities:          raw.activities            ?? [],
    tags:                raw.tags                  ?? [],
    boardName:           raw.board_name            ?? "",
    batchId:             raw.batch_id              ?? "",
    batchName:           raw.batch_name            ?? raw.batch?.name   ?? "",
    subjects:            raw.subjects              ?? [],   // ← added
  };
}

/** Batch shape used in dropdown */
export interface Batch {
  id:   string;
  name: string;
  subjects: string[];
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function LeadsPage() {
  const { leads, setLeads, addLead, deleteLead, updateStage } = useLeadStore();

  const [view,         setView]         = useState<View>("table");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showForm,     setShowForm]     = useState(false);
  const [stageFilter,  setStageFilter]  = useState<LeadStage | "ALL">("ALL");
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState<string | null>(null);

  const [batches,        setBatches]        = useState<Batch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {

      const res = await fetch(`${API}/leads/`, { headers: authHeaders() });

      const res = await fetch(`${API}/leads`, { headers: authHeaders() });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      const raw: any[] = Array.isArray(json) ? json : (json.data ?? json.items ?? []);
      setLeads(raw.map(mapLead));
    } catch (err: any) {
      const msg = err.message ?? "Failed to load leads";
      setFetchError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [setLeads]);

  const fetchBatches = useCallback(async () => {
    setBatchesLoading(true);
    try {

      const res = await fetch(`${API}/batches/`, { headers: authHeaders() });

      const res = await fetch(`${API}/batches`, { headers: authHeaders() });

      if (!res.ok) return;
      const json = await res.json();
      const raw: any[] = Array.isArray(json) ? json : (json.data ?? json.items ?? []);
      setBatches(raw.map((b) => ({ id: String(b.id), name: b.name ?? b.batch_name ?? "", subjects: b.subjects ?? [] })));
    } catch {
      // silent
    } finally {
      setBatchesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchBatches();
  }, [fetchLeads, fetchBatches]);

  const filtered =
    stageFilter === "ALL"
      ? leads
      : leads.filter((l) => l.stage === stageFilter);

  // ── Create ────────────────────────────────────────────────────────────────
  async function handleCreate(data: LeadFormValues) {
    try {

      const res = await fetch(`${API}/leads/`, {

      const res = await fetch(`${API}/leads`, {

        method:  "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          full_name:             data.name,
          parent_name:           data.parentName,
          email:                 data.email,
          phone:                 data.phone,
          grade:                 data.grade,
          parent_contact_number: data.parentContactNumber,
          school_name:           data.schoolName,
          source:                data.source.toLowerCase(),
          interested_course:     data.subject,
          notes:                 data.notes ?? "",
          board_name:            data.boardName ?? "",
          batch_id:              data.batchId   || null,
          subjects:              data.subjects  ?? [],    // ← added
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Failed to create lead");
      }

      const json    = await res.json();
      const created = json.data ?? json;
      addLead(mapLead(created));
      toast.success("Lead created successfully!");
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    try {
      const res = await fetch(`${API}/leads/${id}`, {
        method:  "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete lead");
      deleteLead(id);
      toast.success("Lead deleted");
      if (selectedLead?.id === id) setSelectedLead(null);
    } catch {
      toast.error("Failed to delete lead");
    }
  }

  // ── Stage change ──────────────────────────────────────────────────────────
  async function handleStageChange(id: string, stage: LeadStage) {
    updateStage(id, stage);
    try {
      const res = await fetch(`${API}/leads/${id}`, {
        method:  "PATCH",
        headers: authHeaders(),
        body:    JSON.stringify({ status: stage.toLowerCase() }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Failed to update stage — refreshing");
      fetchLeads();
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading
              ? "Loading…"
              : `${leads.length} total · ${leads.filter((l) => l.stage === "ENROLLED").length} converted`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchLeads}
            disabled={loading}
            className="rounded-lg border p-2 hover:bg-accent transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>

          <div className="flex rounded-lg border overflow-hidden">
            {(["table", "kanban"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
                  view === v
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                {v === "table"
                  ? <List className="h-3.5 w-3.5" />
                  : <LayoutGrid className="h-3.5 w-3.5" />}
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* Stage filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStageFilter("ALL")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
            stageFilter === "ALL" ? "bg-foreground text-background" : "hover:bg-accent"
          )}
        >
          All ({leads.length})
        </button>
        {STAGES.map((s) => {
          const count = leads.filter((l) => l.stage === s).length;
          const cfg   = STAGE_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setStageFilter(stageFilter === s ? "ALL" : s)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                stageFilter === s
                  ? `${cfg.color} ${cfg.bg} ${cfg.border}`
                  : "hover:bg-accent"
              )}
            >
              {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && fetchError && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 py-16 text-center">
          <p className="text-sm text-destructive">{fetchError}</p>
          <button onClick={fetchLeads} className="rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors">
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !fetchError && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm font-medium">No leads found</p>
          <p className="text-xs text-muted-foreground">
            {stageFilter !== "ALL" ? "Try clearing the filter" : "Add your first lead to get started"}
          </p>
        </div>
      )}

      {/* View */}
      {!loading && !fetchError && filtered.length > 0 && (
        view === "table" ? (
          <LeadTable leads={filtered} onView={setSelectedLead} onDelete={handleDelete} />
        ) : (
          <LeadKanban leads={filtered} onCardClick={setSelectedLead} onStageChange={handleStageChange} />
        )
      )}

      {/* Lead drawer */}
      {selectedLead && (
        <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}

      {/* Create form modal */}
      {showForm && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl rounded-2xl border bg-background shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
              <h2 className="text-lg font-semibold">Add New Lead</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto">
              <LeadForm
                onSubmit={handleCreate}
                onCancel={() => setShowForm(false)}
                batches={batches}
                batchesLoading={batchesLoading}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
