// import type { AdmissionPayment } from "@/app/admissions/page"; // or wherever you define it

// export interface Admission {
//   id: string;
//   studentName: string;
//   grade: string;
//   subjects: string[];
//   status: "PENDING_DOCS" | "DOCS_SUBMITTED" | "FEE_PENDING" | "CONFIRMED" | "CANCELLED";
//   documents: { required: boolean; submitted: boolean }[];
//   feeAmount: number;
//   feePaid: number;
//   createdAt: string;
//   payment?: AdmissionPayment; // ← add this
// }

// export type LeadStage =
//   | "NEW"
//   | "CONTACTED"
//   | "DEMO_SCHEDULED"
//   | "DEMO_DONE"
//   | "NEGOTIATION"
//   | "ENROLLED"
//   | "LOST";

// export type LeadSource =
//   | "WEBSITE"
//   | "REFERRAL"
//   | "SOCIAL_MEDIA"
//   | "WALK_IN"
//   | "PHONE"
//   | "OTHER";

// export type ActivityType = "CALL" | "MESSAGE" | "NOTE" | "EMAIL" | "STAGE_CHANGE";

// export interface Activity {
//   id:        string;
//   type:      ActivityType;
//   content:   string;
//   createdAt: string;
//   createdBy: string;
// }

// export interface Lead {
//   id:          string;
//   name:        string;
//   email:       string;
//   phone:       string;
//   parentContactNumber?: string;
//   schoolName?: string;
//   source:      LeadSource;
//   stage:       LeadStage;
//   subject:     string;
//   grade:       string;
//   parentName:  string;
//   notes:       string;
//   assignedTo:  string;
//   createdAt:   string;
//   updatedAt:   string;
//   activities:  Activity[];
//   tags:        string[];
// }

// export interface Admission {
//   id:            string;
//   leadId:        string;
//   studentName:   string;
//   email:         string;
//   phone:         string;
//   grade:         string;
//   subjects:      string[];
//   feeAmount:     number;
//   feePaid:       number;
//   status:        "PENDING_DOCS" | "DOCS_SUBMITTED" | "FEE_PENDING" | "CONFIRMED" | "CANCELLED";
//   documents: {
//     name:       string;
//     required:   boolean;
//     submitted:  boolean;
//   }[];
//   createdAt:     string;
//   enrolledAt?:   string;
// }

// lib/types/lead.ts
// Add these 4 fields to your existing Lead type/interface

// ── ADD to your Lead type ────────────────────────────────────────────────────
//
//   standard?:  string;
//   boardName?: string;
//   batchId?:   string;
//   batchName?: string;
//
// Full type for reference:

export type LeadSource =
  | "WEBSITE" | "REFERRAL" | "SOCIAL" | "WALK_IN"
  | "PHONE"   | "EMAIL"    | "WHATSAPP" | "OTHER";

export type LeadStage =
  | "NEW" | "CONTACTED" | "DEMO" | "ENROLLED" | "LOST";

export interface Lead {
  id:                  string;
  name:                string;
  email:               string;
  phone:               string;
  parentName:          string;
  parentContactNumber: string;
  schoolName:          string;
  source:              LeadSource;
  stage:               LeadStage;
  subject:             string;
  grade:               string;
  notes:               string;
  assignedTo:          string;
  createdAt:           string;
  updatedAt:           string;
  activities:          LeadActivity[];
  tags:                string[];
  // ── NEW ──────────────────────────────────────────────────────────────────
  standard?:           string;
  boardName?:          string;
  batchId?:            string;
  batchName?:          string;
}

export interface LeadActivity {
  id:        string;
  type:      string;
  content:   string;
  createdAt: string;
}