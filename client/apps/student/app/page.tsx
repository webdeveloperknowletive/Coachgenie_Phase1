"use client";

import { useState } from "react";

const tabs = ["Today", "Attendance", "Exams", "Growth"] as const;
type Tab = typeof tabs[number];

const examRows = [
  { exam: "Physics Mid Term", marks: "82/100", rank: "2" },
  { exam: "Math Unit Test", marks: "45/50", rank: "1" },
  { exam: "Chemistry Quiz", marks: "34/50", rank: "5" },
];

const attendanceRows = [
  { month: "May", value: "92%" },
  { month: "April", value: "88%" },
  { month: "March", value: "94%" },
];

export default function StudentPortalHome() {
  const [signedIn, setSignedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Today");

  if (!signedIn) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-8 text-white">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-sm">
            <p className="text-sm font-medium text-cyan-300">CoachGenie Student Portal</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Student sign in</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              View sessions, attendance, results, and your growth card.
            </p>
            <div className="mt-6 space-y-4">
              <input className="h-11 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-cyan-300" placeholder="student@demo.com" />
              <input className="h-11 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-cyan-300" placeholder="Password" type="password" />
              <button onClick={() => setSignedIn(true)} className="h-11 w-full rounded-lg bg-cyan-400 text-sm font-semibold text-zinc-950 transition-colors hover:bg-cyan-300">
                Sign in
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-300">CoachGenie Student Portal</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Welcome, Aarav</h1>
            <p className="mt-2 text-sm text-zinc-300">JEE 2025 Batch A · Class 11</p>
          </div>
          <button onClick={() => setSignedIn(false)} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10">
            Sign out
          </button>
        </header>

        <nav className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTab === tab ? "bg-cyan-400 text-zinc-950" : "border border-white/10 bg-white/5 text-zinc-200"}`}>
              {tab}
            </button>
          ))}
        </nav>

        {activeTab === "Today" && (
          <section className="grid gap-4 md:grid-cols-3">
            {[
              ["Next Session", "Physics", "Today, 4:00 PM"],
              ["Task", "Chemistry worksheet", "Due tomorrow"],
              ["Alert", "Growth card ready", "Review insights"],
            ].map(([label, value, detail]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-5 shadow-sm">
                <p className="text-sm text-zinc-400">{label}</p>
                <p className="mt-3 text-2xl font-bold">{value}</p>
                <p className="mt-1 text-sm text-zinc-300">{detail}</p>
              </div>
            ))}
          </section>
        )}

        {activeTab === "Attendance" && (
          <section className="rounded-xl border border-white/10 bg-white/5 shadow-sm">
            {attendanceRows.map((row) => (
              <div key={row.month} className="flex items-center justify-between border-b border-white/10 px-5 py-4 last:border-b-0">
                <p className="font-medium">{row.month}</p>
                <p className="text-cyan-300">{row.value}</p>
              </div>
            ))}
          </section>
        )}

        {activeTab === "Exams" && (
          <section className="rounded-xl border border-white/10 bg-white/5 shadow-sm">
            {examRows.map((row) => (
              <div key={row.exam} className="grid gap-2 border-b border-white/10 px-5 py-4 last:border-b-0 sm:grid-cols-3">
                <p className="font-medium">{row.exam}</p>
                <p className="text-zinc-300">{row.marks}</p>
                <p className="text-cyan-300">Rank {row.rank}</p>
              </div>
            ))}
          </section>
        )}

        {activeTab === "Growth" && (
          <section className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Growth Card</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300">
              You are improving consistently in problem-solving speed. Focus this week: Chemistry numericals and revising rotational motion formulas before the next session.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
