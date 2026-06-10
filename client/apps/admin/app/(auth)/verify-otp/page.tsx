"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, Loader2 } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  otp: z.string().min(4, "Enter the OTP"),
});

type VerifyOtpInput = z.infer<typeof schema>;

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "demo";

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyOtpInput>({
    resolver: zodResolver(schema),
    defaultValues: { email },
  });

  async function onSubmit(data: VerifyOtpInput) {
    const res = await fetch(`${API}/auth/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": TENANT_ID,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.message ?? err.detail ?? "Invalid OTP");
      return;
    }

    toast.success("OTP verified");
    // router.push(`/reset-password?email=${encodeURIComponent(data.email)}&otp=${encodeURIComponent(data.otp)}`);
    sessionStorage.setItem("cgr_email", data.email);
    sessionStorage.setItem("cgr_otp", data.otp);
    router.push("/reset-password");
  }

  return (
    <div className="rounded-2xl border bg-card p-8 shadow-xl shadow-black/5 space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
          <KeyRound className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Verify OTP</h1>
        <p className="text-sm text-muted-foreground">
          Confirm the OTP sent to your email before setting a new password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Email</label>
          <input
            {...register("email")}
            type="email"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">OTP</label>
          <input
            {...register("otp")}
            inputMode="numeric"
            placeholder="123456"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm tracking-[0.25em] outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {errors.otp && <p className="text-xs text-destructive">{errors.otp.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Verifying..." : "Verify OTP"}
        </button>
      </form>

      <Link href="/forgot-password" className="flex items-center justify-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Request a new OTP
      </Link>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground shadow-xl shadow-black/5">Loading verification form...</div>}>
      <VerifyOtpForm />
    </Suspense>
  );
}

