"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Building2, Loader2 } from "lucide-react";

const schema = z.object({
  name:        z.string().min(2),
  tagline:     z.string().optional(),
  phone:       z.string().min(10),
  email:       z.string().email(),
  address:     z.string().min(5),
  city:        z.string().min(2),
  state:       z.string().min(2),
  pincode:     z.string().min(6).max(6),
  website:     z.string().url().optional().or(z.literal("")),
  primaryColor:z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Valid hex color required"),
});
type SettingsFormValues = z.infer<typeof schema>;

const inputCls = "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium">{label}</label>
    {children}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

export default function SettingsPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm<SettingsFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "CoachGenie Demo Institute", tagline: "Excellence in Education",
      phone: "9876543000", email: "admin@demo.com", address: "123, Coaching Hub, MG Road",
      city: "Pune", state: "Maharashtra", pincode: "411001",
      website: "https://coachgenie.in", primaryColor: "#0284c7",
    },
  });

  async function onSubmit(data: SettingsFormValues) {
    await new Promise(r => setTimeout(r, 800));
    toast.success("Institute settings saved!");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Institute Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your institute profile and branding</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Institute info */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Institute Profile</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Institute Name" error={errors.name?.message}>
                <input {...register("name")} className={inputCls} />
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Tagline" error={errors.tagline?.message}>
                <input {...register("tagline")} placeholder="Excellence in Education" className={inputCls} />
              </Field>
            </div>
            <Field label="Phone" error={errors.phone?.message}>
              <input {...register("phone")} className={inputCls} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <input {...register("email")} type="email" className={inputCls} />
            </Field>
            <div className="col-span-2">
              <Field label="Address" error={errors.address?.message}>
                <input {...register("address")} className={inputCls} />
              </Field>
            </div>
            <Field label="City" error={errors.city?.message}>
              <input {...register("city")} className={inputCls} />
            </Field>
            <Field label="State" error={errors.state?.message}>
              <input {...register("state")} className={inputCls} />
            </Field>
            <Field label="Pincode" error={errors.pincode?.message}>
              <input {...register("pincode")} className={inputCls} />
            </Field>
            <Field label="Website" error={errors.website?.message}>
              <input {...register("website")} placeholder="https://yoursite.com" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Branding */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold text-sm">Branding</h3>
          <Field label="Primary Color" error={errors.primaryColor?.message}>
            <div className="flex gap-3 items-center">
              <input {...register("primaryColor")} type="text" placeholder="#0284c7" className={`${inputCls} flex-1`} />
              <input {...register("primaryColor")} type="color" className="h-9 w-16 rounded-md border border-input cursor-pointer" />
            </div>
          </Field>
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Logo upload — connect to your file storage in production</p>
            <div className="mt-3 flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl border-2 border-dashed flex items-center justify-center text-muted-foreground text-xs text-center">
                Logo<br/>120×120
              </div>
              <button type="button"
                className="rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors">
                Upload Logo
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={isSubmitting || !isDirty}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors shadow-sm">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}