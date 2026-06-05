
<<<<<<< HEAD
// "use client";
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { toast } from "sonner";
// import { Eye, EyeOff, GraduationCap, Loader2 } from "lucide-react";

// const schema = z.object({
//   email:    z.string().email("Enter a valid email"),
//   password: z.string().min(1, "Password required"),
// });
// type LoginInput = z.infer<typeof schema>;

// // ── Zustand auth store (direct import to avoid package issues) ──
// import { useAuthStore } from "@/lib/stores/auth.store";

// export default function LoginPage() {
//   const router  = useRouter();
//   const setAuth = useAuthStore((s) => s.setAuth);
//   const [showPw, setShowPw] = useState(false);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//   } = useForm<LoginInput>({ resolver: zodResolver(schema) });

//   async function onSubmit(data: LoginInput) {
//     try {
//       const res = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/auth/login`,
//         {
//           method:  "POST",
//           headers: {
//             "Content-Type": "application/json",
//             "x-tenant-id": process.env.NEXT_PUBLIC_TENANT_ID ?? "demo",
//           },
//           body: JSON.stringify(data),
//         }
//       );

//       if (!res.ok) {
//         const err = await res.json().catch(() => ({}));
//         throw new Error(err.message ?? err.detail ?? "Invalid credentials");
//       }

//       const json = await res.json();
//       const { access_token, refresh_token, user } = json;

//       // Save to Zustand
//       setAuth(access_token, refresh_token, user);

//       // Set cookie so middleware allows access
//       document.cookie = `cg_access_token=${access_token}; path=/; max-age=3600; SameSite=Lax`;
//       sessionStorage.setItem("access_token", access_token);
//       sessionStorage.setItem("refresh_token", refresh_token);


//       toast.success(`Welcome back, ${user.first_name ?? user.email}!`);
//       router.push("/dashboard");
//     } catch (err: unknown) {
//       const msg = err instanceof Error ? err.message : "Something went wrong";
//       toast.error(msg);
//     }
//   }





//   return (
//     <div className="rounded-2xl border bg-card shadow-xl shadow-black/5 p-8 space-y-6 fade-in">
//       <div className="flex flex-col items-center gap-2 text-center">
//         <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
//           <GraduationCap className="h-6 w-6" />
//         </div>
//         <h1 className="text-2xl font-bold tracking-tight">CoachGenie</h1>
//         <p className="text-sm text-muted-foreground">Sign in to your admin portal</p>
//       </div>

//       <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//         <div className="space-y-1.5">
//           <label className="text-sm font-medium">Email</label>
//           <input
//             {...register("email")}
//             type="email"
//             placeholder="admin@demo.com"
//             autoComplete="email"
//             className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm
//                        placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2
//                        focus-visible:ring-ring"
//           />
//           {errors.email && (
//             <p className="text-xs text-destructive">{errors.email.message}</p>
//           )}
//         </div>

//         <div className="space-y-1.5">
//           <div className="flex items-center justify-between gap-3">
//             <label className="text-sm font-medium">Password</label>
//             <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
//               Forgot password?
//             </Link>
//           </div>
//           <div className="relative">
//             <input
//               {...register("password")}
//               type={showPw ? "text" : "password"}
//               placeholder="••••••••"
//               autoComplete="current-password"
//               className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm
//                          placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2
//                          focus-visible:ring-ring"
//             />
//             <button
//               type="button"
//               onClick={() => setShowPw((v) => !v)}
//               className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
//             >
//               {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//             </button>
//           </div>
//           {errors.password && (
//             <p className="text-xs text-destructive">{errors.password.message}</p>
//           )}
//         </div>

//         <button
//           type="submit"
//           disabled={isSubmitting}
//           className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5
//                      text-sm font-medium text-primary-foreground hover:bg-primary/90
//                      disabled:pointer-events-none disabled:opacity-60 transition-colors"
//         >
//           {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
//           {isSubmitting ? "Signing in…" : "Sign in"}
//         </button>
//       </form>
//     </div>
//   );
// }

=======
>>>>>>> 01191d4 (FIxes Done and testing remaining)

"use client";
// app/(auth)/login/page.tsx
// SECURITY FIX:
//   BEFORE: setAuth(tokens) → localStorage + document.cookie (XSS-readable)
//   AFTER:  POST /api/auth/session → server sets HttpOnly cookie → setUser(display state only)

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, GraduationCap, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth.store";

const schema = z.object({
  email:    z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password required"),
});
type LoginInput = z.infer<typeof schema>;

export default function LoginPage() {
  const router   = useRouter();
  const setUser  = useAuthStore((s) => s.setUser);
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(schema) });

