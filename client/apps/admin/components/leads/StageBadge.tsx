import { STAGE_CONFIG } from "@/lib/constants/leads";
import type { LeadStage } from "@/lib/types/lead";
import { cn } from "@/lib/utils";

export function StageBadge({ stage }: { stage: LeadStage }) {
  // const cfg = STAGE_CONFIG[stage];
  const cfg = STAGE_CONFIG[stage as LeadStage] ?? STAGE_CONFIG["NEW"];
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
      cfg.color, cfg.bg, cfg.border
    )}>
      {cfg.label}
    </span>
  );
}
