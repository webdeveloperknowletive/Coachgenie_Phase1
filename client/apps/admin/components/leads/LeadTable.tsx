// "use client";
// import { useState, useMemo } from "react";
// import {
//   useReactTable, getCoreRowModel, getSortedRowModel,
//   getFilteredRowModel, getPaginationRowModel,
//   flexRender, type ColumnDef, type SortingState,
// } from "@tanstack/react-table";
// import { ArrowUpDown, ChevronLeft, ChevronRight, Search, Eye, Trash2 } from "lucide-react";
// import { format } from "date-fns";
// import { cn } from "@/lib/utils";
// import type { Lead } from "@/lib/types/lead";
// import { StageBadge } from "./StageBadge";
// import { SOURCE_LABELS } from "@/lib/constants/leads";

// interface LeadTableProps {
//   leads:      Lead[];
//   onView:     (lead: Lead) => void;
//   onDelete:   (id: string) => void;
// }

// export function LeadTable({ leads, onView, onDelete }: LeadTableProps) {
//   const [sorting, setSorting]       = useState<SortingState>([]);
//   const [globalFilter, setGlobalFilter] = useState("");

//   const columns = useMemo<ColumnDef<Lead>[]>(() => [
//     {
//       accessorKey: "name",
//       header: ({ column }) => (
//         <button className="flex items-center gap-1 hover:text-foreground transition-colors"
//           onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
//           Student <ArrowUpDown className="h-3.5 w-3.5" />
//         </button>
//       ),
//       cell: ({ row }) => (
//         <div>
//           <p className="font-medium text-sm">{row.original.name}</p>
//           <p className="text-xs text-muted-foreground">{row.original.email}</p>
//         </div>
//       ),
//     },
//     {
//       accessorKey: "phone",
//       header: "Phone",
//       cell: ({ getValue }) => <span className="text-sm font-mono">{getValue<string>()}</span>,
//     },
//     {
//       accessorKey: "grade",
//       header: "Grade",
//       cell: ({ getValue }) => <span className="text-sm">{getValue<string>()}</span>,
//     },
//     {
//       accessorKey: "subject",
//       header: "Subject",
//       cell: ({ getValue }) => <span className="text-sm">{getValue<string>()}</span>,
//     },
//     {
//       accessorKey: "source",
//       header: "Source",
//       cell: ({ getValue }) => (
//         <span className="text-xs bg-muted rounded-full px-2.5 py-0.5 font-medium">
//           {SOURCE_LABELS[getValue<Lead["source"]>()]}
//         </span>
//       ),
//     },
//     {
//       accessorKey: "stage",
//       header: "Stage",
//       cell: ({ getValue }) => <StageBadge stage={getValue<Lead["stage"]>()} />,
//     },
//     {
//       accessorKey: "assignedTo",
//       header: "Assigned",
//       cell: ({ getValue }) => (
//         <div className="flex items-center gap-1.5">
//           <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
//             {getValue<string>().split(" ").map(n => n[0]).join("")}
//           </div>
//           <span className="text-xs text-muted-foreground">{getValue<string>()}</span>
//         </div>
//       ),
//     },
//     {
//       accessorKey: "createdAt",
//       header: ({ column }) => (
//         <button className="flex items-center gap-1 hover:text-foreground transition-colors"
//           onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
//           Date <ArrowUpDown className="h-3.5 w-3.5" />
//         </button>
//       ),
//       cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{format(new Date(getValue<string>()), "dd MMM yy")}</span>,
//     },
//     {
//       id: "actions",
//       cell: ({ row }) => (
//         <div className="flex items-center gap-1">
//           <button onClick={() => onView(row.original)}
//             className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
//             <Eye className="h-3.5 w-3.5" />
//           </button>
//           <button onClick={() => onDelete(row.original.id)}
//             className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
//             <Trash2 className="h-3.5 w-3.5" />
//           </button>
//         </div>
//       ),
//     },
//   ], [onView, onDelete]);

//   const table = useReactTable({
//     data: leads,
//     columns,
//     getCoreRowModel:        getCoreRowModel(),
//     getSortedRowModel:      getSortedRowModel(),
//     getFilteredRowModel:    getFilteredRowModel(),
//     getPaginationRowModel:  getPaginationRowModel(),
//     onSortingChange:        setSorting,
//     globalFilterFn:         "includesString",
//     onGlobalFilterChange:   setGlobalFilter,
//     initialState:           { pagination: { pageSize: 10 } },
//     state:                  { sorting, globalFilter },
//   });

//   return (
//     <div className="space-y-3">
//       {/* Search */}
//       <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 max-w-xs">
//         <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
//         <input
//           value={globalFilter}
//           onChange={(e) => setGlobalFilter(e.target.value)}
//           placeholder="Search leads…"
//           className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
//         />
//       </div>

