"use client";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  Invoice, Payment, FeeStructure, InvoiceStatus,
  NotificationLog, NotificationTemplate, InstituteUser, PaymentMode,
} from "@/lib/types/finance";

// // ── Seed Data ──────────────────────────────────────────────────
// const SEED_FEE_STRUCTURES: FeeStructure[] = [
//   {
//     id: "fs-001", name: "JEE Foundation 10th", course: "JEE Foundation",
//     grade: "10th", totalAmount: 48000, isActive: true, createdAt: "2024-06-01T00:00:00Z",
//     installments: [
//       { id: "i-1", label: "Term 1", amount: 16000, dueDate: "2024-06-15" },
//       { id: "i-2", label: "Term 2", amount: 16000, dueDate: "2024-10-15" },
//       { id: "i-3", label: "Term 3", amount: 16000, dueDate: "2025-02-15" },
//     ],
//   },
//   {
//     id: "fs-002", name: "NEET Dropper Batch", course: "NEET",
//     grade: "Dropper", totalAmount: 72000, isActive: true, createdAt: "2024-06-01T00:00:00Z",
//     installments: [
//       { id: "i-4", label: "Registration", amount: 5000,  dueDate: "2024-06-01" },
//       { id: "i-5", label: "Term 1",       amount: 22334, dueDate: "2024-07-01" },
//       { id: "i-6", label: "Term 2",       amount: 22333, dueDate: "2024-12-01" },
//       { id: "i-7", label: "Term 3",       amount: 22333, dueDate: "2025-04-01" },
//     ],
//   },
//   {
//     id: "fs-003", name: "11th Science Full Year", course: "Science",
//     grade: "11th", totalAmount: 54000, isActive: true, createdAt: "2024-05-01T00:00:00Z",
//     installments: [
//       { id: "i-8", label: "Term 1", amount: 27000, dueDate: "2024-07-01" },
//       { id: "i-9", label: "Term 2", amount: 27000, dueDate: "2025-01-01" },
//     ],
//   },
// ];

// const SEED_INVOICES: Invoice[] = [
//   {
//     id: "inv-001", invoiceNo: "INV-2024-001", studentId: "s-001",
//     studentName: "Aarav Sharma", grade: "10th",
//     description: "JEE Foundation 10th — Full Year",
//     amount: 48000, paid: 48000, status: "PAID",
//     dueDate: "2024-06-15", createdAt: "2024-06-01T00:00:00Z",
//     payments: [
//       { id: "p-1", amount: 16000, mode: "UPI",           date: "2024-06-10", reference: "UPI-123456", recordedBy: "Rahul Verma" },
//       { id: "p-2", amount: 16000, mode: "BANK_TRANSFER", date: "2024-10-12", reference: "NEFT-789012", recordedBy: "Rahul Verma" },
//       { id: "p-3", amount: 16000, mode: "UPI",           date: "2025-02-14", reference: "UPI-345678", recordedBy: "Sneha Iyer" },
//     ],
//   },
//   {
//     id: "inv-002", invoiceNo: "INV-2024-002", studentId: "s-002",
//     studentName: "Priya Patel", grade: "11th",
//     description: "11th Science Full Year — Term 1 + Term 2",
//     amount: 54000, paid: 27000, status: "PARTIAL",
//     dueDate: "2025-01-15", createdAt: "2024-07-01T00:00:00Z",
//     payments: [
//       { id: "p-4", amount: 27000, mode: "CASH", date: "2024-07-20", reference: "CASH-001", recordedBy: "Rahul Verma" },
//     ],
//   },
//   {
//     id: "inv-003", invoiceNo: "INV-2024-003", studentId: "s-003",
//     studentName: "Rohan Mehta", grade: "9th",
//     description: "Math Batch A — Annual Fee",
//     amount: 36000, paid: 18000, status: "OVERDUE",
//     dueDate: "2025-01-01", createdAt: "2024-06-10T00:00:00Z",
//     payments: [
//       { id: "p-5", amount: 18000, mode: "CASH", date: "2024-06-15", reference: "CASH-002", recordedBy: "Sneha Iyer" },
//     ],
//   },
//   {
//     id: "inv-004", invoiceNo: "INV-2024-004", studentId: "s-004",
//     studentName: "Sneha Joshi", grade: "12th",
//     description: "JEE + NEET Combined — Full Year",
//     amount: 72000, paid: 72000, status: "PAID",
//     dueDate: "2024-07-01", createdAt: "2024-05-20T00:00:00Z",
//     payments: [
//       { id: "p-6", amount: 36000, mode: "CHEQUE",        date: "2024-06-01", reference: "CHQ-101", recordedBy: "Rahul Verma" },
//       { id: "p-7", amount: 36000, mode: "BANK_TRANSFER", date: "2024-12-05", reference: "NEFT-202", recordedBy: "Rahul Verma" },
//     ],
//   },
//   {
//     id: "inv-005", invoiceNo: "INV-2024-005", studentId: "s-005",
//     studentName: "Aryan Singh", grade: "10th",
//     description: "Math Batch A — Term 1",
//     amount: 36000, paid: 0, status: "PENDING",
//     dueDate: "2025-03-01", createdAt: "2024-06-01T00:00:00Z",
//     payments: [],
//   },
//   {
//     id: "inv-006", invoiceNo: "INV-2024-006", studentId: "s-006",
//     studentName: "Kavya Nair", grade: "11th",
//     description: "NEET Bio-Chem Batch — Full Year",
//     amount: 54000, paid: 54000, status: "PAID",
//     dueDate: "2024-09-01", createdAt: "2024-08-01T00:00:00Z",
//     payments: [
//       { id: "p-8", amount: 54000, mode: "BANK_TRANSFER", date: "2024-08-10", reference: "NEFT-303", recordedBy: "Sneha Iyer" },
//     ],
//   },
// ];

