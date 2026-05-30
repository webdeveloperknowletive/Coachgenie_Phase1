"use client"

export default function UnauthorizedPage() {
  return (
    <div className="flex h-screen items-center justify-center text-center">
      <div>
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground mt-2">You don't have permission to view this page.</p>
      </div>
    </div>
  );
}

