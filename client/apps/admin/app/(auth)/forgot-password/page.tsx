// "use client";

// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useState } from "react";
// import { useForm } from "react-hook-form";
// import { z } from "zod";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { toast } from "sonner";
// import { ArrowLeft, Loader2, Mail } from "lucide-react";

// const schema = z.object({
//   email: z.string().email("Enter a valid email"),
// });

// type ForgotPasswordInput = z.infer<typeof schema>;

// const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
// const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "demo";

// export default function ForgotPasswordPage() {
//   const router = useRouter();
//   const [sentTo, setSentTo] = useState<string | null>(null);
//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//   } = useForm<ForgotPasswordInput>({ resolver: zodResolver(schema) });

//   async function onSubmit(data: ForgotPasswordInput) {
//     const res = await fetch(`${API}/auth/forgot-password`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "x-tenant-id": TENANT_ID,
//       },
//       body: JSON.stringify(data),
//     });

//     if (!res.ok) {
//       const err = await res.json().catch(() => ({}));
//       toast.error(err.message ?? err.detail ?? "Unable to send OTP");
//       return;
//     }

//     setSentTo(data.email);
//     toast.success("OTP sent to your email");
//     router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
//   }

//   return (
//     <div className="rounded-2xl border bg-card p-8 shadow-xl shadow-black/5 space-y-6">
//       <div className="space-y-2 text-center">
//         <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
//           <Mail className="h-5 w-5" />
//         </div>
//         <h1 className="text-2xl font-bold tracking-tight">Forgot password</h1>
//         <p className="text-sm text-muted-foreground">
//           Enter your admin email and we will send a verification OTP.
//         </p>
//       </div>

//       <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//         <div className="space-y-1.5">
//           <label className="text-sm font-medium">Email</label>
//           <input
//             {...register("email")}
//             type="email"
//             placeholder="admin@demo.com"
//             className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
//           />
//           {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
//         </div>

//         <button
//           type="submit"
//           disabled={isSubmitting}
//           className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-60"
//         >
//           {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
//           {isSubmitting ? "Sending OTP..." : "Send OTP"}
//         </button>
//       </form>

//       {sentTo && (
//         <p className="rounded-lg bg-accent px-3 py-2 text-center text-xs text-muted-foreground">
//           OTP sent to {sentTo}
//         </p>
//       )}

//       <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-primary hover:underline">
//         <ArrowLeft className="h-4 w-4" /> Back to login
//       </Link>
//     </div>
//   );
// }



"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "demo";

type Step = "email" | "otp" | "reset" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step,        setStep]        = useState<Step>("email");
  const [email,       setEmail]       = useState("");
  const [otp,         setOtp]         = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [loading,     setLoading]     = useState(false);

  const headers = {
    "Content-Type": "application/json",
    "x-tenant-id": TENANT_ID,
  };

  // async function handleSendOtp(e: React.FormEvent) {
  //   e.preventDefault();
  //   if (!email) return toast.error("Enter your email");
  //   setLoading(true);
  //   try {
  //     const res = await fetch(`${API}/auth/forgot-password`, {
  //       method: "POST", headers,
  //       body: JSON.stringify({ email }),
  //     });
  //     const json = await res.json();
  //     if (!res.ok) throw new Error(json.detail ?? json.message ?? "Failed to send OTP");
  //     toast.success("OTP sent to your email");
  //     setStep("otp");
  //   } catch (err: any) {
  //     toast.error(err.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // }
  async function handleSendOtp(e: React.FormEvent) {
  e.preventDefault();
  if (!email) return toast.error("Enter your email");
  setLoading(true);
  try {
    const res = await fetch(`${API}/auth/forgot-password`, {
      method: "POST", headers,
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail ?? json.message ?? "Failed to send OTP");
    
    // Show dev OTP if present
    if (json.dev_otp) {
      toast.info(`Dev mode OTP: ${json.dev_otp}`, { duration: 30000 });
    } else {
      toast.success("OTP sent to your email");
    }
    setStep("otp");
  } catch (err: any) {
    toast.error(err.message);
  } finally {
    setLoading(false);
  }
}

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otp) return toast.error("Enter the OTP");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/verify-otp`, {
        method: "POST", headers,
        body: JSON.stringify({ email, otp }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail ?? json.message ?? "Invalid OTP");
      toast.success("OTP verified");
      setStep("reset");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword) return toast.error("Enter a new password");
    if (newPassword !== confirm) return toast.error("Passwords do not match");
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: "POST", headers,
        body: JSON.stringify({ email, otp, new_password: newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail ?? json.message ?? "Failed to reset password");
      toast.success("Password reset successfully");
      setStep("done");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-card shadow-xl shadow-black/5 p-8 space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
          <GraduationCap className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {step === "email" && "Forgot Password"}
          {step === "otp"   && "Enter OTP"}
          {step === "reset" && "New Password"}
          {step === "done"  && "All Done!"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {step === "email" && "We'll send a reset code to your email"}
          {step === "otp"   && `Enter the OTP sent to ${email}`}
          {step === "reset" && "Choose a strong new password"}
          {step === "done"  && "Your password has been reset successfully"}
        </p>
      </div>

      {/* Step: Email */}
      {step === "email" && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@demo.com"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <button type="submit" disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      )}

      {/* Step: OTP */}
      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">One-Time Password</label>
            <input
              type="text" required value={otp}
              onChange={e => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm tracking-widest text-center placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <button type="submit" disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
          <button type="button" onClick={() => handleSendOtp({ preventDefault: () => {} } as any)}
            className="w-full text-xs text-muted-foreground hover:text-primary transition-colors">
            Didn't receive it? Resend OTP
          </button>
        </form>
      )}

      {/* Step: Reset Password */}
      {step === "reset" && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">New Password</label>
            <input
              type="password" required value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Confirm Password</label>
            <input
              type="password" required value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <button type="submit" disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}

      {/* Step: Done */}
      {step === "done" && (
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <button onClick={() => router.push("/login")}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            Back to Login
          </button>
        </div>
      )}

      {/* Back to login */}
      {step !== "done" && (
        <div className="text-center">
          <Link href="/login"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back to login
          </Link>
        </div>
      )}
    </div>
  );
}
