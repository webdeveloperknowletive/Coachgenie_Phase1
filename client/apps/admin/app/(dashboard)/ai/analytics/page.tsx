"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import {
  Sparkles,
  TrendingUp,
  Users,
  IndianRupee,
  CheckSquare,
  BarChart3,
  Brain,
} from "lucide-react";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { useAcademicStore } from "@/lib/stores/academic.store";
import { useFinanceStore } from "@/lib/stores/finance.store";
import { buildInstituteContext } from "@/lib/ai/context";
import { useCoachGenieChat } from "@/hooks/ai.hooks";

import { ConsentGate } from "@/components/ai/ConsentGate";
import { MessageBubble } from "@/components/ai/MessageBubble";
import { SuggestedPrompts } from "@/components/ai/SuggestedPrompts";
import { ChatInput } from "@/components/ai/ChatInput";

import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Chart Data
// ─────────────────────────────────────────────────────────────

const FEE_DATA = [
  { month: "Jul", collected: 310000, target: 350000 },
  { month: "Aug", collected: 280000, target: 350000 },
  { month: "Sep", collected: 390000, target: 350000 },
  { month: "Oct", collected: 420000, target: 400000 },
  { month: "Nov", collected: 365000, target: 400000 },
  { month: "Dec", collected: 480000, target: 400000 },
  { month: "Jan", collected: 445000, target: 450000 },
  { month: "Feb", collected: 510000, target: 450000 },
  { month: "Mar", collected: 490000, target: 500000 },
  { month: "Apr", collected: 480000, target: 500000 },
];

const BATCH_PERFORMANCE = [
  { name: "Math A", avg: 74, students: 3 },
  { name: "Physics A", avg: 87, students: 2 },
  { name: "NEET Bio", avg: 82, students: 3 },
  { name: "JEE Chem", avg: 0, students: 1 },
];

const COLORS = [
  "hsl(213 94% 40%)",
  "hsl(142 71% 45%)",
  "hsl(262 80% 58%)",
  "hsl(38 92% 50%)",
];

