"use client";
import { useRouter } from "next/navigation";
import { X, Phone, Mail, User, GraduationCap, ExternalLink, BookOpen, Building2, Layers } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Lead } from "@/lib/types/lead";
import { StageBadge } from "./StageBadge";
import { STAGE_CONFIG, STAGES } from "@/lib/constants/leads";
import { useLeadStore } from "@/lib/stores/leads.store";

interface LeadDrawerProps {
  lead:    Lead;
  onClose: () => void;
}

export function LeadDrawer({ lead, onClose }: LeadDrawerProps) {
  const router      = useRouter();
  const updateStage = useLeadStore((s) => s.updateStage);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l bg-background shadow-2xl animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="flex items-start justify-between border-b p-5">
          <div>
            <h2 className="text-lg font-semibold">{lead.name}</h2>
            <p className="text-sm text-muted-foreground">
              {[lead.grade, lead.subject].filter(Boolean).join(" � ")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onClose(); router.push(`/leads/${lead.id}`); }}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent transition-colors"
              title="Open full page"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Stage pills */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Pipeline Stage</p>
            <div className="flex flex-wrap gap-1.5">
              {STAGES.filter((s) => s !== "LOST").map((s) => {
                const cfg    = STAGE_CONFIG[s];
                const active = lead.stage === s;
                return (
                  <button
                    key={s}
                    onClick={() => updateStage(lead.id, s)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium border transition-all",
                      active
                        ? `${cfg.color} ${cfg.bg} ${cfg.border} shadow-sm`
                        : "hover:bg-accent"
                    )}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* -- Contact Info ----------------------------------------------- */}
          <Section title="Contact">
            <div className="grid grid-cols-2 gap-3">
              <InfoCard icon={Mail}          label="Email"          value={lead.email} />
              <InfoCard icon={Phone}         label="Phone"          value={lead.phone} />
              <InfoCard icon={User}          label="Parent"         value={lead.parentName} />
              <InfoCard icon={Phone}         label="Parent Contact" value={lead.parentContactNumber} />
              <InfoCard icon={Building2}     label="School"         value={lead.schoolName} className="col-span-2" />
            </div>
          </Section>

          {/* -- Academic Info (NEW) ----------------------------------------- */}
          {/* <Section title="Academic Details">
            <div className="grid grid-cols-2 gap-3">
              <InfoCard icon={GraduationCap} label="Grade"          value={lead.grade} />
              <InfoCard icon={BookOpen}      label="Board"          value={lead.boardName} />
              <InfoCard icon={GraduationCap} label="Source"         value={lead.source?.replace(/_/g, " ")} />
              <InfoCard
                icon={Layers}
                label="Batch"
                value={lead.batchName || (lead.batchId ? "Assigned" : undefined)}
                className="col-span-2"
              />
            </div>
          </Section> */}
           <Section title="Academic Details">
            <div className="grid grid-cols-2 gap-3">
              <InfoCard icon={GraduationCap} label="Grade"  value={lead.grade} />
              <InfoCard icon={BookOpen}      label="Board"  value={lead.boardName} />
              <InfoCard icon={GraduationCap} label="Source" value={lead.source?.replace(/_/g, " ")} />
              <InfoCard
                icon={Layers}
                label="Batch"
                value={lead.batchName || (lead.batchId ? "Assigned" : undefined)}
                className="col-span-2"
              />
            </div>
            {(() => {
              const subjects = (Array.isArray(lead.subject) ? lead.subject : [lead.subject]).filter((s: string) => s && s !== "N/A");
              return subjects.length > 0 ? (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-1.5">Subjects</p>
                  <div className="flex flex-wrap gap-1.5">
                    {subjects.map((s: string) => (
                      <span key={s}
                        className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-xs font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
          </Section>

          {/* Tags */}
          {lead.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {lead.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Notes */}
          {lead.notes && (
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{lead.notes}</p>
            </div>
          )}

          {/* Recent activity */}
          {lead.activities?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Recent Activity</p>
              <div className="space-y-2">
                {lead.activities.slice(0, 3).map((act) => (
                  <div key={act.id} className="rounded-lg border bg-card p-3">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-xs font-medium">{act.type.replace(/_/g, " ")}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(act.createdAt), "dd MMM")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{act.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Added {format(new Date(lead.createdAt), "dd MMM yyyy")} � Updated {format(new Date(lead.updatedAt), "dd MMM yyyy")}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex gap-3">
          <button
            onClick={() => { onClose(); router.push(`/leads/${lead.id}`); }}
            className="flex-1 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            View Full Profile
          </button>
        </div>
      </div>
    </>
  );
}

// -- helpers -------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">{title}</p>
      {children}
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border bg-card p-3", className)}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-sm font-medium truncate">{value || "�"}</p>
    </div>
  );
}