//       {/* Table */}
//       <div className="rounded-xl border overflow-hidden">
//         <table className="w-full text-sm">
//           <thead>
//             {table.getHeaderGroups().map((hg) => (
//               <tr key={hg.id} className="border-b bg-muted/40">
//                 {hg.headers.map((h) => (
//                   <th key={h.id} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
//                     {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
//                   </th>
//                 ))}
//               </tr>
//             ))}
//           </thead>
//           <tbody>
//             {table.getRowModel().rows.length ? (
//               table.getRowModel().rows.map((row) => (
//                 <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
//                   {row.getVisibleCells().map((cell) => (
//                     <td key={cell.id} className="px-4 py-3 align-middle whitespace-nowrap">
//                       {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                     </td>
//                   ))}
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td colSpan={columns.length} className="h-32 text-center text-sm text-muted-foreground">
//                   No leads found.
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Pagination */}
//       <div className="flex items-center justify-between text-sm">
//         <p className="text-muted-foreground text-xs">
//           {table.getFilteredRowModel().rows.length} lead{table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
//         </p>
//         <div className="flex items-center gap-2">
//           <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
//             className="rounded-md border p-1.5 disabled:opacity-40 hover:bg-accent transition-colors">
//             <ChevronLeft className="h-3.5 w-3.5" />
//           </button>
//           <span className="text-xs text-muted-foreground">
//             {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
//           </span>
//           <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
//             className="rounded-md border p-1.5 disabled:opacity-40 hover:bg-accent transition-colors">
//             <ChevronRight className="h-3.5 w-3.5" />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";
import { useState, useMemo } from "react";
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel,
  flexRender, type ColumnDef, type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Lead } from "@/lib/types/lead";
import { StageBadge } from "./StageBadge";
import { SOURCE_LABELS } from "@/lib/constants/leads";

interface LeadTableProps {
  leads:    Lead[];
  onView:   (lead: Lead) => void;
  onDelete: (id: string) => void;
}

export function LeadTable({ leads, onView, onDelete }: LeadTableProps) {
  const [sorting,      setSorting]      = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo<ColumnDef<Lead>[]>(() => [
    // ── Student ────────────────────────────────────────────────────────────
    {
      accessorKey: "name",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Student <ArrowUpDown className="h-3.5 w-3.5" />
        </button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-sm">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.email || "—"}</p>
        </div>
      ),
    },

    // ── Phone ──────────────────────────────────────────────────────────────
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ getValue }) => (
        <span className="text-sm font-mono">{getValue<string>()}</span>
      ),
    },

    // ── Grade ──────────────────────────────────────────────────────────────
    {
      accessorKey: "grade",
      header: "Grade",
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue<string>() || "—"}</span>
      ),
    },

 
    // ── Board (NEW) ────────────────────────────────────────────────────────
    {
      accessorKey: "boardName",
      header: "Board",
      cell: ({ getValue }) => {
        const val = getValue<string>();
        return val ? (
          <span className="text-xs bg-muted rounded-full px-2.5 py-0.5 font-medium">
            {val}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        );
      },
    },

    // ── Batch (NEW) ────────────────────────────────────────────────────────
    {
      accessorKey: "batchName",
      header: "Batch",
      cell: ({ row }) => {
        const name = row.original.batchName;
        return name ? (
          <span className="text-xs bg-primary/10 text-primary rounded-full px-2.5 py-0.5 font-medium">
            {name}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
    },

    // ── Subject ────────────────────────────────────────────────────────────
    {
      accessorKey: "subject",
      header: "Course",
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue<string>() || "—"}</span>
      ),
    },

    // ── Source ─────────────────────────────────────────────────────────────
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ getValue }) => (
        <span className="text-xs bg-muted rounded-full px-2.5 py-0.5 font-medium">
          {SOURCE_LABELS[getValue<Lead["source"]>()]}
        </span>
      ),
    },

    // ── Stage ──────────────────────────────────────────────────────────────
    {
      accessorKey: "stage",
      header: "Stage",
      cell: ({ getValue }) => <StageBadge stage={getValue<Lead["stage"]>()} />,
    },

    // ── Assigned ───────────────────────────────────────────────────────────
    // {
    //   accessorKey: "assignedTo",
    //   header: "Assigned",
    //   cell: ({ getValue }) => {
    //     const val = getValue<string>();
    //     if (!val) return <span className="text-xs text-muted-foreground">—</span>;
    //     return (
    //       <div className="flex items-center gap-1.5">
    //         <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
    //           {val.split(" ").map((n) => n[0]).join("")}
    //         </div>
    //         <span className="text-xs text-muted-foreground truncate max-w-[80px]">{val}</span>
    //       </div>
    //     );
    //   },
    // },

    // ── Date ───────────────────────────────────────────────────────────────
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date <ArrowUpDown className="h-3.5 w-3.5" />
        </button>
      ),
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(getValue<string>()), "dd MMM yy")}
        </span>
      ),
    },

    // ── Actions ────────────────────────────────────────────────────────────
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onView(row.original)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(row.original.id)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ], [onView, onDelete]);

  const table = useReactTable({
    data:                   leads,
    columns,
    getCoreRowModel:        getCoreRowModel(),
    getSortedRowModel:      getSortedRowModel(),
    getFilteredRowModel:    getFilteredRowModel(),
    getPaginationRowModel:  getPaginationRowModel(),
    onSortingChange:        setSorting,
    globalFilterFn:         "includesString",
    onGlobalFilterChange:   setGlobalFilter,
    initialState:           { pagination: { pageSize: 10 } },
    state:                  { sorting, globalFilter },
  });

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 max-w-xs">
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search leads…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b bg-muted/40">
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap"
                  >
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  No leads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground text-xs">
          {table.getFilteredRowModel().rows.length} lead
          {table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-md border p-1.5 disabled:opacity-40 hover:bg-accent transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs text-muted-foreground">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-md border p-1.5 disabled:opacity-40 hover:bg-accent transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}