export type PaymentMode = "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE" | "CARD";
export type InvoiceStatus = "PAID" | "PENDING" | "OVERDUE" | "PARTIAL";

export interface FeeStructure {
  id:          string;
  name:        string;
  course:      string;
  grade:       string;
  totalAmount: number;
  installments: Installment[];
  isActive:    boolean;
  createdAt:   string;
}

export interface Installment {
  id:         string;
  label:      string;
  amount:     number;
  dueDate:    string;
}

export interface Invoice {
  id:            string;
  invoiceNo:     string;
  studentId:     string;
  studentName:   string;
  grade:         string;
  description:   string;
  amount:        number;
  paid:          number;
  status:        InvoiceStatus;
  dueDate:       string;
  payments:      Payment[];
  feeStructureId?:string;
  createdAt:     string;
}

export interface Payment {
  id:        string;
  amount:    number;
  mode:      PaymentMode;
  date:      string;
  reference: string;
  note?:     string;
  recordedBy:string;
}

export type NotificationChannel = "SMS" | "WHATSAPP" | "EMAIL";
export type NotificationStatus  = "SENT" | "FAILED" | "PENDING";

export interface NotificationLog {
  id:        string;
  channel:   NotificationChannel;
  to:        string;
  subject?:  string;
  body:      string;
  status:    NotificationStatus;
  sentAt:    string;
  studentId?:string;
}

export interface NotificationTemplate {
  id:        string;
  name:      string;
  channel:   NotificationChannel;
  subject?:  string;
  body:      string;
  variables: string[];
  isActive:  boolean;
  createdAt: string;
}

export interface InstituteUser {
  id:        string;
  name:      string;
  email:     string;
  role:      "SUPER_ADMIN" | "ADMIN" | "COACH";
  status:    "ACTIVE" | "INACTIVE" | "INVITED";
  joinedAt:  string;
  lastLogin?: string;
  avatar?:   string;
}
