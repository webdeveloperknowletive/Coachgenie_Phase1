export type StudentStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "GRADUATED";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "HOLIDAY";
export type BatchStatus = "ACTIVE" | "UPCOMING" | "COMPLETED";
export type ExamStatus = "UPCOMING" | "ONGOING" | "COMPLETED";

export interface Student {
  id:          string;
  name:        string;
  email:       string;
  phone:       string;
  parentName:  string;
  parentPhone: string;
  grade:       string;
  subjects:    string[];
  batchIds:    string[];
  status:      StudentStatus;
  avatar?:     string;
  address:     string;
  dob:         string;
  joinedAt:    string;
  fees: {
    total:  number;
    paid:   number;
    due:    number;
  };
  targetExam?: string;
}

export interface Batch {
  id:        string;
  name:      string;
  subject:   string;
  teacher:   string;
  grade:     string;
  status:    BatchStatus;
  schedule:  { day: string; time: string }[];
  studentIds:string[];
  startDate: string;
  endDate:   string;
  room:      string;
  maxSize:   number;
  syllabus:  SyllabusTopic[];
  subjects?: string[];
}

export interface SyllabusTopic {
  id:        string;
  title:     string;
  completed: boolean;
  sessions:  number;
}

export interface AttendanceRecord {
  id:        string;
  studentId: string;
  batchId:   string;
  date:      string;
  status:    AttendanceStatus;
  note?:     string;
}

export interface Exam {
  id:        string;
  name:      string;
  subject:   string;
  batchId:   string;
  date:      string;
  maxMarks:  number;
  duration:  number; // minutes
  status:    ExamStatus;
  results:   ExamResult[];
}

export interface ExamResult {
  studentId: string;
  marks:     number | null;
  rank?:     number;
  percentile?:number;
  grade?:    string;
}

export interface FeeRecord {
  id:          string;
  studentId:   string;
  description: string;
  amount:      number;
  type:        "CREDIT" | "DEBIT";
  date:        string;
  method?:     "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE";
  status:      "PAID" | "PENDING" | "OVERDUE";
}