"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useAcademicStore } from "@/lib/stores/academic.store";

const schema = z.object({
  name:     z.string().min(3),
  subject:  z.string().min(1),
  batchId:  z.string().min(1),
  date:     z.string().min(1),
  maxMarks: z.coerce.number().positive().max(1000),
  duration: z.coerce.number().positive().max(600),
  status:   z.enum(["UPCOMING","ONGOING","COMPLETED"]),
});
export type ExamFormValues = z.infer<typeof schema>;

const inputCls = "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium">{label}</label>
    {children}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

interface ExamFormProps {
  onSubmit:  (d: ExamFormValues) => Promise<void>;
  onCancel:  () => void;
}

export function ExamForm({ onSubmit, onCancel }: ExamFormProps) {
  const { batches } = useAcademicStore();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ExamFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "UPCOMING", maxMarks: 100, duration: 180 },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field label="Exam Name" error={errors.name?.message}>
            <input {...register("name")} placeholder="Unit Test 1 — Mathematics" className={inputCls} />
          </Field>
        </div>
        <Field label="Subject" error={errors.subject?.message}>
          <input {...register("subject")} placeholder="Mathematics" className={inputCls} />
        </Field>
        <Field label="Batch" error={errors.batchId?.message}>
          <select {...register("batchId")} className={inputCls}>
            <option value="">Select batch</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Field>
        <Field label="Date" error={errors.date?.message}>
          <input {...register("date")} type="date" className={inputCls} />
        </Field>
        <Field label="Max Marks" error={errors.maxMarks?.message}>
          <input {...register("maxMarks")} type="number" className={inputCls} />
        </Field>
        <Field label="Duration (minutes)" error={errors.duration?.message}>
          <input {...register("duration")} type="number" className={inputCls} />
        </Field>
        <Field label="Status" error={errors.status?.message}>
          <select {...register("status")} className={inputCls}>
            <option value="UPCOMING">Upcoming</option>
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </Field>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t">
        <button type="button" onClick={onCancel}
          className="rounded-md border px-4 py-2 text-sm hover:bg-accent transition-colors">Cancel</button>
        <button type="submit" disabled={isSubmitting}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
          {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Create Exam
        </button>
      </div>
    </form>
  );
}