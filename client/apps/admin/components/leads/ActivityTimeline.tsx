"use client";
import { useState } from "react";
import { Phone, MessageSquare, StickyNote, Mail, ArrowRight, Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Activity, ActivityType } from "@/lib/types/lead";

const TYPE_CONFIG: Record<ActivityType, { icon: React.ElementType; color: string; label: string }> = {
  CALL:         { icon: Phone,          color: "bg-blue-100 text-blue-600 dark:bg-blue-900",    label: "Call" },
  MESSAGE:      { icon: MessageSquare,  color: "bg-green-100 text-green-600 dark:bg-green-900", label: "Message" },
  NOTE:         { icon: StickyNote,     color: "bg-amber-100 text-amber-600 dark:bg-amber-900", label: "Note" },
  EMAIL:        { icon: Mail,           color: "bg-violet-100 text-violet-600 dark:bg-violet-900", label: "Email" },
  STAGE_CHANGE: { icon: ArrowRight,     color: "bg-slate-100 text-slate-600 dark:bg-slate-800", label: "Stage Change" },
};

interface ActivityTimelineProps {
  activities: Activity[];
  onAdd:      (type: ActivityType, content: string) => Promise<void>;
}

export function ActivityTimeline({ activities, onAdd }: ActivityTimelineProps) {
  const [type, setType]     = useState<ActivityType>("NOTE");
  const [content, setContent] = useState("");
  const [saving, setSaving]   = useState(false);

  async function handleAdd() {
    if (!content.trim()) return;
    setSaving(true);
    await onAdd(type, content.trim());
    setContent("");
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      {/* Add activity */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <p className="text-sm font-medium">Log Activity</p>
        <div className="flex gap-2 flex-wrap">
          {(["NOTE","CALL","MESSAGE","EMAIL"] as ActivityType[]).map((t) => {
            const cfg = TYPE_CONFIG[t];
            return (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                  type === t ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"
                )}
              >
                <cfg.icon className="h-3 w-3" />
                {cfg.label}
              </button>
            );
          })}
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          placeholder={`Add a ${TYPE_CONFIG[type].label.toLowerCase()}…`}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
        />
        <div className="flex justify-end">
          <button
            onClick={handleAdd}
            disabled={saving || !content.trim()}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            Log
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative space-y-4 pl-6 before:absolute before:left-[0.6rem] before:top-2 before:bottom-2 before:w-px before:bg-border">
        {activities.map((act) => {
          const cfg = TYPE_CONFIG[act.type];
          return (
            <div key={act.id} className="relative">
              <div className={cn("absolute -left-6 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-background", cfg.color)}>
                <cfg.icon className="h-2.5 w-2.5" />
              </div>
              <div className="rounded-lg border bg-card p-3 shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-medium">{act.createdBy}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(act.createdAt), "dd MMM, hh:mm a")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{act.content}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}