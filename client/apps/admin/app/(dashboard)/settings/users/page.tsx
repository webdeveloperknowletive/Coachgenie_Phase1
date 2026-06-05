"use client";
import { useState } from "react";
import { Plus, X, Shield, UserMinus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useFinanceStore } from "@/lib/stores/finance.store";
import type { InstituteUser } from "@/lib/types/finance";

const ROLE_CONFIG: Record<InstituteUser["role"], { label: string; color: string; bg: string }> = {
  SUPER_ADMIN: { label: "Super Admin", color: "text-violet-700", bg: "bg-violet-50 dark:bg-violet-950" },
  ADMIN:       { label: "Admin",       color: "text-blue-700",   bg: "bg-blue-50 dark:bg-blue-950" },
  COACH:       { label: "Coach",       color: "text-emerald-700",bg: "bg-emerald-50 dark:bg-emerald-950" },
};
const STATUS_STYLE: Record<InstituteUser["status"], string> = {
  ACTIVE:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-slate-100 text-slate-600 border-slate-200",
  INVITED:  "bg-amber-50 text-amber-700 border-amber-200",
};

export default function UsersPage() {
  const { users, inviteUser, updateUserRole, deactivateUser } = useFinanceStore();
  const [showInvite, setShowInvite] = useState(false);
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole]   = useState<InstituteUser["role"]>("COACH");
  const [saving, setSaving] = useState(false);

  async function handleInvite() {
    if (!name.trim() || !email.trim()) { toast.error("Name and email required"); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    inviteUser({ name: name.trim(), email: email.trim(), role });
    toast.success(`Invitation sent to ${email}`);
    setName(""); setEmail(""); setRole("COACH");
    setSaving(false);
    setShowInvite(false);
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{users.filter(u=>u.status==="ACTIVE").length} active users</p>
        </div>
        <button onClick={() => setShowInvite(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Invite User
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              {["User","Role","Status","Last Login","Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const roleCfg = ROLE_CONFIG[user.role];
              return (
                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {user.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select value={user.role}
                      onChange={e => { updateUserRole(user.id, e.target.value as InstituteUser["role"]); toast.success("Role updated"); }}
                      disabled={user.role === "SUPER_ADMIN"}
                      className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium border-0 focus:outline-none cursor-pointer disabled:cursor-not-allowed", roleCfg.bg, roleCfg.color)}>
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="ADMIN">Admin</option>
                      <option value="COACH">Coach</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-medium", STATUS_STYLE[user.status])}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {user.lastLogin ? format(new Date(user.lastLogin), "dd MMM, hh:mm a") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {user.role !== "SUPER_ADMIN" && user.status === "ACTIVE" && (
                      <button onClick={() => { deactivateUser(user.id); toast.success(`${user.name} deactivated`); }}
                        className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                        <UserMinus className="h-3 w-3" /> Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Roles info */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Role Permissions</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
            <div key={role} className={cn("rounded-lg p-3", cfg.bg)}>
              <p className={cn("text-xs font-semibold mb-1.5", cfg.color)}>{cfg.label}</p>
              <ul className="text-xs space-y-0.5 text-muted-foreground">
                {role === "SUPER_ADMIN" && ["All permissions","Manage billing","Manage users","Delete data"].map(p=><li key={p}>✓ {p}</li>)}
                {role === "ADMIN"       && ["Manage students","Manage batches","View reports","Record fees"].map(p=><li key={p}>✓ {p}</li>)}
                {role === "COACH"       && ["Mark attendance","Enter results","View students","Log activities"].map(p=><li key={p}>✓ {p}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {showInvite && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setShowInvite(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-2xl border bg-background shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Invite User</h2>
              <button onClick={() => setShowInvite(false)} className="rounded-lg p-1.5 hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Name</label>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="Raj Kulkarni"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="raj@demo.com"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Role</label>
                <select value={role} onChange={e=>setRole(e.target.value as InstituteUser["role"])}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="COACH">Coach</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowInvite(false)} className="rounded-md border px-4 py-2 text-sm hover:bg-accent transition-colors">Cancel</button>
                <button onClick={handleInvite} disabled={saving}
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}