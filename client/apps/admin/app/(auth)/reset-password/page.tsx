"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, LockKeyhole } from "lucide-react";
import { useEffect } from "react";
const schema = z.object({
  email: z.string().email("Enter a valid email"),
  otp: z.string().min(4, "Enter the OTP"),
  new_password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm your password"),
}).refine((data) => data.new_password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordInput = z.infer<typeof schema>;

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "demo";

// function ResetPasswordForm() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//   } = useForm<ResetPasswordInput>({
//     resolver: zodResolver(schema),
//     defaultValues: {
//       email: searchParams.get("email") ?? "",
//       otp: searchParams.get("otp") ?? "",
//     },
//   });

//   async function onSubmit(data: ResetPasswordInput) {
//     const res = await fetch(`${API}/auth/reset-password`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "x-tenant-id": TENANT_ID,
//       },
//       body: JSON.stringify({
//         email: data.email,
//         otp: data.otp,
//         new_password: data.new_password,
//       }),
//     });

//     if (!res.ok) {
//       const err = await res.json().catch(() => ({}));
//       toast.error(err.message ?? err.detail ?? "Unable to reset password");
//       return;
//     }

//     toast.success("Password reset successfully");
//     router.push("/login");
//   }

function ResetPasswordForm() {
  const router = useRouter();

  // Read from sessionStorage, not URL params
  const email = typeof window !== "undefined" ? sessionStorage.getItem("cgr_email") ?? "" : "";
  const otp   = typeof window !== "undefined" ? sessionStorage.getItem("cgr_otp")   ?? "" : "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(schema),
    defaultValues: { email, otp },
  });

  // Guard: if no verified OTP in session, they didn't go through verify-otp
  useEffect(() => {
    if (!sessionStorage.getItem("cgr_otp")) {
      router.replace("/forgot-password");
    }
  }, [router]);

  async function onSubmit(data: ResetPasswordInput) {
    const res = await fetch(`${API}/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": TENANT_ID,
      },
      body: JSON.stringify({
        email: data.email,
        otp: data.otp,
        new_password: data.new_password,
      }),
    });

    // Clear session keys immediately after use, success or fail
    sessionStorage.removeItem("cgr_otp");
    sessionStorage.removeItem("cgr_email");

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.message ?? err.detail ?? "Unable to reset password");
      return;
    }

    toast.success("Password reset successfully");
    router.push("/login");
  }

  return (
    <div className="rounded-2xl border bg-card p-8 shadow-xl shadow-black/5 space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          Set a new password for your CoachGenie admin account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <input {...register("email")} type="email" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">OTP</label>
            <input {...register("otp")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            {errors.otp && <p className="text-xs text-destructive">{errors.otp.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">New password</label>
          <input {...register("new_password")} type="password" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          {errors.new_password && <p className="text-xs text-destructive">{errors.new_password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Confirm password</label>
          <input {...register("confirmPassword")} type="password" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Saving..." : "Reset password"}
        </button>
      </form>

      <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to login
      </Link>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground shadow-xl shadow-black/5">Loading reset form...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
