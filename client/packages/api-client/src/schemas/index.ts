import { z } from "zod";

// --- Common ---
export const PaginationSchema = z.object({
  page:  z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  total: z.number().int().nonnegative(),
});

// --- Student ---
export const StudentSchema = z.object({
  id:        z.string().uuid(),
  name:      z.string().min(2).max(100),
  email:     z.string().email(),
  phone:     z.string().optional(),
  grade:     z.string(),
  subjects:  z.array(z.string()),
  parentId:  z.string().uuid().optional(),
  tenantId:  z.string().uuid(),
  status:    z.enum(["ACTIVE","INACTIVE","SUSPENDED"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Student = z.infer<typeof StudentSchema>;

// --- Session ---
export const SessionSchema = z.object({
  id:        z.string().uuid(),
  studentId: z.string().uuid(),
  coachId:   z.string().uuid(),
  subject:   z.string(),
  startTime: z.string().datetime(),
  endTime:   z.string().datetime(),
  status:    z.enum(["SCHEDULED","ONGOING","COMPLETED","CANCELLED","RESCHEDULED"]),
  notes:     z.string().optional(),
  tenantId:  z.string().uuid(),
});
export type Session = z.infer<typeof SessionSchema>;

// --- Attendance ---
export const AttendanceSchema = z.object({
  id:        z.string().uuid(),
  studentId: z.string().uuid(),
  sessionId: z.string().uuid(),
  date:      z.string(),
  status:    z.enum(["PRESENT","ABSENT","LATE","EXCUSED","HOLIDAY"]),
  note:      z.string().optional(),
});
export type Attendance = z.infer<typeof AttendanceSchema>;

// --- Billing ---
export const InvoiceSchema = z.object({
  id:          z.string().uuid(),
  studentId:   z.string().uuid(),
  amount:      z.number().positive(),
  currency:    z.string().default("INR"),
  status:      z.enum(["PENDING","PAID","OVERDUE","REFUNDED","CANCELLED"]),
  dueDate:     z.string(),
  paidAt:      z.string().optional(),
  description: z.string(),
  tenantId:    z.string().uuid(),
});
export type Invoice = z.infer<typeof InvoiceSchema>;

// --- Auth ---
export const LoginSchema = z.object({
  email:    z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type LoginInput = z.infer<typeof LoginSchema>;