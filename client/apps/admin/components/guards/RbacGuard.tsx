// "use client";
// import { useEffect } from "react";
// import { useRouter } from "next/navigation";

// // type Role = "SUPER_ADMIN" | "ADMIN" | "COACH" | "PARENT" | "STUDENT";
// // Change allowed prop type
// type Role = "owner" | "counselor" | "tutor" | "parent" | "student"


// interface RbacGuardProps {
//   allowed:  Role[];
//   role?:    Role;
//   children: React.ReactNode;
// }

// export function RbacGuard({ allowed, role = "owner", children }: RbacGuardProps) {
//   const router = useRouter();

//   useEffect(() => {
//     if (!allowed.includes(role)) {
//       router.replace("/login");
//     }
//   }, [allowed, role, router]);

//   if (!allowed.includes(role)) return null;
//   return <>{children}</>;
// }


"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Role = "owner" | "counselor" | "tutor" | "parent" | "student";

interface RbacGuardProps {
  allowed:  Role[];
  role?:    Role;
  children: React.ReactNode;
}

export function RbacGuard({ allowed, role, children }: RbacGuardProps) {
  const router = useRouter();

  useEffect(() => {
    if (!role || !allowed.includes(role)) {
      router.replace("/unauthorized");
    }
  }, [allowed, role, router]);

  if (!role || !allowed.includes(role)) return null;
  return <>{children}</>;
}
