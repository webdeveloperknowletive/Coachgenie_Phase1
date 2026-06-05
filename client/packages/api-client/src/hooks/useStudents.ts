// "use client";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { queryKeys } from "../query-keys";
// import type { Student } from "../schemas";

// // --- Mock data ---
// const MOCK_STUDENTS: Student[] = [
//   {
//     id: "550e8400-e29b-41d4-a716-446655440000",
//     name: "Aarav Sharma",
//     email: "aarav@example.com",
//     grade: "10th",
//     subjects: ["Mathematics","Physics"],
//     tenantId: "tenant-001",
//     status: "ACTIVE",
//     createdAt: new Date().toISOString(),
//     updatedAt: new Date().toISOString(),
//   },
//   {
//     id: "550e8400-e29b-41d4-a716-446655440001",
//     name: "Priya Patel",
//     email: "priya@example.com",
//     grade: "9th",
//     subjects: ["Science","English"],
//     tenantId: "tenant-001",
//     status: "ACTIVE",
//     createdAt: new Date().toISOString(),
//     updatedAt: new Date().toISOString(),
//   },
// ];

// export function useStudents(tenantId: string) {
//   return useQuery({
//     queryKey: queryKeys.students.all(tenantId),
//     queryFn:  async () => {
//       await new Promise((r) => setTimeout(r, 500)); // simulate latency
//       return MOCK_STUDENTS;
//     },
//   });
// }

// export function useStudent(id: string) {
//   return useQuery({
//     queryKey: queryKeys.students.detail(id),
//     queryFn:  async () => {
//       await new Promise((r) => setTimeout(r, 300));
//       return MOCK_STUDENTS.find((s) => s.id === id) ?? null;
//     },
//     enabled: !!id,
//   });
// }

// export function useCreateStudent() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: async (data: Omit<Student, "id" | "createdAt" | "updatedAt">) => {
//       await new Promise((r) => setTimeout(r, 800));
//       return { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Student;
//     },
//     onSuccess: () => {
//       void qc.invalidateQueries({ queryKey: ["students"] });
//     },
//   });
// }





"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsService } from "../services/students.service";
import { queryKeys }       from "../query-keys";

export function useStudents(params?: { page?:number; limit?:number; search?:string }) {
  return useQuery({
    queryKey: [...queryKeys.students.all(""), params],
    queryFn:  () => studentsService.list(params).then(r => r.data),
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: queryKeys.students.detail(id),
    queryFn:  () => studentsService.get(id).then(r => r.data.data),
    enabled:  !!id,
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studentsService.create,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      studentsService.update(id, data as never),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}