// const SEED_NOTIFICATIONS: NotificationLog[] = [
//   { id: "n-001", channel: "WHATSAPP", to: "9876543210", studentId: "s-001",
//     body: "Dear Suresh ji, Aarav's fees for Term 2 have been received. Amount: ₹16,000. Thank you!", status: "SENT", sentAt: "2024-10-12T14:30:00Z" },
//   { id: "n-002", channel: "SMS", to: "9765432109", studentId: "s-002",
//     body: "Reminder: Priya's Term 2 fee of ₹27,000 is due on 15 Jan 2025. Please pay at the earliest.", status: "SENT", sentAt: "2025-01-10T10:00:00Z" },
//   { id: "n-003", channel: "EMAIL", to: "rohan@gmail.com", studentId: "s-003",
//     subject: "Fee Overdue Notice — CoachGenie",
//     body: "Dear Vijay ji, Rohan's installment of ₹18,000 is overdue since 1 Jan 2025. Please clear at earliest.", status: "SENT", sentAt: "2025-01-15T09:00:00Z" },
//   { id: "n-004", channel: "WHATSAPP", to: "9543210987", studentId: "s-005",
//     body: "Hi, this is a reminder that Aryan's fee payment of ₹36,000 is pending. Due: 1 Mar 2025.", status: "FAILED", sentAt: "2025-02-20T11:00:00Z" },
// ];

// const SEED_TEMPLATES: NotificationTemplate[] = [
//   {
//     id: "tpl-001", name: "Payment Received", channel: "WHATSAPP", isActive: true,
//     createdAt: "2024-06-01T00:00:00Z",
//     variables: ["parentName", "studentName", "amount", "term"],
//     body: "Dear {{parentName}} ji, {{studentName}}'s fees for {{term}} have been received. Amount: ₹{{amount}}. Thank you!",
//   },
//   {
//     id: "tpl-002", name: "Fee Reminder", channel: "SMS", isActive: true,
//     createdAt: "2024-06-01T00:00:00Z",
//     variables: ["studentName", "amount", "dueDate"],
//     body: "Reminder: {{studentName}}'s fee of ₹{{amount}} is due on {{dueDate}}. Please pay at the earliest.",
//   },
//   {
//     id: "tpl-003", name: "Fee Overdue", channel: "EMAIL", isActive: true,
//     createdAt: "2024-06-01T00:00:00Z",
//     subject: "Fee Overdue Notice — CoachGenie",
//     variables: ["parentName", "studentName", "amount", "dueDate"],
//     body: "Dear {{parentName}} ji,\n\n{{studentName}}'s installment of ₹{{amount}} is overdue since {{dueDate}}. Please clear at earliest.\n\nRegards,\nCoachGenie Team",
//   },
//   {
//     id: "tpl-004", name: "Demo Confirmation", channel: "WHATSAPP", isActive: true,
//     createdAt: "2024-06-01T00:00:00Z",
//     variables: ["studentName", "date", "time", "teacher"],
//     body: "Hi! {{studentName}}'s demo class is confirmed for {{date}} at {{time}} with {{teacher}}. See you there!",
//   },
// ];

// const SEED_USERS: InstituteUser[] = [
//   { id: "u-001", name: "Rahul Verma",    email: "admin@demo.com",   role: "SUPER_ADMIN", status: "ACTIVE",  joinedAt: "2024-01-01T00:00:00Z", lastLogin: "2025-04-26T08:00:00Z" },
//   { id: "u-002", name: "Sneha Iyer",     email: "sneha@demo.com",   role: "COACH",       status: "ACTIVE",  joinedAt: "2024-02-15T00:00:00Z", lastLogin: "2025-04-25T17:30:00Z" },
//   { id: "u-003", name: "Anita Kulkarni", email: "anita@demo.com",   role: "COACH",       status: "ACTIVE",  joinedAt: "2024-03-01T00:00:00Z", lastLogin: "2025-04-24T12:00:00Z" },
//   { id: "u-004", name: "Raj Kulkarni",   email: "raj@demo.com",     role: "ADMIN",       status: "INVITED", joinedAt: "2025-04-01T00:00:00Z" },
// ];

