// "use client";
// import { persist } from "zustand/middleware"; 
// import { create } from "zustand";
// import { immer } from "zustand/middleware/immer";
// import type {
//   Student, Batch, AttendanceRecord, Exam, ExamResult,
//   FeeRecord, AttendanceStatus,
// } from "@/lib/types/academic";

// // ── Seed Data (batches, exams, fees remain seeded; students come from DB) ──

// const SEED_BATCHES: Batch[] = [
//   {
//     id: "b-001", name: "Math Batch A", subject: "Mathematics", teacher: "Rahul Verma",
//     grade: "9th-10th", status: "ACTIVE", room: "Room 101", maxSize: 20,
//     studentIds: ["s-001", "s-003", "s-005"],
//     schedule: [{ day: "Monday", time: "4:00 PM" }, { day: "Wednesday", time: "4:00 PM" }, { day: "Friday", time: "4:00 PM" }],
//     startDate: "2024-06-01", endDate: "2025-03-31",
//     syllabus: [
//       { id: "sy-1", title: "Real Numbers",           completed: true,  sessions: 4 },
//       { id: "sy-2", title: "Polynomials",             completed: true,  sessions: 5 },
//       { id: "sy-3", title: "Linear Equations",        completed: true,  sessions: 6 },
//       { id: "sy-4", title: "Quadratic Equations",     completed: false, sessions: 5 },
//       { id: "sy-5", title: "Arithmetic Progressions", completed: false, sessions: 4 },
//       { id: "sy-6", title: "Triangles",               completed: false, sessions: 6 },
//     ],
//   },
//   {
//     id: "b-002", name: "Physics Batch A", subject: "Physics", teacher: "Sneha Iyer",
//     grade: "10th-12th", status: "ACTIVE", room: "Room 102", maxSize: 15,
//     studentIds: ["s-001", "s-004"],
//     schedule: [{ day: "Tuesday", time: "5:00 PM" }, { day: "Thursday", time: "5:00 PM" }, { day: "Saturday", time: "10:00 AM" }],
//     startDate: "2024-06-15", endDate: "2025-03-31",
//     syllabus: [
//       { id: "sy-7",  title: "Motion",       completed: true,  sessions: 5 },
//       { id: "sy-8",  title: "Force & Laws", completed: true,  sessions: 6 },
//       { id: "sy-9",  title: "Gravitation",  completed: false, sessions: 4 },
//       { id: "sy-10", title: "Work & Energy",completed: false, sessions: 5 },
//     ],
//   },
//   {
//     id: "b-003", name: "NEET Bio-Chem", subject: "Biology", teacher: "Anita Kulkarni",
//     grade: "11th-12th", status: "ACTIVE", room: "Room 103", maxSize: 18,
//     studentIds: ["s-002", "s-004", "s-006"],
//     schedule: [{ day: "Monday", time: "6:00 PM" }, { day: "Thursday", time: "6:00 PM" }],
//     startDate: "2024-07-01", endDate: "2025-04-30",
//     syllabus: [
//       { id: "sy-11", title: "Cell Biology",     completed: true,  sessions: 8 },
//       { id: "sy-12", title: "Plant Physiology", completed: false, sessions: 6 },
//       { id: "sy-13", title: "Human Physiology", completed: false, sessions: 10 },
//     ],
//   },
//   {
//     id: "b-004", name: "JEE Chemistry", subject: "Chemistry", teacher: "Raj Kulkarni",
//     grade: "12th", status: "UPCOMING", room: "Room 104", maxSize: 15,
//     studentIds: ["s-004"],
//     schedule: [{ day: "Wednesday", time: "7:00 PM" }, { day: "Saturday", time: "2:00 PM" }],
//     startDate: "2025-05-01", endDate: "2025-12-31",
//     syllabus: [],
//   },
// ];

