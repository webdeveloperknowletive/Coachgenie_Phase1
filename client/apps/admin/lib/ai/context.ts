// import type { Student } from "@/lib/types/academic";
// import type { Invoice }  from "@/lib/types/finance";

// interface AcademicData {
//   students:   Student[];
//   batches:    { id:string; name:string; subject:string; studentIds:string[]; status:string }[];
//   attendance: { studentId:string; date:string; status:string }[];
//   exams:      { id:string; name:string; maxMarks:number; results:{ studentId:string; marks:number|null }[] }[];
// }

// interface FinanceData {
//   invoices: Invoice[];
// }

// export function buildInstituteContext(academic: AcademicData, finance: FinanceData): string {
//   const { students, batches, attendance, exams } = academic;
//   const { invoices } = finance;

//   // Students summary
//   const activeStudents = students.filter(s => s.status === "ACTIVE");
//   const studentLines   = students.map(s =>
//     `- ${s.name} (${s.grade}, ${s.status}): subjects=${s.subjects.join(",")}, fees paid ₹${s.fees.paid} of ₹${s.fees.total}`
//   ).join("\n");

//   // Batches summary
//   const batchLines = batches.map(b =>
//     `- ${b.name}: ${b.subject}, ${b.studentIds.length} students, status=${b.status}`
//   ).join("\n");

//   // Attendance summary (last 30 days)
//   const recentAttendance = attendance.slice(0, 150);
//   const presentCount = recentAttendance.filter(a => a.status === "PRESENT").length;
//   const totalCount   = recentAttendance.length;
//   const attendancePct = totalCount > 0 ? Math.round((presentCount/totalCount)*100) : 0;

//   // Exam summary
//   const examLines = exams.map(e => {
//     const results     = e.results.filter(r => r.marks !== null);
//     const avg         = results.length > 0
//       ? Math.round(results.reduce((s, r) => s + (r.marks ?? 0), 0) / results.length)
//       : null;
//     return `- ${e.name}: maxMarks=${e.maxMarks}, results=${results.length} students, avg=${avg ?? "pending"}`;
//   }).join("\n");

//   // Finance summary
//   const totalAmount    = invoices.reduce((s, i) => s + i.amount, 0);
//   const totalCollected = invoices.reduce((s, i) => s + i.paid, 0);
//   const overdue        = invoices.filter(i => i.status === "OVERDUE");
//   const pending        = invoices.filter(i => i.status === "PENDING" || i.status === "PARTIAL");

//   return `
// === INSTITUTE DATA CONTEXT ===

// STUDENTS (${students.length} total, ${activeStudents.length} active):
// ${studentLines}

// BATCHES (${batches.length} total):
// ${batchLines}

// ATTENDANCE (last ${totalCount} records): ${attendancePct}% present rate

// EXAMS:
// ${examLines}

// FINANCES:
// - Total invoiced: ₹${totalAmount.toLocaleString("en-IN")}
// - Total collected: ₹${totalCollected.toLocaleString("en-IN")} (${Math.round((totalCollected/totalAmount)*100)}%)
// - Overdue invoices: ${overdue.length} (${overdue.map(i=>`${i.studentName}: ₹${(i.amount-i.paid).toLocaleString("en-IN")}`).join(", ")})
// - Pending invoices: ${pending.length}

// === END CONTEXT ===
// `.trim();
// }

import type { Student } from "@/lib/types/academic";
import type { Invoice } from "@/lib/types/finance";

interface AcademicData {
  students: Student[];

  batches: {
    id: string;
    name: string;
    subject: string;
    studentIds: string[];
    status: string;
  }[];

  attendance: {
    studentId: string;
    date: string;
    status: string;
  }[];

  exams: {
    id: string;
    name: string;
    maxMarks: number;

    results: {
      studentId: string;
      marks: number | null;
    }[];
  }[];
}

interface FinanceData {
  invoices: Invoice[];
}

export function buildInstituteContext(
  academic: AcademicData,
  finance: FinanceData
): {
  summary: {
    totalStudents: number;
    activeStudents: number;
    attendancePercentage: number;
    totalInvoices: number;
    totalAmount: number;
    totalCollected: number;
    overdueInvoices: number;
    pendingInvoices: number;
  };
  students: Student[];
  batches: AcademicData["batches"];
  attendance: AcademicData["attendance"];
  exams: AcademicData["exams"];
  finance: {
    invoices: Invoice[];
  };
} {
  const { students, batches, attendance, exams } = academic;
  const { invoices } = finance;

  // Students summary
  const activeStudents = students.filter((s) => s.status === "ACTIVE");

  // Attendance summary
  const recentAttendance = attendance.slice(0, 150);

  const presentCount = recentAttendance.filter((a) => a.status === "PRESENT").length;
  const totalCount = recentAttendance.length;

  const attendancePct =
    totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  // Finance summary
  const totalAmount = invoices.reduce((s, i) => s + i.amount, 0);
  const totalCollected = invoices.reduce((s, i) => s + i.paid, 0);

  const overdue = invoices.filter((i) => i.status === "OVERDUE");
  const pending = invoices.filter(
    (i) => i.status === "PENDING" || i.status === "PARTIAL"
  );

  return {
    summary: {
      totalStudents: students.length,
      activeStudents: activeStudents.length,
      attendancePercentage: attendancePct,
      totalInvoices: invoices.length,
      totalAmount,
      totalCollected,
      overdueInvoices: overdue.length,
      pendingInvoices: pending.length,
    },
    students,
    batches,
    attendance: recentAttendance,
    exams,
    finance: {
      invoices,
    },
  };
}