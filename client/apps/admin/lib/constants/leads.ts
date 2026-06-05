import type { LeadStage, LeadSource } from "@/lib/types/lead";

export const STAGE_CONFIG: Record<LeadStage, { label: string; color: string; bg: string; border: string }> = {
  NEW:            { label: "New",            color: "text-slate-600",   bg: "bg-slate-100 dark:bg-slate-800",   border: "border-slate-300 dark:border-slate-600" },
  CONTACTED:      { label: "Contacted",      color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-950",      border: "border-blue-300 dark:border-blue-700" },
  DEMO_SCHEDULED: { label: "Demo Scheduled", color: "text-violet-600",  bg: "bg-violet-50 dark:bg-violet-950",  border: "border-violet-300 dark:border-violet-700" },
  DEMO_DONE:      { label: "Demo Done",      color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-950",    border: "border-amber-300 dark:border-amber-700" },
  NEGOTIATION:    { label: "Negotiation",    color: "text-orange-600",  bg: "bg-orange-50 dark:bg-orange-950",  border: "border-orange-300 dark:border-orange-700" },
  ENROLLED:       { label: "Enrolled",       color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950",border: "border-emerald-300 dark:border-emerald-700" },
  LOST:           { label: "Lost",           color: "text-red-600",     bg: "bg-red-50 dark:bg-red-950",        border: "border-red-300 dark:border-red-700" },
};

export const STAGES: LeadStage[] = [
  "NEW", "CONTACTED", "DEMO_SCHEDULED", "DEMO_DONE", "NEGOTIATION", "ENROLLED", "LOST",
];

export const SOURCE_LABELS: Record<LeadSource, string> = {
  WEBSITE:      "Website",
  REFERRAL:     "Referral",
  SOCIAL_MEDIA: "Social Media",
  WALK_IN:      "Walk-in",
  PHONE:        "Phone",
  OTHER:        "Other",
};