"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import type { Student } from "@/lib/types/academic";

const schema = z.object({
  name:        z.string().min(2),
  email:       z.string().email(),
  phone:       z.string().min(10),
  parentName:  z.string().min(2),
  parentPhone: z.string().min(10),
  grade:       z.string().min(1),
  subjects:    z.string().min(1),
  address:     z.string().min(5),
  dob:         z.string().min(1),
  status:      z.enum(["ACTIVE","INACTIVE","SUSPENDED","GRADUATED"]),
  targetExam:  z.string().optional(),
  schoolName:  z.string().optional(),
  gender:      z.string().optional(),
});
export type StudentFormValues = z.infer<typeof schema>;

const inputCls = "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

interface StudentFormProps {
  defaultValues?: Partial<Student>;
  onSubmit:  (d: StudentFormValues) => Promise<void>;
  onCancel:  () => void;
  submitLabel?: string;
}

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium">{label}</label>
    {children}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

export function StudentForm({ defaultValues, onSubmit, onCancel, submitLabel = "Create Student" }: StudentFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<StudentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:        defaultValues?.name        ?? "",
      email:       defaultValues?.email       ?? "",
      phone:       defaultValues?.phone       ?? "",
      parentName:  defaultValues?.parentName  ?? "",
      parentPhone: defaultValues?.parentPhone ?? "",
      grade:       defaultValues?.grade       ?? "",
      subjects:    defaultValues?.subjects?.join(", ") ?? "",
      address:     defaultValues?.address     ?? "",
      dob:         defaultValues?.dob         ?? "",
      status:      defaultValues?.status      ?? "ACTIVE",
      targetExam:  "",
      schoolName:  "",
      gender:      "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Student Name" error={errors.name?.message}>
          <input {...register("name")} placeholder="Aarav Sharma" className={inputCls} />
        </Field>
        <Field label="Date of Birth" error={errors.dob?.message}>
          <input {...register("dob")} type="date" className={inputCls} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input {...register("email")} type="email" placeholder="aarav@gmail.com" className={inputCls} />
        </Field>
        <Field label="Phone" error={errors.phone?.message}>
          <input {...register("phone")} placeholder="9876543210" className={inputCls} />
        </Field>
        <Field label="Parent Name" error={errors.parentName?.message}>
          <input {...register("parentName")} placeholder="Suresh Sharma" className={inputCls} />
        </Field>
        <Field label="Parent Phone" error={errors.parentPhone?.message}>
          <input {...register("parentPhone")} placeholder="9876543200" className={inputCls} />
        </Field>
        <Field label="Grade" error={errors.grade?.message}>
          <select {...register("grade")} className={inputCls}>
            <option value="">Select</option>
            {["8th","9th","10th","11th","12th","Dropper"].map(g => <option key={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="Status" error={errors.status?.message}>
          <select {...register("status")} className={inputCls}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="GRADUATED">Graduated</option>
          </select>
        </Field>
        <Field label="Subjects (comma separated)" error={errors.subjects?.message}>
          <input {...register("subjects")} placeholder="Mathematics, Physics" className={inputCls} />
        </Field>
        <Field label="Target Exam" error={errors.targetExam?.message}>
          <input {...register("targetExam")} placeholder="JEE, NEET, Boards" className={inputCls} />
        </Field>
        <Field label="School Name" error={errors.schoolName?.message}>
          <input {...register("schoolName")} placeholder="Delhi Public School" className={inputCls} />
        </Field>
        <Field label="Gender" error={errors.gender?.message}>
          <select {...register("gender")} className={inputCls}>
            <option value="">Select</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </Field>
        <Field label="Address" error={errors.address?.message}>
          <input {...register("address")} placeholder="Shivajinagar, Pune" className={inputCls} />
        </Field>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t">
        <button type="button" onClick={onCancel}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">Cancel</button>
        <button type="submit" disabled={isSubmitting}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
          {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
