"use client";
import { useEffect, useState } from "react";

interface TenantGuardProps {
  tenantId?: string;
  children:  React.ReactNode;
}

export function TenantGuard({ tenantId = "demo", children }: TenantGuardProps) {
  const [valid, setValid] = useState(true);

  useEffect(() => {
    // In production: validate tenantId against your API
    const invalidTenants = ["invalid", "blocked"];
    setValid(!invalidTenants.includes(tenantId));
  }, [tenantId]);

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-8">
        <div>
          <h2 className="text-2xl font-bold text-destructive">Invalid Tenant</h2>
          <p className="mt-2 text-muted-foreground">This organization does not exist or has been suspended.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}