// const SEED_EXAMS: Exam[] = [
//   {
//     id: "e-001", name: "Unit Test 1 — Mathematics", subject: "Mathematics",
//     batchId: "b-001", date: "2025-02-15", maxMarks: 50, duration: 90,
//     status: "COMPLETED",
//     results: [
//       { studentId: "s-001", marks: 45 },
//       { studentId: "s-003", marks: 38 },
//       { studentId: "s-005", marks: 29 },
//     ],
//   },
//   {
//     id: "e-002", name: "Mid Term — Physics", subject: "Physics",
//     batchId: "b-002", date: "2025-03-01", maxMarks: 100, duration: 180,
//     status: "COMPLETED",
//     results: [
//       { studentId: "s-001", marks: 82 },
//       { studentId: "s-004", marks: 91 },
//     ],
//   },
//   {
//     id: "e-003", name: "Unit Test 2 — Mathematics", subject: "Mathematics",
//     batchId: "b-001", date: "2025-04-10", maxMarks: 50, duration: 90,
//     status: "UPCOMING",
//     results: [],
//   },
//   {
//     id: "e-004", name: "NEET Mock 1 — Biology", subject: "Biology",
//     batchId: "b-003", date: "2025-04-20", maxMarks: 360, duration: 200,
//     status: "UPCOMING",
//     results: [],
//   },
// ];

// const SEED_FEE_RECORDS: FeeRecord[] = [
//   { id: "f-001", studentId: "s-001", description: "Term 1 Fee",     amount: 24000, type: "DEBIT",  date: "2024-06-01", method: "UPI",           status: "PAID" },
//   { id: "f-002", studentId: "s-001", description: "Term 1 Payment", amount: 24000, type: "CREDIT", date: "2024-06-05", method: "UPI",           status: "PAID" },
//   { id: "f-003", studentId: "s-001", description: "Term 2 Fee",     amount: 24000, type: "DEBIT",  date: "2024-12-01", method: "UPI",           status: "PAID" },
//   { id: "f-004", studentId: "s-001", description: "Term 2 Payment", amount: 24000, type: "CREDIT", date: "2024-12-10", method: "BANK_TRANSFER", status: "PAID" },
//   { id: "f-005", studentId: "s-002", description: "Term 1 Fee",     amount: 27000, type: "DEBIT",  date: "2024-07-15", status: "PAID" },
//   { id: "f-006", studentId: "s-002", description: "Term 1 Payment", amount: 27000, type: "CREDIT", date: "2024-07-20", method: "CASH",          status: "PAID" },
//   { id: "f-007", studentId: "s-002", description: "Term 2 Fee",     amount: 27000, type: "DEBIT",  date: "2025-01-15", status: "PENDING" },
// ];

// function generateAttendance(): AttendanceRecord[] {
//   const records: AttendanceRecord[] = [];
//   const statuses: AttendanceStatus[] = ["PRESENT","PRESENT","PRESENT","ABSENT","LATE"];
//   let counter = 0;
//   const sampleIds = ["s-001","s-002","s-003","s-004","s-005","s-006"];
//   sampleIds.forEach((studentId) => {
//     for (let i = 0; i < 30; i++) {
//       const date = new Date();
//       date.setDate(date.getDate() - i);
//       records.push({
//         id:        `att-${counter++}`,
//         studentId,
//         batchId:   "b-001",
//         date:      date.toISOString().split("T")[0]!,
//         status:    statuses[Math.floor(Math.random() * statuses.length)]!,
//       });
//     }
//   });
//   return records;
// }

// // ── Store interface ────────────────────────────────────────────
// interface AcademicStore {
//   students:   Student[];
//   batches:    Batch[];
//   attendance: AttendanceRecord[];
//   exams:      Exam[];
//   feeRecords: FeeRecord[];

//   // Students — DB-backed
//   setStudents:   (students: Student[]) => void;
//   addStudent:    (student: Student) => void;
//   updateStudent: (id: string, patch: Partial<Student>) => void;
//   deleteStudent: (id: string) => void;

//   // Batches — DB-backed
//   setBatches:    (batches: Batch[]) => void;
//   addBatch:      (batch: Batch) => void;
//   updateBatch:   (id: string, patch: Partial<Batch>) => void;
//   toggleSyllabus: (batchId: string, topicId: string) => void;
//   enrollStudent:  (batchId: string, studentId: string) => void;
//   addSyllabusTopic: (batchId: string, topic: { title: string; sessions: number }) => void;

//   // Attendance
//   markAttendance: (records: Omit<AttendanceRecord, "id">[]) => void;

//   // Exams
//   addExam:     (exam: Omit<Exam, "id" | "results">) => Exam;
//   saveResults: (examId: string, results: ExamResult[]) => void;

