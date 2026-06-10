"use client";
import { CheckCircle2, Zap, Building2, Crown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "starter", name: "Starter", price: 999, period: "month",
    icon: Zap, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950",
    features: ["Up to 50 students", "2 staff accounts", "Basic reports", "WhatsApp notifications", "Email support"],
  },
  {
    id: "growth", name: "Growth", price: 2499, period: "month",
    icon: Building2, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950",
    features: ["Up to 200 students", "10 staff accounts", "Advanced analytics", "AI Growth Cards", "SMS + WhatsApp", "Priority support"],
    current: true,
  },
  {
    id: "enterprise", name: "Enterprise", price: 5999, period: "month",
    icon: Crown, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950",
    features: ["Unlimited students", "Unlimited staff", "Custom branding", "API access", "Dedicated manager", "SLA support"],
  },
];

const BILLING_HISTORY = [
  { date: "2025-04-01", amount: 2499, status: "PAID",    description: "Growth Plan — April 2025" },
  { date: "2025-03-01", amount: 2499, status: "PAID",    description: "Growth Plan — March 2025" },
  { date: "2025-02-01", amount: 2499, status: "PAID",    description: "Growth Plan — February 2025" },
  { date: "2025-01-01", amount: 2499, status: "PAID",    description: "Growth Plan — January 2025" },
];

export default function SettingsBillingPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subscription & Billing</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your plan and billing history</p>
      </div>

      {/* Current plan banner */}
      <div className="rounded-xl border-2 border-violet-300 bg-gradient-to-r from-violet-50 to-card dark:from-violet-950/30 dark:to-card p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide">Current Plan</p>
          <p className="text-2xl font-bold mt-0.5">Growth</p>
          <p className="text-sm text-muted-foreground">Next billing: May 1, 2025 · ₹2,499/month</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">Cancel Plan</button>
          <button className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors">Upgrade</button>
        </div>
      </div>

      {/* Plans */}
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map(plan => (
          <div key={plan.id} className={cn(
            "rounded-xl border p-5 space-y-4 relative",
            plan.current && "border-violet-300 shadow-md"
          )}>
            {plan.current && (
              <span className="absolute -top-3 left-4 rounded-full bg-violet-600 px-3 py-0.5 text-[10px] font-bold text-white">
                CURRENT
              </span>
            )}
            <div>
              <div className={cn("inline-flex rounded-lg p-2 mb-3", plan.bg)}>
                <plan.icon className={cn("h-5 w-5", plan.color)} />
              </div>
              <p className="font-bold text-lg">{plan.name}</p>
              <p className="text-2xl font-bold mt-1">₹{plan.price.toLocaleString("en-IN")}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
            </div>
            <ul className="space-y-2">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button className={cn(
              "w-full rounded-lg py-2 text-sm font-medium transition-colors",
              plan.current
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )} disabled={plan.current}>
              {plan.current ? "Current Plan" : "Switch to " + plan.name}
            </button>
          </div>
        ))}
      </div>

      {/* Billing history */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="border-b px-5 py-4">
          <h3 className="font-semibold text-sm">Billing History</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              {["Date","Description","Amount","Status","Receipt"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BILLING_HISTORY.map((b, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(b.date),"dd MMM yyyy")}</td>
                <td className="px-4 py-3 font-medium">{b.description}</td>
                <td className="px-4 py-3 font-semibold">₹{b.amount.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-medium">
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="text-xs text-primary hover:underline">Download</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