// ─────────────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  bg,
  onClick,
  active,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 text-left w-full transition-all hover:shadow-md",
        active
          ? "border-primary/40 bg-primary/5 shadow-sm"
          : "bg-card hover:border-border"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground">
          {label}
        </p>

        <div className={cn("rounded-lg p-1.5", bg)}>
          <Icon className={cn("h-3.5 w-3.5", color)} />
        </div>
      </div>

      <p className="text-2xl font-bold">{value}</p>

      <p className="text-xs text-muted-foreground mt-0.5">
        {sub}
      </p>

      {active && (
        <p className="text-[10px] text-primary mt-1.5 flex items-center gap-1">
          <Sparkles className="h-2.5 w-2.5" />
          Ask AI about this
        </p>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────

export default function AiAnalyticsPage() {
  const bottomRef = useRef<HTMLDivElement>(null);

  const [activeKpi, setActiveKpi] = useState<string | null>(null);

  const academic = useAcademicStore();
  const finance = useFinanceStore();

  // Stable Context
  const instituteContext = useMemo(
    () =>
      buildInstituteContext(
        {
          students: academic.students,
          batches: academic.batches,
          attendance: academic.attendance,
          exams: academic.exams,
        },
        {
          invoices: finance.invoices,
        }
      ),
    [
      academic.students,
      academic.batches,
      academic.attendance,
      academic.exams,
      finance.invoices,
    ]
  );

  // AI Hook
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    sendMessage,
  } = useCoachGenieChat({
    context: instituteContext,

    apiEndpoint:
      "https://coachgenie-phase1-s227.onrender.com/copilot/chat",
  });

  // Auto Scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // KPI Click
  async function handleKpiClick(
    kpiId: string,
    question: string
  ) {
    if (activeKpi === kpiId) {
      setActiveKpi(null);
      return;
    }

    setActiveKpi(kpiId);

    await sendMessage(question);
  }

  // Metrics
  const totalCollected = finance.invoices.reduce(
    (s, i) => s + i.paid,
    0
  );

  const activeStudents = academic.students.filter(
    (s) => s.status === "ACTIVE"
  ).length;

  const totalRecords = academic.attendance.slice(0, 150);

  const presentCount = totalRecords.filter(
    (a) => a.status === "PRESENT"
  ).length;

  const attPct =
    totalRecords.length > 0
      ? Math.round(
          (presentCount / totalRecords.length) * 100
        )
      : 0;

  // KPI DATA
  const KPIS = [
    {
      id: "fee",
      label: "Fee Collected",
      value: `₹${(totalCollected / 100000).toFixed(1)}L`,
      sub: "of ₹2.64L target",
      icon: IndianRupee,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950",
      question:
        "Analyze the fee collection status and tell me what needs immediate attention.",
    },

    {
      id: "students",
      label: "Active Students",
      value: activeStudents.toString(),
      sub: "of 6 enrolled",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
      question:
        "Summarize student performance and flag any at-risk students.",
    },

    {
      id: "attendance",
      label: "Attendance Rate",
      value: `${attPct}%`,
      sub: "last 30 days",
      icon: CheckSquare,
      color: "text-violet-600",
      bg: "bg-violet-50 dark:bg-violet-950",
      question:
        "Analyze attendance patterns and identify students who need intervention.",
    },

    {
      id: "exams",
      label: "Avg Exam Score",
      value: "80%",
      sub: "across 2 exams",
      icon: BarChart3,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950",
      question:
        "Summarize exam results and rank student performance across all batches.",
    },
  ];

  return (
    <div className="space-y-5">
      {/* HEADER */}

      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Brain className="h-5 w-5 text-primary" />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            AI Analytics Copilot

            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3 w-3" />
              Powered by Claude
            </span>
          </h1>

          <p className="text-sm text-muted-foreground mt-0.5">
            Click any metric to get an AI analysis, or ask your own question below
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* LEFT */}

        <div className="lg:col-span-2 space-y-4">

          {/* KPI GRID */}

          <div className="grid grid-cols-2 gap-3">
            {KPIS.map((kpi) => (
              <KpiCard
                key={kpi.id}
                {...kpi}
                active={activeKpi === kpi.id}
                onClick={() =>
                  handleKpiClick(kpi.id, kpi.question)
                }
              />
            ))}
          </div>

          {/* FEE CHART */}

          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-sm">
                  Fee Collection vs Target
                </h3>

                <p className="text-xs text-muted-foreground">
                  Current academic year
                </p>
              </div>

              <button
                onClick={() =>
                  handleKpiClick(
                    "fee-chart",
                    "Look at the fee collection trend. In which months did we underperform vs target, and what should we do differently next month?"
                  )
                }
                className="flex items-center gap-1 text-[10px] text-primary hover:underline"
              >
                <Sparkles className="h-2.5 w-2.5" />
                Ask AI
              </button>
            </div>

            <ResponsiveContainer width="100%" height={180}>
              <AreaChart
                data={FEE_DATA}
                margin={{
                  top: 4,
                  right: 4,
                  left: -16,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="collGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(213 94% 40%)"
                      stopOpacity={0.2}
                    />

                    <stop
                      offset="95%"
                      stopColor="hsl(213 94% 40%)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />

                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  tickFormatter={(v) => `₹${v / 100000}L`}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  formatter={(v, name) => [
                    `₹${(Number(v ?? 0) / 100000).toFixed(1)}L`,
                    name === "collected"
                      ? "Collected"
                      : "Target",
                  ]}
                />

                <Area
                  type="monotone"
                  dataKey="target"
                  stroke="hsl(var(--border))"
                  strokeWidth={1.5}
                  fill="none"
                  strokeDasharray="4 4"
                />

                <Area
                  type="monotone"
                  dataKey="collected"
                  stroke="hsl(213 94% 40%)"
                  strokeWidth={2}
                  fill="url(#collGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* BATCH PERFORMANCE */}

          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-sm">
                  Batch Avg Performance
                </h3>

                <p className="text-xs text-muted-foreground">
                  Exam average scores
                </p>
              </div>

              <button
                onClick={() =>
                  handleKpiClick(
                    "batch-chart",
                    "Which batch is performing best and worst? What should I do to improve the underperforming batch?"
                  )
                }
                className="flex items-center gap-1 text-[10px] text-primary hover:underline"
              >
                <Sparkles className="h-2.5 w-2.5" />
                Ask AI
              </button>
            </div>

            <ResponsiveContainer width="100%" height={150}>
              <BarChart
                data={BATCH_PERFORMANCE}
                margin={{
                  top: 4,
                  right: 4,
                  left: -16,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  formatter={(v) => [
                    `${Number(v ?? 0)}%`,
                    "Avg Score",
                  ]}
                />

                <Bar
                  dataKey="avg"
                  radius={[4, 4, 0, 0]}
                >
                  {BATCH_PERFORMANCE.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[i % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT CHAT PANEL */}

        <div className="lg:col-span-1">
          <div
            className="sticky top-6 rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col"
            style={{ height: "600px" }}
          >
            <div className="flex items-center gap-2.5 border-b px-4 py-3 bg-card/80">
              <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>

              <div>
                <p className="text-xs font-bold">
                  Analytics Copilot
                </p>

                <p className="text-[10px] text-muted-foreground">
                  Context-aware • Real-time
                </p>
              </div>

              <div className="ml-auto flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />

                <span className="text-[10px] text-emerald-600">
                  Live
                </span>
              </div>
            </div>

            <ConsentGate>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
                    <TrendingUp className="h-8 w-8 text-primary/30" />

                    <p className="text-xs text-muted-foreground">
                      Click any chart or metric for instant AI analysis
                    </p>
                  </div>
                )}

                {messages.map((m: any, i: number) => (
                  <MessageBubble
                    key={m.id}
                    role={m.role}
                    content={m.content}

                    type={m.type}

                    reportUrl={m.reportUrl}

                    isLast={i === messages.length - 1}
                    isStreaming={isLoading}
                  />
                ))}

                {isLoading &&
                  messages[messages.length - 1]?.role ===
                    "user" && (
                    <div className="flex gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                      </div>

                      <div className="space-y-1.5 py-2">
                        <div className="h-2 w-28 rounded-full bg-muted animate-pulse" />
                        <div className="h-2 w-40 rounded-full bg-muted animate-pulse" />
                        <div className="h-2 w-20 rounded-full bg-muted animate-pulse" />
                      </div>
                    </div>
                  )}

                <div ref={bottomRef} />
              </div>

              {messages.length === 0 && (
                <SuggestedPrompts
                  onSelect={(p: string) =>
                    sendMessage(p)
                  }
                />
              )}

              <ChatInput
                input={input}
                isLoading={isLoading}
                onInputChange={handleInputChange}
                onSubmit={handleSubmit}
                onStop={stop}
                placeholder="Ask about your data…"
              />
            </ConsentGate>
          </div>
        </div>
      </div>
    </div>
  );
}

// "use client";
// import { useRef, useEffect, useState } from "react";
// import {
//   Sparkles, TrendingUp, Users, IndianRupee,
//   CheckSquare, BarChart3, Brain,
// } from "lucide-react";
// import {
//   AreaChart, Area, BarChart, Bar, XAxis, YAxis,
//   CartesianGrid, Tooltip, ResponsiveContainer, Cell,
// } from "recharts";
// import { useAcademicStore }     from "@/lib/stores/academic.store";
// import { useFinanceStore }      from "@/lib/stores/finance.store";
// import { buildInstituteContext } from "@/lib/ai/context";
// import { useCoachGenieChat }     from "@/hooks/ai.hooks";
// import { ConsentGate }           from "@/components/ai/ConsentGate";
// import { MessageBubble }         from "@/components/ai/MessageBubble";
// import { SuggestedPrompts }      from "@/components/ai/SuggestedPrompts";
// import { ChatInput }             from "@/components/ai/ChatInput";
// import { MarkdownRenderer }      from "@/components/ai/MarkdownRenderer";
// import { cn }                    from "@/lib/utils";

// // ── Chart data ─────────────────────────────────────────────────
// const FEE_DATA = [
//   { month:"Jul", collected:310000, target:350000 },
//   { month:"Aug", collected:280000, target:350000 },
//   { month:"Sep", collected:390000, target:350000 },
//   { month:"Oct", collected:420000, target:400000 },
//   { month:"Nov", collected:365000, target:400000 },
//   { month:"Dec", collected:480000, target:400000 },
//   { month:"Jan", collected:445000, target:450000 },
//   { month:"Feb", collected:510000, target:450000 },
//   { month:"Mar", collected:490000, target:500000 },
//   { month:"Apr", collected:480000, target:500000 },
// ];

// const BATCH_PERFORMANCE = [
//   { name:"Math A",      avg: 74, students: 3 },
//   { name:"Physics A",   avg: 87, students: 2 },
//   { name:"NEET Bio",    avg: 82, students: 3 },
//   { name:"JEE Chem",    avg: 0,  students: 1 },
// ];

// const COLORS = ["hsl(213 94% 40%)","hsl(142 71% 45%)","hsl(262 80% 58%)","hsl(38 92% 50%)"];

// // ── KPI card ───────────────────────────────────────────────────
// function KpiCard({ label, value, sub, icon: Icon, color, bg, onClick, active }:{
//   label:string; value:string; sub:string; icon:React.ElementType;
//   color:string; bg:string; onClick:()=>void; active:boolean;
// }) {
//   return (
//     <button onClick={onClick}
//       className={cn(
//         "rounded-xl border p-4 text-left w-full transition-all hover:shadow-md",
//         active ? "border-primary/40 bg-primary/5 shadow-sm" : "bg-card hover:border-border"
//       )}>
//       <div className="flex items-start justify-between mb-2">
//         <p className="text-xs font-medium text-muted-foreground">{label}</p>
//         <div className={cn("rounded-lg p-1.5", bg)}>
//           <Icon className={cn("h-3.5 w-3.5", color)} />
//         </div>
//       </div>
//       <p className="text-2xl font-bold">{value}</p>
//       <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
//       {active && (
//         <p className="text-[10px] text-primary mt-1.5 flex items-center gap-1">
//           <Sparkles className="h-2.5 w-2.5" /> Ask AI about this
//         </p>
//       )}
//     </button>
//   );
// }

// export default function AiAnalyticsPage() {
//   const bottomRef  = useRef<HTMLDivElement>(null);
//   const [activeKpi, setActiveKpi] = useState<string | null>(null);

//   const academic = useAcademicStore();
//   const finance  = useFinanceStore();

//   const context = buildInstituteContext(
//     { students: academic.students, batches: academic.batches, attendance: academic.attendance, exams: academic.exams },
//     { invoices: finance.invoices }
//   );

//   // CHANGED: pass apiEndpoint so the hook POSTs to /copilot/chat
//   const { messages, input, handleInputChange, handleSubmit, isLoading, stop, sendMessage } =
//     useCoachGenieChat({ context, apiEndpoint: "/copilot/chat" });

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // CHANGED: sendMessage signature aligned — { message, context }
//   async function handleKpiClick(kpiId: string, question: string) {
//     if (activeKpi === kpiId) {
//       setActiveKpi(null);
//       return;
//     }
//     setActiveKpi(kpiId);
//     await sendMessage({ message: question });
//   }

//   const totalCollected = finance.invoices.reduce((s, i) => s + i.paid, 0);
//   const activeStudents = academic.students.filter(s => s.status === "ACTIVE").length;
//   const totalRecords   = academic.attendance.slice(0, 150);
//   const presentCount   = totalRecords.filter(a => a.status === "PRESENT").length;
//   const attPct         = totalRecords.length > 0 ? Math.round((presentCount/totalRecords.length)*100) : 0;

//   const KPIS = [
//     { id:"fee",       label:"Fee Collected",   value:`₹${(totalCollected/100000).toFixed(1)}L`,  sub:"of ₹2.64L target", icon:IndianRupee,  color:"text-emerald-600", bg:"bg-emerald-50 dark:bg-emerald-950", question:"Analyze the fee collection status and tell me what needs immediate attention." },
//     { id:"students",  label:"Active Students", value:activeStudents.toString(),                   sub:"of 6 enrolled",    icon:Users,        color:"text-blue-600",    bg:"bg-blue-50 dark:bg-blue-950",       question:"Summarize student performance and flag any at-risk students." },
//     { id:"attendance",label:"Attendance Rate",  value:`${attPct}%`,                               sub:"last 30 days",     icon:CheckSquare,  color:"text-violet-600",  bg:"bg-violet-50 dark:bg-violet-950",   question:"Analyze attendance patterns and identify students who need intervention." },
//     { id:"exams",     label:"Avg Exam Score",   value:"80%",                                      sub:"across 2 exams",   icon:BarChart3,    color:"text-amber-600",   bg:"bg-amber-50 dark:bg-amber-950",     question:"Summarize exam results and rank student performance across all batches." },
//   ];

//   return (
//     <div className="space-y-5">
//       <div className="flex items-start gap-3">
//         <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
//           <Brain className="h-5 w-5 text-primary" />
//         </div>
//         <div>
//           <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
//             AI Analytics Copilot
//             <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
//               <Sparkles className="h-3 w-3" /> Powered by Claude
//             </span>
//           </h1>
//           <p className="text-sm text-muted-foreground mt-0.5">
//             Click any metric to get an AI analysis, or ask your own question below
//           </p>
//         </div>
//       </div>

//       <div className="grid gap-4 lg:grid-cols-3">
//         {/* Left: charts + KPIs */}
//         <div className="lg:col-span-2 space-y-4">
//           {/* KPI grid */}
//           <div className="grid grid-cols-2 gap-3">
//             {KPIS.map(kpi => (
//               <KpiCard key={kpi.id} {...kpi}
//                 active={activeKpi === kpi.id}
//                 onClick={() => handleKpiClick(kpi.id, kpi.question)}
//               />
//             ))}
//           </div>

//           {/* Fee chart */}
//           <div className="rounded-xl border bg-card p-5">
//             <div className="flex items-center justify-between mb-4">
//               <div>
//                 <h3 className="font-semibold text-sm">Fee Collection vs Target</h3>
//                 <p className="text-xs text-muted-foreground">Current academic year</p>
//               </div>
//               <button
//                 onClick={() => handleKpiClick("fee-chart", "Look at the fee collection trend. In which months did we underperform vs target, and what should we do differently next month?")}
//                 className="flex items-center gap-1 text-[10px] text-primary hover:underline"
//               >
//                 <Sparkles className="h-2.5 w-2.5" /> Ask AI
//               </button>
//             </div>
//             <ResponsiveContainer width="100%" height={180}>
//               <AreaChart data={FEE_DATA} margin={{ top:4, right:4, left:-16, bottom:0 }}>
//                 <defs>
//                   <linearGradient id="collGrad" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="5%"  stopColor="hsl(213 94% 40%)" stopOpacity={0.2} />
//                     <stop offset="95%" stopColor="hsl(213 94% 40%)" stopOpacity={0} />
//                   </linearGradient>
//                 </defs>
//                 <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
//                 <XAxis dataKey="month" tick={{ fontSize:10 }} tickLine={false} axisLine={false} />
//                 <YAxis tickFormatter={v=>`₹${v/100000}L`} tick={{ fontSize:10 }} tickLine={false} axisLine={false} />
//                 <Tooltip formatter={(v, name) => [`₹${(Number(v ?? 0)/100000).toFixed(1)}L`, name==="collected"?"Collected":"Target"]} />
//                 <Area type="monotone" dataKey="target" stroke="hsl(var(--border))" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
//                 <Area type="monotone" dataKey="collected" stroke="hsl(213 94% 40%)" strokeWidth={2} fill="url(#collGrad)" />
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>

//           {/* Batch performance */}
//           <div className="rounded-xl border bg-card p-5">
//             <div className="flex items-center justify-between mb-4">
//               <div>
//                 <h3 className="font-semibold text-sm">Batch Avg Performance</h3>
//                 <p className="text-xs text-muted-foreground">Exam average scores</p>
//               </div>
//               <button
//                 onClick={() => handleKpiClick("batch-chart", "Which batch is performing best and worst? What should I do to improve the underperforming batch?")}
//                 className="flex items-center gap-1 text-[10px] text-primary hover:underline"
//               >
//                 <Sparkles className="h-2.5 w-2.5" /> Ask AI
//               </button>
//             </div>
//             <ResponsiveContainer width="100%" height={150}>
//               <BarChart data={BATCH_PERFORMANCE} margin={{ top:4, right:4, left:-16, bottom:0 }}>
//                 <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
//                 <XAxis dataKey="name" tick={{ fontSize:10 }} tickLine={false} axisLine={false} />
//                 <YAxis domain={[0,100]} tick={{ fontSize:10 }} tickLine={false} axisLine={false} />
//                 <Tooltip formatter={(v) => [`${Number(v ?? 0)}%`, "Avg Score"]} />
//                 <Bar dataKey="avg" radius={[4,4,0,0]}>
//                   {BATCH_PERFORMANCE.map((_,i) => (
//                     <Cell key={i} fill={COLORS[i % COLORS.length]} />
//                   ))}
//                 </Bar>
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* Right: chat panel */}
//         <div className="lg:col-span-1">
//           <div className="sticky top-6 rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col" style={{ height:"600px" }}>
//             <div className="flex items-center gap-2.5 border-b px-4 py-3 bg-card/80">
//               <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
//                 <Sparkles className="h-3.5 w-3.5 text-primary" />
//               </div>
//               <div>
//                 <p className="text-xs font-bold">Analytics Copilot</p>
//                 <p className="text-[10px] text-muted-foreground">Context-aware • Real-time</p>
//               </div>
//               <div className="ml-auto flex items-center gap-1">
//                 <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
//                 <span className="text-[10px] text-emerald-600">Live</span>
//               </div>
//             </div>

//             <ConsentGate>
//               <div className="flex-1 overflow-y-auto p-3 space-y-3">
//                 {messages.length === 0 && (
//                   <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
//                     <TrendingUp className="h-8 w-8 text-primary/30" />
//                     <p className="text-xs text-muted-foreground">
//                       Click any chart or metric for instant AI analysis
//                     </p>
//                   </div>
//                 )}
//                 {messages.map((m: any, i: number) => (
//                   <MessageBubble
//                     key={m.id}
//                     role={m.role as "user" | "assistant"}
//                     content={m.content}
//                     isLast={i === messages.length - 1}
//                     isStreaming={isLoading}
//                   />
//                 ))}
//                 {isLoading && messages[messages.length-1]?.role === "user" && (
//                   <div className="flex gap-2">
//                     <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
//                       <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
//                     </div>
//                     <div className="space-y-1.5 py-2">
//                       <div className="h-2 w-28 rounded-full bg-muted animate-pulse" />
//                       <div className="h-2 w-40 rounded-full bg-muted animate-pulse" />
//                       <div className="h-2 w-20 rounded-full bg-muted animate-pulse" />
//                     </div>
//                   </div>
//                 )}
//                 <div ref={bottomRef} />
//               </div>

//               {messages.length === 0 && (
//                 // CHANGED: sendMessage signature aligned — { message, context }
//                 <SuggestedPrompts onSelect={p => sendMessage({ p })} />
//               )}

//               <ChatInput
//                 input={input} isLoading={isLoading}
//                 onInputChange={handleInputChange}
//                 onSubmit={handleSubmit}
//                 onStop={stop}
//                 placeholder="Ask about your data…"
//               />
//             </ConsentGate>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
// "use client";
// import { useRef, useEffect, useState, useMemo } from "react";
// import {
//   Sparkles, TrendingUp, Users, IndianRupee,
//   CheckSquare, BarChart3, Brain,
// } from "lucide-react";
// import {
//   AreaChart, Area, BarChart, Bar, XAxis, YAxis,
//   CartesianGrid, Tooltip, ResponsiveContainer, Cell,
// } from "recharts";

// import { useAcademicStore } from "@/lib/stores/academic.store";
// import { useFinanceStore } from "@/lib/stores/finance.store";
// import { buildInstituteContext } from "@/lib/ai/context";
// import { useCoachGenieChat } from "@/hooks/ai.hooks";

// import { ConsentGate } from "@/components/ai/ConsentGate";
// import { MessageBubble } from "@/components/ai/MessageBubble";
// import { SuggestedPrompts } from "@/components/ai/SuggestedPrompts";
// import { ChatInput } from "@/components/ai/ChatInput";
// import { cn } from "@/lib/utils";

// // ── Chart data ─────────────────────────────────────────────────
// const FEE_DATA = [/* unchanged */];
// const BATCH_PERFORMANCE = [/* unchanged */];
// const COLORS = ["hsl(213 94% 40%)","hsl(142 71% 45%)","hsl(262 80% 58%)","hsl(38 92% 50%)"];

// // ── KPI card ───────────────────────────────────────────────────
// function KpiCard({ label, value, sub, icon: Icon, color, bg, onClick, active }: any) {
//   return (
//     <button onClick={onClick}
//       className={cn(
//         "rounded-xl border p-4 text-left w-full transition-all hover:shadow-md",
//         active ? "border-primary/40 bg-primary/5 shadow-sm" : "bg-card hover:border-border"
//       )}>
//       <div className="flex items-start justify-between mb-2">
//         <p className="text-xs font-medium text-muted-foreground">{label}</p>
//         <div className={cn("rounded-lg p-1.5", bg)}>
//           <Icon className={cn("h-3.5 w-3.5", color)} />
//         </div>
//       </div>
//       <p className="text-2xl font-bold">{value}</p>
//       <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
//       {active && (
//         <p className="text-[10px] text-primary mt-1.5 flex items-center gap-1">
//           <Sparkles className="h-2.5 w-2.5" /> Ask AI about this
//         </p>
//       )}
//     </button>
//   );
// }

// export default function AiAnalyticsPage() {
//   const bottomRef = useRef<HTMLDivElement>(null);
//   const [activeKpi, setActiveKpi] = useState<string | null>(null);

//   const academic = useAcademicStore();
//   const finance = useFinanceStore();

//   // ✅ stable context
//   const context = useMemo(
//     () =>
//       buildInstituteContext(
//         {
//           students: academic.students,
//           batches: academic.batches,
//           attendance: academic.attendance,
//           exams: academic.exams,
//         },
//         { invoices: finance.invoices }
//       ),
//     [academic.students, academic.batches, academic.attendance, academic.exams, finance.invoices]
//   );

//   // ✅ FIXED HOOK USAGE (string-based contract)
//   const {
//     messages,
//     input,
//     handleInputChange,
//     handleSubmit,
//     isLoading,
//     stop,
//     sendMessage,
//   } = useCoachGenieChat({
//     context,
//     apiEndpoint: "/copilot/chat",
//   });

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // ✅ FIXED KPI CLICK
//   async function handleKpiClick(kpiId: string, question: string) {
//     if (activeKpi === kpiId) {
//       setActiveKpi(null);
//       return;
//     }
//     setActiveKpi(kpiId);
//     await sendMessage(question);
//   }

//   const totalCollected = finance.invoices.reduce((s, i) => s + i.paid, 0);
//   const activeStudents = academic.students.filter(s => s.status === "ACTIVE").length;

//   const totalRecords = academic.attendance.slice(0, 150);
//   const presentCount = totalRecords.filter(a => a.status === "PRESENT").length;
//   const attPct =
//     totalRecords.length > 0
//       ? Math.round((presentCount / totalRecords.length) * 100)
//       : 0;

//   const KPIS = [
//     {
//       id: "fee",
//       label: "Fee Collected",
//       value: `₹${(totalCollected / 100000).toFixed(1)}L`,
//       sub: "of ₹2.64L target",
//       icon: IndianRupee,
//       color: "text-emerald-600",
//       bg: "bg-emerald-50 dark:bg-emerald-950",
//       question: "Analyze the fee collection status and tell me what needs immediate attention.",
//     },
//     {
//       id: "students",
//       label: "Active Students",
//       value: activeStudents.toString(),
//       sub: "of 6 enrolled",
//       icon: Users,
//       color: "text-blue-600",
//       bg: "bg-blue-50 dark:bg-blue-950",
//       question: "Summarize student performance and flag any at-risk students.",
//     },
//     {
//       id: "attendance",
//       label: "Attendance Rate",
//       value: `${attPct}%`,
//       sub: "last 30 days",
//       icon: CheckSquare,
//       color: "text-violet-600",
//       bg: "bg-violet-50 dark:bg-violet-950",
//       question: "Analyze attendance patterns and identify students who need intervention.",
//     },
//     {
//       id: "exams",
//       label: "Avg Exam Score",
//       value: "80%",
//       sub: "across 2 exams",
//       icon: BarChart3,
//       color: "text-amber-600",
//       bg: "bg-amber-50 dark:bg-amber-950",
//       question: "Summarize exam results and rank student performance across all batches.",
//     },
//   ];

//   return (
//     <div className="space-y-5">

//       {/* HEADER (UNCHANGED UI) */}
//       <div className="flex items-start gap-3">
//         <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
//           <Brain className="h-5 w-5 text-primary" />
//         </div>
//         <div>
//           <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
//             AI Analytics Copilot
//             <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
//               <Sparkles className="h-3 w-3" /> Powered by Claude
//             </span>
//           </h1>
//           <p className="text-sm text-muted-foreground mt-0.5">
//             Click any metric to get an AI analysis, or ask your own question below
//           </p>
//         </div>
//       </div>

//       <div className="grid gap-4 lg:grid-cols-3">

//         {/* LEFT SIDE (UNCHANGED UI) */}
//         <div className="lg:col-span-2 space-y-4">

//           <div className="grid grid-cols-2 gap-3">
//             {KPIS.map((kpi) => (
//               <KpiCard
//                 key={kpi.id}
//                 {...kpi}
//                 active={activeKpi === kpi.id}
//                 onClick={() => handleKpiClick(kpi.id, kpi.question)}
//               />
//             ))}
//           </div>

//           {/* CHARTS unchanged (omitted for brevity but same as yours) */}

//         </div>

//         {/* RIGHT CHAT PANEL */}
//         <div className="lg:col-span-1">
//           <div className="sticky top-6 rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col" style={{ height: "600px" }}>

//             <ConsentGate>
//               <div className="flex-1 overflow-y-auto p-3 space-y-3">

//                 {messages.map((m: any, i: number) => (
//                   <MessageBubble
//                     key={m.id}
//                     role={m.role}
//                     content={m.content}
//                     isLast={i === messages.length - 1}
//                     isStreaming={isLoading}
//                   />
//                 ))}

//                 <div ref={bottomRef} />
//               </div>

//               {messages.length === 0 && (
//                 <SuggestedPrompts
//                   onSelect={(p: string) => sendMessage(p)}
//                 />
//               )}

//               <ChatInput
//                 input={input}
//                 isLoading={isLoading}
//                 onInputChange={handleInputChange}
//                 onSubmit={handleSubmit}
//                 onStop={stop}
//                 placeholder="Ask about your data…"
//               />
//             </ConsentGate>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