//   // Fees
//   addFeeRecord: (record: Omit<FeeRecord, "id">) => void;
// }

// // ── Store implementation ───────────────────────────────────────
// export const useAcademicStore = create<AcademicStore>()(
//   immer((set) => ({
//     students:   [],                      // ← starts empty, filled from DB
//     batches:    SEED_BATCHES,
//     attendance: generateAttendance(),
//     exams:      SEED_EXAMS,
//     feeRecords: SEED_FEE_RECORDS,

//     // ── Students ───────────────────────────────────────────────

//     /** Replace entire students array with DB response */
//     setStudents: (students) => {
//       set((s) => { s.students = students; });
//     },

//     /** Add single student returned from POST /students/ */
//     addStudent: (student) => {
//       set((s) => { s.students.unshift(student); });
//     },

//     /** Patch a student by id (PATCH /students/:id response) */
//     updateStudent: (id, patch) => {
//       set((s) => {
//         const i = s.students.findIndex((x) => x.id === id);
//         if (i !== -1) Object.assign(s.students[i]!, patch);
//       });
//     },

//     /** Remove student from store after DELETE /students/:id */
//     deleteStudent: (id) => {
//       set((s) => { s.students = s.students.filter((x) => x.id !== id); });
//     },

//     // ── Batches ────────────────────────────────────────────────

//     setBatches: (batches) => {
//       set((s) => { s.batches = batches; });
//     },

//     addBatch: (batch) => {
//       set((s) => { s.batches.unshift(batch); });
//     },

//     updateBatch: (id, patch) =>
//       set((s) => {
//         const i = s.batches.findIndex((b) => b.id === id);
//         if (i !== -1) Object.assign(s.batches[i]!, patch);
//       }),

//     toggleSyllabus: (batchId, topicId) =>
//       set((s) => {
//         const batch = s.batches.find((b) => b.id === batchId);
//         const topic = batch?.syllabus.find((t) => t.id === topicId);
//         if (topic) topic.completed = !topic.completed;
//       }),

//     enrollStudent: (batchId, studentId) =>
//       set((s) => {
//         const batch   = s.batches.find((b) => b.id === batchId);
//         const student = s.students.find((x) => x.id === studentId);
//         if (batch && !batch.studentIds.includes(studentId)) {
//           batch.studentIds.push(studentId);
//         }
//         if (student && !student.batchIds.includes(batchId)) {
//           student.batchIds.push(batchId);
//         }
//       }),
      
// addSyllabusTopic: (batchId, topic) =>
//   set((s) => {
//     const batch = s.batches.find((b) => b.id === batchId);
//     if (batch) {
//       batch.syllabus.push({
//         id: `sy-${Date.now()}`,
//         title: topic.title,
//         sessions: topic.sessions,
//         completed: false,
//       });
//     }
//   }),

//     // ── Attendance ─────────────────────────────────────────────

//     markAttendance: (records) =>
//       set((s) => {
//         records.forEach((rec) => {
//           const existing = s.attendance.findIndex(
//             (a) => a.studentId === rec.studentId && a.batchId === rec.batchId && a.date === rec.date
//           );
//           if (existing !== -1) {
//             Object.assign(s.attendance[existing]!, rec);
//           } else {
//             s.attendance.push({ ...rec, id: `att-${Date.now()}-${Math.random()}` });
//           }
//         });
//       }),

//     // ── Exams ──────────────────────────────────────────────────

//     addExam: (data) => {
//       const exam: Exam = { ...data, id: `e-${Date.now()}`, results: [] };
//       set((s) => { s.exams.unshift(exam); });
//       return exam;
//     },

//     saveResults: (examId, results) => {
//       set((s) => {
//         const exam = s.exams.find((e) => e.id === examId);
//         if (!exam) return;

//         const sorted = [...results]
//           .filter((r) => r.marks !== null)
//           .sort((a, b) => (b.marks ?? 0) - (a.marks ?? 0));

