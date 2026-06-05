"use client";

import { useState } from "react";

const tabs = ["Overview", "Attendance", "Fees", "Growth", "Notifications"] as const;
type Tab = typeof tabs[number];

const attendance = [
  { date: "06 May", subject: "Physics", status: "Present" },
  { date: "05 May", subject: "Maths", status: "Present" },
  { date: "04 May", subject: "Chemistry", status: "Absent" },
];

const fees = [
  { invoice: "INV-2041", amount: "₹18,000", status: "Pending", due: "12 May" },
  { invoice: "INV-1988", amount: "₹22,000", status: "Paid", due: "20 Apr" },
];

const notifications = [
  "Physics extra class scheduled for Saturday at 10:00 AM.",
  "Term 2 fee reminder has been generated.",
  "Growth card for April is ready to review.",
];

export default function ParentPortalHome() {
  const [signedIn, setSignedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  if (!signedIn) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-medium text-blue-700">CoachGenie Parent Portal</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Parent sign in</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Access attendance, fee invoices, growth cards, and institute notifications.
            </p>
            <div className="mt-6 space-y-4">
              <input className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600" placeholder="parent@demo.com" />
              <input className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600" placeholder="Password" type="password" />
              <button onClick={() => setSignedIn(true)} className="h-11 w-full rounded-lg bg-blue-700 text-sm font-semibold text-white transition-colors hover:bg-blue-800">
                Sign in
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">CoachGenie Parent Portal</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Aarav Sharma</h1>
            <p className="mt-2 text-sm text-slate-600">Class 11 · JEE 2025 Batch A · Parent: Suresh Sharma</p>
          </div>
          <button onClick={() => setSignedIn(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-white">
            Sign out
          </button>
        </header>

        <nav className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTab === tab ? "bg-blue-700 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>
              {tab}
            </button>
          ))}
        </nav>

        {activeTab === "Overview" && (
          <section className="grid gap-4 md:grid-cols-3">
            {[
              ["Attendance", "92%", "Last 30 days"],
              ["Pending Fees", "₹18,000", "Due 12 May"],
              ["Latest Exam", "82/100", "Physics Mid Term"],
            ].map(([label, value, detail]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-3 text-2xl font-bold">{value}</p>
                <p className="mt-1 text-sm text-slate-600">{detail}</p>
              </div>
            ))}
          </section>
        )}

        {activeTab === "Attendance" && (
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {attendance.map((row) => (
              <div key={`${row.date}-${row.subject}`} className="flex items-center justify-between border-b border-slate-100 px-5 py-4 last:border-b-0">
                <div>
                  <p className="font-medium">{row.subject}</p>
                  <p className="text-sm text-slate-500">{row.date}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${row.status === "Present" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  {row.status}
                </span>
              </div>
            ))}
          </section>
        )}

        {activeTab === "Fees" && (
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {fees.map((row) => (
              <div key={row.invoice} className="grid gap-2 border-b border-slate-100 px-5 py-4 last:border-b-0 sm:grid-cols-4 sm:items-center">
                <p className="font-medium">{row.invoice}</p>
                <p>{row.amount}</p>
                <p className="text-sm text-slate-500">Due {row.due}</p>
                <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50">
                  {row.status === "Paid" ? "Receipt" : "Pay Now"}
                </button>
              </div>
            ))}
          </section>
        )}

        {activeTab === "Growth" && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">April Growth Summary</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Aarav is performing strongly in Physics and needs steadier practice in Chemistry numericals. Recommended next action: two remedial worksheets and one parent-teacher check-in this week.
            </p>
          </section>
        )}

        {activeTab === "Notifications" && (
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {notifications.map((note) => (
              <p key={note} className="border-b border-slate-100 px-5 py-4 text-sm text-slate-700 last:border-b-0">{note}</p>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
