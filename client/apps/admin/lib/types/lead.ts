export type ActivityType = "CALL" | "MESSAGE" | "NOTE" | "EMAIL" | "STAGE_CHANGE";

export type LeadSource = "WEBSITE" | "REFERRAL" | "SOCIAL_MEDIA" | "WALK_IN" | "PHONE" | "OTHER";

export type LeadStage = "NEW" | "CONTACTED" | "DEMO_SCHEDULED" | "DEMO_DONE" | "NEGOTIATION" | "ENROLLED" | "LOST";

export interface LeadActivity {
  id:         string;
  type:       string;
  content:    string;
  createdAt:  string;
  createdBy?: string;
}

/** @deprecated use LeadActivity */
export type Activity = LeadActivity;

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
  standard?:           string;
  boardName?:          string;
  batchId?:            string;
  batchName?:          string;
}

export interface Admission {
  id:               string;
  leadId?:          string;
  studentName:      string;
  email:            string;
  phone:            string;
  grade:            string;
  subjects:         string[];
  feeAmount:        number;
  feePaid:          number;
  admissionNumber?: string;
  status:           "PENDING_DOCS" | "DOCS_SUBMITTED" | "FEE_PENDING" | "CONFIRMED" | "CANCELLED";
  documents:        { name: string; required: boolean; submitted: boolean }[];
  createdAt:        string;
  enrolledAt?:      string;
}