//         const ranked = results.map((r) => {
//           const rank       = sorted.findIndex((x) => x.studentId === r.studentId) + 1;
//           const percentile = r.marks !== null
//             ? Math.round(((sorted.length - rank) / sorted.length) * 100)
//             : undefined;
//           const pct   = r.marks !== null ? (r.marks / exam.maxMarks) * 100 : 0;
//           const grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B+" : pct >= 60 ? "B" : pct >= 50 ? "C" : "D";
//           return { ...r, rank: r.marks !== null ? rank : undefined, percentile, grade };
//         });

//         exam.results = ranked;
//         exam.status  = "COMPLETED";
//       });
//     },

//     // ── Fees ───────────────────────────────────────────────────

//     addFeeRecord: (record) =>
//       set((s) => {
//         s.feeRecords.unshift({ ...record, id: `f-${Date.now()}` });
//       }),
//   }))
// );

"use client";
import { persist } from "zustand/middleware";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  Student, Batch, AttendanceRecord, Exam, ExamResult,
  FeeRecord, AttendanceStatus,
} from "@/lib/types/academic";

const SEED_BATCHES: Batch[] = [
  {
    id: "b-001", name: "Math Batch A", subject: "Mathematics", teacher: "Rahul Verma",
    grade: "9th-10th", status: "ACTIVE", room: "Room 101", maxSize: 20,
    studentIds: ["s-001", "s-003", "s-005"],
    schedule: [{ day: "Monday", time: "4:00 PM" }, { day: "Wednesday", time: "4:00 PM" }, { day: "Friday", time: "4:00 PM" }],
    startDate: "2024-06-01", endDate: "2025-03-31",
    syllabus: [
      { id: "sy-1", title: "Real Numbers",           completed: true,  sessions: 4 },
      { id: "sy-2", title: "Polynomials",             completed: true,  sessions: 5 },
      { id: "sy-3", title: "Linear Equations",        completed: true,  sessions: 6 },
      { id: "sy-4", title: "Quadratic Equations",     completed: false, sessions: 5 },
      { id: "sy-5", title: "Arithmetic Progressions", completed: false, sessions: 4 },
      { id: "sy-6", title: "Triangles",               completed: false, sessions: 6 },
    ],
  },
  {
    id: "b-002", name: "Physics Batch A", subject: "Physics", teacher: "Sneha Iyer",
    grade: "10th-12th", status: "ACTIVE", room: "Room 102", maxSize: 15,
    studentIds: ["s-001", "s-004"],
    schedule: [{ day: "Tuesday", time: "5:00 PM" }, { day: "Thursday", time: "5:00 PM" }, { day: "Saturday", time: "10:00 AM" }],
    startDate: "2024-06-15", endDate: "2025-03-31",
    syllabus: [
      { id: "sy-7",  title: "Motion",        completed: true,  sessions: 5 },
      { id: "sy-8",  title: "Force & Laws",  completed: true,  sessions: 6 },
      { id: "sy-9",  title: "Gravitation",   completed: false, sessions: 4 },
      { id: "sy-10", title: "Work & Energy", completed: false, sessions: 5 },
    ],
  },
  {
    id: "b-003", name: "NEET Bio-Chem", subject: "Biology", teacher: "Anita Kulkarni",
    grade: "11th-12th", status: "ACTIVE", room: "Room 103", maxSize: 18,
    studentIds: ["s-002", "s-004", "s-006"],
    schedule: [{ day: "Monday", time: "6:00 PM" }, { day: "Thursday", time: "6:00 PM" }],
    startDate: "2024-07-01", endDate: "2025-04-30",
    syllabus: [
      { id: "sy-11", title: "Cell Biology",     completed: true,  sessions: 8  },
      { id: "sy-12", title: "Plant Physiology", completed: false, sessions: 6  },
      { id: "sy-13", title: "Human Physiology", completed: false, sessions: 10 },
    ],
  },
  {
    id: "b-004", name: "JEE Chemistry", subject: "Chemistry", teacher: "Raj Kulkarni",
    grade: "12th", status: "UPCOMING", room: "Room 104", maxSize: 15,
    studentIds: ["s-004"],
    schedule: [{ day: "Wednesday", time: "7:00 PM" }, { day: "Saturday", time: "2:00 PM" }],
    startDate: "2025-05-01", endDate: "2025-12-31",
    syllabus: [],
  },
];

