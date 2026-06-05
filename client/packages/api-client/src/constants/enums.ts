export const AttendanceStatus = {
  PRESENT:  "PRESENT",
  ABSENT:   "ABSENT",
  LATE:     "LATE",
  EXCUSED:  "EXCUSED",
  HOLIDAY:  "HOLIDAY",
} as const;
export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export const SessionStatus = {
  SCHEDULED:  "SCHEDULED",
  ONGOING:    "ONGOING",
  COMPLETED:  "COMPLETED",
  CANCELLED:  "CANCELLED",
  RESCHEDULED:"RESCHEDULED",
} as const;
export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];

export const PaymentStatus = {
  PENDING:   "PENDING",
  PAID:      "PAID",
  OVERDUE:   "OVERDUE",
  REFUNDED:  "REFUNDED",
  CANCELLED: "CANCELLED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const SubjectType = {
  MATHEMATICS: "MATHEMATICS",
  SCIENCE:     "SCIENCE",
  ENGLISH:     "ENGLISH",
  HISTORY:     "HISTORY",
  HINDI:       "HINDI",
  MARATHI:     "MARATHI",
  PHYSICS:     "PHYSICS",
  CHEMISTRY:   "CHEMISTRY",
  BIOLOGY:     "BIOLOGY",
  COMPUTER:    "COMPUTER",
} as const;
export type SubjectType = (typeof SubjectType)[keyof typeof SubjectType];