<<<<<<< HEAD
  async function onSubmit(data: LoginInput) {
    try {
      // Step 1 — authenticate against FastAPI backend
      const backendRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/auth/login`,
        {
          method:  "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id":  process.env.NEXT_PUBLIC_TENANT_ID ?? "demo",
          },
          body: JSON.stringify(data),
        }
      );

      if (!backendRes.ok) {
        const err = await backendRes.json().catch(() => ({}));
        throw new Error(err.message ?? err.detail ?? "Invalid credentials");
      }

      const { access_token, refresh_token, user } = await backendRes.json();

      // Step 2 — hand tokens to our own Next.js API route.
      // It sets HttpOnly cookies. Tokens never touch client JS after this line.
      const sessionRes = await fetch("/api/auth/session", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ access_token, refresh_token, user }),
      });

      if (!sessionRes.ok) {
        throw new Error("Failed to establish session");
      }

      const { user: safeUser } = await sessionRes.json();

      // Step 3 — store only display state (name, role, email) in Zustand.
      // No tokens. No localStorage token keys. No document.cookie calls.
      setUser(safeUser);

      toast.success(`Welcome back, ${safeUser.first_name ?? safeUser.email}!`);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    }
  }
=======
  // async function onSubmit(data: LoginInput) {
  //   try {
  //     // Step 1 — authenticate against FastAPI backend
  //     const backendRes = await fetch(
  //       `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/auth/login`,
  //       {
  //         method:  "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           "x-tenant-id":  process.env.NEXT_PUBLIC_TENANT_ID ?? "demo",
  //         },
  //         body: JSON.stringify(data),
  //       }
  //     );

  //     if (!backendRes.ok) {
  //       const err = await backendRes.json().catch(() => ({}));
  //       throw new Error(err.message ?? err.detail ?? "Invalid credentials");
  //     }

  //     const { access_token, refresh_token, user } = await backendRes.json();

  //     // Step 2 — hand tokens to our own Next.js API route.
  //     // It sets HttpOnly cookies. Tokens never touch client JS after this line.
  //     const sessionRes = await fetch("/api/auth/session", {
  //       method:  "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body:    JSON.stringify({ access_token, refresh_token, user }),
  //     });

  //     if (!sessionRes.ok) {
  //       throw new Error("Failed to establish session");
  //     }

  //     const { user: safeUser } = await sessionRes.json();

  //     // Step 3 — store only display state (name, role, email) in Zustand.
  //     // No tokens. No localStorage token keys. No document.cookie calls.
  //     setUser(safeUser);

  //     toast.success(`Welcome back, ${safeUser.first_name ?? safeUser.email}!`);
  //     router.push("/dashboard");
  //   } catch (err: unknown) {
  //     const msg = err instanceof Error ? err.message : "Something went wrong";
  //     toast.error(msg);
  //   }
  // }
  async function onSubmit(data: LoginInput) {
  try {
    console.log("Starting login...");

    // Step 1: Login to FastAPI backend
    const backendRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": process.env.NEXT_PUBLIC_TENANT_ID ?? "demo",
        },
        body: JSON.stringify(data),
      }
    );

    console.log("Backend response status:", backendRes.status);

    if (!backendRes.ok) {
      const err = await backendRes.json().catch(() => ({}));
      console.error("Backend login failed:", err);
      throw new Error(err.message ?? err.detail ?? "Invalid credentials");
    }

    const loginData = await backendRes.json();

    console.log("Backend login success:", loginData);

    const { access_token, refresh_token, user } = loginData;

    // Step 2: Create Next.js session
    const sessionRes = await fetch("/api/auth/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access_token,
        refresh_token,
        user,
      }),
    });

    console.log("Session response status:", sessionRes.status);

    if (!sessionRes.ok) {
      const errorText = await sessionRes.text();
      console.error("Session API failed:", errorText);
      throw new Error("Failed to establish session");
    }

    const sessionData = await sessionRes.json();

    console.log("Session created:", sessionData);

    const safeUser = sessionData.user;

    // Step 3: Save user in Zustand
    setUser(safeUser);

    console.log("User saved to Zustand:", safeUser);

    toast.success(
      `Welcome back, ${safeUser.first_name ?? safeUser.email}!`
    );

    console.log("Redirecting to dashboard...");

    // Temporary test redirect
    window.location.href = "/dashboard";

    // Later replace with:
    // router.push("/dashboard");

  } catch (err: unknown) {
    console.error("Login error:", err);

    const msg =
      err instanceof Error ? err.message : "Something went wrong";

    toast.error(msg);
  }
}
>>>>>>> 01191d4 (FIxes Done and testing remaining)

  return (
    <div className="rounded-2xl border bg-card shadow-xl shadow-black/5 p-8 space-y-6 fade-in">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
          <GraduationCap className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">CoachGenie</h1>
        <p className="text-sm text-muted-foreground">Sign in to your admin portal</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Email</label>
          <input
            {...register("email")}
            type="email"
            placeholder="admin@demo.com"
            autoComplete="email"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                       placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-ring"
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium">Password</label>
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              {...register("password")}
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm
                         placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-ring"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5
                     text-sm font-medium text-primary-foreground hover:bg-primary/90
                     disabled:pointer-events-none disabled:opacity-60 transition-colors"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}