const SEED_EXAMS: Exam[] = [
  {
    id: "e-001", name: "Unit Test 1 — Mathematics", subject: "Mathematics",
    batchId: "b-001", date: "2025-02-15", maxMarks: 50, duration: 90,
    status: "COMPLETED",
    results: [
      { studentId: "s-001", marks: 45 },
      { studentId: "s-003", marks: 38 },
      { studentId: "s-005", marks: 29 },
    ],
  },
  {
    id: "e-002", name: "Mid Term — Physics", subject: "Physics",
    batchId: "b-002", date: "2025-03-01", maxMarks: 100, duration: 180,
    status: "COMPLETED",
    results: [
      { studentId: "s-001", marks: 82 },
      { studentId: "s-004", marks: 91 },
    ],
  },
  {
    id: "e-003", name: "Unit Test 2 — Mathematics", subject: "Mathematics",
    batchId: "b-001", date: "2025-04-10", maxMarks: 50, duration: 90,
    status: "UPCOMING", results: [],
  },
  {
    id: "e-004", name: "NEET Mock 1 — Biology", subject: "Biology",
    batchId: "b-003", date: "2025-04-20", maxMarks: 360, duration: 200,
    status: "UPCOMING", results: [],
  },
];

const SEED_FEE_RECORDS: FeeRecord[] = [
  { id: "f-001", studentId: "s-001", description: "Term 1 Fee",     amount: 24000, type: "DEBIT",  date: "2024-06-01", method: "UPI",           status: "PAID"    },
  { id: "f-002", studentId: "s-001", description: "Term 1 Payment", amount: 24000, type: "CREDIT", date: "2024-06-05", method: "UPI",           status: "PAID"    },
  { id: "f-003", studentId: "s-001", description: "Term 2 Fee",     amount: 24000, type: "DEBIT",  date: "2024-12-01", method: "UPI",           status: "PAID"    },
  { id: "f-004", studentId: "s-001", description: "Term 2 Payment", amount: 24000, type: "CREDIT", date: "2024-12-10", method: "BANK_TRANSFER", status: "PAID"    },
  { id: "f-005", studentId: "s-002", description: "Term 1 Fee",     amount: 27000, type: "DEBIT",  date: "2024-07-15", status: "PAID"    },
  { id: "f-006", studentId: "s-002", description: "Term 1 Payment", amount: 27000, type: "CREDIT", date: "2024-07-20", method: "CASH",          status: "PAID"    },
  { id: "f-007", studentId: "s-002", description: "Term 2 Fee",     amount: 27000, type: "DEBIT",  date: "2025-01-15", status: "PENDING" },
];

function generateAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const statuses: AttendanceStatus[] = ["PRESENT","PRESENT","PRESENT","ABSENT","LATE"];
  let counter = 0;
  ["s-001","s-002","s-003","s-004","s-005","s-006"].forEach((studentId) => {
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      records.push({
        id: `att-${counter++}`, studentId, batchId: "b-001",
        date: date.toISOString().split("T")[0]!,
        status: statuses[Math.floor(Math.random() * statuses.length)]!,
      });
    }
  });
  return records;
}

interface AcademicStore {
  students:   Student[];
  batches:    Batch[];
  attendance: AttendanceRecord[];
  exams:      Exam[];
  feeRecords: FeeRecord[];

  setStudents:      (students: Student[]) => void;
  addStudent:       (student: Student) => void;
  updateStudent:    (id: string, patch: Partial<Student>) => void;
  deleteStudent:    (id: string) => void;

  setBatches:       (batches: Batch[]) => void;
  addBatch:         (batch: Batch) => void;
  updateBatch:      (id: string, patch: Partial<Batch>) => void;
  toggleSyllabus:   (batchId: string, topicId: string) => void;
  addSyllabusTopic: (batchId: string, topic: { title: string; sessions: number }) => void;
  markTopicComplete:(batchId: string, topicId: string) => void;
  enrollStudent:    (batchId: string, studentId: string) => void;

  markAttendance:   (records: Omit<AttendanceRecord, "id">[]) => void;

  addExam:          (exam: Omit<Exam, "id" | "results">) => Exam;
  saveResults:      (examId: string, results: ExamResult[]) => void;

  addFeeRecord:     (record: Omit<FeeRecord, "id">) => void;
}