// ── Store ──────────────────────────────────────────────────────
interface FinanceStore {
  invoices:      Invoice[];
  feeStructures: FeeStructure[];
  notifications: NotificationLog[];
  templates:     NotificationTemplate[];
  users:         InstituteUser[];

  // Invoices
  addInvoice:    (inv: Omit<Invoice, "id" | "invoiceNo" | "createdAt" | "payments" | "paid" | "status">) => Invoice;
  recordPayment: (invoiceId: string, payment: Omit<Payment, "id">) => void;

  // Fee structures
  addFeeStructure:    (fs: Omit<FeeStructure, "id" | "createdAt">) => FeeStructure;
  updateFeeStructure: (id: string, patch: Partial<FeeStructure>) => void;
  deleteFeeStructure: (id: string) => void;

  // Notifications
  addNotification: (log: Omit<NotificationLog, "id">) => void;

  // Templates
  addTemplate:    (t: Omit<NotificationTemplate, "id" | "createdAt">) => NotificationTemplate;
  updateTemplate: (id: string, patch: Partial<NotificationTemplate>) => void;
  deleteTemplate: (id: string) => void;

  // Users
  inviteUser:     (u: Omit<InstituteUser, "id" | "joinedAt" | "status">) => void;
  updateUserRole: (id: string, role: InstituteUser["role"]) => void;
  deactivateUser: (id: string) => void;
}

// export const useFinanceStore = create<FinanceStore>()(
//   immer((set) => ({
//     invoices:      SEED_INVOICES,
//     feeStructures: SEED_FEE_STRUCTURES,
//     notifications: SEED_NOTIFICATIONS,
//     templates:     SEED_TEMPLATES,
//     users:         SEED_USERS,
export const useFinanceStore = create<FinanceStore>()(
  immer((set) => ({
    invoices:      [],
    feeStructures: [],
    notifications: [],
    templates:     [],
    users:         [],

    addInvoice: (data) => {
      const count = SEED_INVOICES.length + 1;
      const inv: Invoice = {
        ...data,
        id:        `inv-${Date.now()}`,
        invoiceNo: `INV-${new Date().getFullYear()}-${String(count).padStart(3,"0")}`,
        createdAt: new Date().toISOString(),
        payments:  [],
        paid:      0,
        status:    "PENDING",
      };
      set(s => { s.invoices.unshift(inv); });
      return inv;
    },

    recordPayment: (invoiceId, payment) =>
      set(s => {
        const inv = s.invoices.find(i => i.id === invoiceId);
        if (!inv) return;
        inv.payments.push({ ...payment, id: `p-${Date.now()}` });
        inv.paid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
        inv.status = inv.paid >= inv.amount ? "PAID"
          : inv.paid > 0 ? "PARTIAL"
          : new Date(inv.dueDate) < new Date() ? "OVERDUE"
          : "PENDING";
      }),

    addFeeStructure: (data) => {
      const fs: FeeStructure = { ...data, id: `fs-${Date.now()}`, createdAt: new Date().toISOString() };
      set(s => { s.feeStructures.unshift(fs); });
      return fs;
    },

    updateFeeStructure: (id, patch) =>
      set(s => {
        const i = s.feeStructures.findIndex(f => f.id === id);
        if (i !== -1) Object.assign(s.feeStructures[i]!, patch);
      }),

    deleteFeeStructure: (id) =>
      set(s => { s.feeStructures = s.feeStructures.filter(f => f.id !== id); }),

    addNotification: (log) =>
      set(s => { s.notifications.unshift({ ...log, id: `n-${Date.now()}` }); }),

    addTemplate: (data) => {
      const t: NotificationTemplate = { ...data, id: `tpl-${Date.now()}`, createdAt: new Date().toISOString() };
      set(s => { s.templates.unshift(t); });
      return t;
    },

    updateTemplate: (id, patch) =>
      set(s => {
        const i = s.templates.findIndex(t => t.id === id);
        if (i !== -1) Object.assign(s.templates[i]!, patch);
      }),

    deleteTemplate: (id) =>
      set(s => { s.templates = s.templates.filter(t => t.id !== id); }),

    inviteUser: (data) =>
      set(s => {
        s.users.push({ ...data, id: `u-${Date.now()}`, joinedAt: new Date().toISOString(), status: "INVITED" });
      }),

    updateUserRole: (id, role) =>
      set(s => {
        const u = s.users.find(x => x.id === id);
        if (u) u.role = role;
      }),

    deactivateUser: (id) =>
      set(s => {
        const u = s.users.find(x => x.id === id);
        if (u) u.status = "INACTIVE";
      }),
  }))
);