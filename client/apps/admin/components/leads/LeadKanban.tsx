"use client";
import { useState } from "react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Phone, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Lead, LeadStage } from "@/lib/types/lead";
import { STAGE_CONFIG, STAGES } from "@/lib/constants/leads";
import { StageBadge } from "./StageBadge";

// ── Kanban Card ────────────────────────────────────────────────
function KanbanCard({ lead, onClick, overlay = false }: { lead: Lead; onClick: () => void; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-xl border bg-card p-3 shadow-sm cursor-pointer select-none",
        "hover:shadow-md hover:border-primary/30 transition-all",
        isDragging && "opacity-40 shadow-lg ring-2 ring-primary/30",
        overlay && "shadow-2xl rotate-1 scale-105 opacity-95"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{lead.name}</p>
          <p className="text-xs text-muted-foreground truncate">{lead.grade} · {lead.subject}</p>
        </div>
        <div
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-0.5 mt-0.5"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Phone className="h-3 w-3 shrink-0" />
        <span className="font-mono">{lead.phone}</span>
      </div>
      {lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {lead.tags.slice(0, 2).map((t) => (
            <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">{t}</span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
        <Clock className="h-2.5 w-2.5" />
        {format(new Date(lead.updatedAt), "dd MMM")}
      </div>
    </div>
  );
}

// ── Kanban Column ──────────────────────────────────────────────
function KanbanColumn({
  stage, leads, onCardClick,
}: { stage: LeadStage; leads: Lead[]; onCardClick: (lead: Lead) => void }) {
  const cfg = STAGE_CONFIG[stage];

  return (
    <div className="flex flex-col rounded-xl border bg-muted/30 min-h-[600px] w-64 shrink-0">
      <div className={cn("flex items-center justify-between rounded-t-xl px-4 py-3 border-b", cfg.bg)}>
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", cfg.color.replace("text-", "bg-"))} />
          <span className={cn("text-xs font-semibold", cfg.color)}>{cfg.label}</span>
        </div>
        <span className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
          cfg.bg, cfg.color, "ring-1", cfg.border
        )}>
          {leads.length}
        </span>
      </div>
      <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 p-3 space-y-3 overflow-y-auto">
          {leads.map((lead) => (
            <KanbanCard key={lead.id} lead={lead} onClick={() => onCardClick(lead)} />
          ))}
          {leads.length === 0 && (
            <div className="flex items-center justify-center h-24 rounded-lg border-2 border-dashed text-xs text-muted-foreground">
              Drop here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ── Main Board ─────────────────────────────────────────────────
interface LeadKanbanProps {
  leads:         Lead[];
  onCardClick:   (lead: Lead) => void;
  onStageChange: (leadId: string, newStage: LeadStage) => void;
}

export function LeadKanban({ leads, onCardClick, onStageChange }: LeadKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeLead = leads.find((l) => l.id === activeId);

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  }));

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;

    // Determine target stage — over.id can be a lead id or a stage id
    const targetLead  = leads.find((l) => l.id === over.id);
    const targetStage = (targetLead?.stage ?? over.id) as LeadStage;
    const sourceLead  = leads.find((l) => l.id === active.id);

    if (sourceLead && targetStage && sourceLead.stage !== targetStage) {
      onStageChange(active.id as string, targetStage);
    }
  }

  const byStage = (stage: LeadStage) => leads.filter((l) => l.stage === stage);

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            leads={byStage(stage)}
            onCardClick={onCardClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeLead && (
          <KanbanCard lead={activeLead} onClick={() => {}} overlay />
        )}
      </DragOverlay>
    </DndContext>
  );
}