"use client";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";

const schema = z.object({
  name:         z.string().min(2),
  course:       z.string().min(2),
  grade:        z.string().min(1),
  totalAmount:  z.coerce.number().positive(),
  isActive:     z.boolean(),
  installments: z.array(z.object({
    label:   z.string().min(1),
    amount:  z.coerce.number().positive(),
    dueDate: z.string().min(1),
  })).min(1, "At least one installment required"),
});
export type FeeStructureFormValues = z.infer<typeof schema>;

const inputCls = "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium">{label}</label>
    {children}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

interface FeeStructureFormProps {
  defaultValues?: Partial<FeeStructureFormValues>;
  onSubmit:  (d: FeeStructureFormValues) => Promise<void>;
  onCancel:  () => void;
  submitLabel?: string;
}

export function FeeStructureForm({ defaultValues, onSubmit, onCancel, submitLabel = "Create Structure" }: FeeStructureFormProps) {
  const { register, control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FeeStructureFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", course: "", grade: "", totalAmount: 0, isActive: true,
      installments: [{ label: "Term 1", amount: 0, dueDate: "" }],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "installments" });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field label="Structure Name" error={errors.name?.message}>
            <input {...register("name")} placeholder="JEE Foundation 10th" className={inputCls} />
          </Field>
        </div>
        <Field label="Course" error={errors.course?.message}>
          <input {...register("course")} placeholder="JEE Foundation" className={inputCls} />
        </Field>
        <Field label="Grade" error={errors.grade?.message}>
          <select {...register("grade")} className={inputCls}>
            <option value="">Select grade</option>
            {["8th","9th","10th","11th","12th","Dropper"].map(g => <option key={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="Total Amount (₹)" error={errors.totalAmount?.message}>
          <input {...register("totalAmount")} type="number" className={inputCls} />
        </Field>
        <div className="flex items-center gap-2 self-end pb-1">
          <input {...register("isActive")} type="checkbox" id="isActive" className="h-4 w-4 accent-primary" />
          <label htmlFor="isActive" className="text-sm font-medium">Active</label>
        </div>
      </div>

      {/* Installments */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold">Installments</label>
          <button type="button" onClick={() => append({ label: `Term ${fields.length + 1}`, amount: 0, dueDate: "" })}
            className="flex items-center gap-1 text-xs text-primary hover:underline">
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        <div className="space-y-2">
          {fields.map((field, i) => (
            <div key={field.id} className="flex gap-2 items-start">
              <input {...register(`installments.${i}.label`)} placeholder="Term 1"
                className={`${inputCls} flex-1`} />
              <input {...register(`installments.${i}.amount`)} type="number" placeholder="Amount"
                className={`${inputCls} w-28`} />
              <input {...register(`installments.${i}.dueDate`)} type="date"
                className={`${inputCls} w-36`} />
              <button type="button" onClick={() => remove(i)}
                className="mt-0.5 rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        {errors.installments?.root && (
          <p className="text-xs text-destructive mt-1">{errors.installments.root.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t">
        <button type="button" onClick={onCancel}
          className="rounded-md border px-4 py-2 text-sm hover:bg-accent transition-colors">Cancel</button>
        <button type="submit" disabled={isSubmitting}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
          {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}