export const useAcademicStore = create<AcademicStore>()(
  persist(                                          // ← outermost
    immer((set) => ({                               // ← inner
      students:   [],
      batches:    SEED_BATCHES,
      attendance: generateAttendance(),
      exams:      SEED_EXAMS,
      feeRecords: SEED_FEE_RECORDS,

      // Students
      setStudents:   (students) => set((s) => { s.students = students; }),
      addStudent:    (student)  => set((s) => { s.students.unshift(student); }),
      updateStudent: (id, patch) => set((s) => {
        const i = s.students.findIndex((x) => x.id === id);
        if (i !== -1) Object.assign(s.students[i]!, patch);
      }),
      deleteStudent: (id) => set((s) => { s.students = s.students.filter((x) => x.id !== id); }),

      // Batches
      setBatches: (batches) => set((s) => { s.batches = batches; }),
      addBatch:   (batch)   => set((s) => { s.batches.unshift(batch); }),
      updateBatch: (id, patch) => set((s) => {
        const i = s.batches.findIndex((b) => b.id === id);
        if (i !== -1) Object.assign(s.batches[i]!, patch);
      }),

      toggleSyllabus: (batchId, topicId) => set((s) => {
        const topic = s.batches.find((b) => b.id === batchId)
          ?.syllabus.find((t) => t.id === topicId);
        if (topic) topic.completed = !topic.completed;
      }),

      addSyllabusTopic: (batchId, topic) => set((s) => {
        const batch = s.batches.find((b) => b.id === batchId);
        if (batch) batch.syllabus.push({
          id: `sy-${Date.now()}`,
          title: topic.title,
          sessions: topic.sessions,
          completed: false,
        });
      }),

      markTopicComplete: (batchId, topicId) => set((s) => {
        const topic = s.batches.find((b) => b.id === batchId)
          ?.syllabus.find((t) => t.id === topicId);
        if (topic) topic.completed = true;
      }),

      enrollStudent: (batchId, studentId) => set((s) => {
        const batch   = s.batches.find((b) => b.id === batchId);
        const student = s.students.find((x) => x.id === studentId);
        if (batch   && !batch.studentIds.includes(studentId))  batch.studentIds.push(studentId);
        if (student && !student.batchIds.includes(batchId))    student.batchIds.push(batchId);
      }),

      // Attendance
      markAttendance: (records) => set((s) => {
        records.forEach((rec) => {
          const i = s.attendance.findIndex(
            (a) => a.studentId === rec.studentId && a.batchId === rec.batchId && a.date === rec.date
          );
          if (i !== -1) Object.assign(s.attendance[i]!, rec);
          else s.attendance.push({ ...rec, id: `att-${Date.now()}-${Math.random()}` });
        });
      }),

      // Exams
      addExam: (data) => {
        const exam: Exam = { ...data, id: `e-${Date.now()}`, results: [] };
        set((s) => { s.exams.unshift(exam); });
        return exam;
      },

      saveResults: (examId, results) => set((s) => {
        const exam = s.exams.find((e) => e.id === examId);
        if (!exam) return;
        const sorted = [...results].filter((r) => r.marks !== null)
          .sort((a, b) => (b.marks ?? 0) - (a.marks ?? 0));
        exam.results = results.map((r) => {
          const rank       = sorted.findIndex((x) => x.studentId === r.studentId) + 1;
          const percentile = r.marks !== null
            ? Math.round(((sorted.length - rank) / sorted.length) * 100) : undefined;
          const pct   = r.marks !== null ? (r.marks / exam.maxMarks) * 100 : 0;
          const grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B+" : pct >= 60 ? "B" : pct >= 50 ? "C" : "D";
          return { ...r, rank: r.marks !== null ? rank : undefined, percentile, grade };
        });
        exam.status = "COMPLETED";
      }),

      // Fees
      addFeeRecord: (record) => set((s) => {
        s.feeRecords.unshift({ ...record, id: `f-${Date.now()}` });
      }),
    })),

    // ── Persist config ──────────────────────────────────────────
    {
      name: "academic-store",
      partialize: (state) => ({
        batches:    state.batches,
        exams:      state.exams,
        feeRecords: state.feeRecords,
        attendance: state.attendance,
      }),
    }
  )
);
