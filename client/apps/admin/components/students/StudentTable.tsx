"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel,
  flexRender, type ColumnDef, type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, Search, Eye, Trash2, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Student } from "@/lib/types/academic";

const STATUS_STYLE: Record<Student["status"], string> = {
  ACTIVE:     "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400",
  INACTIVE:   "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800",
  SUSPENDED:  "bg-red-50 text-red-600 border-red-200 dark:bg-red-950",
  GRADUATED:  "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950",
};

interface StudentTableProps {
  students:  Student[];
  onDelete:  (id: string) => void;
  onEdit?:   (student: Student) => void;  // ← added
}

export function StudentTable({ students, onDelete, onEdit }: StudentTableProps) {
  const [sorting,       setSorting]       = useState<SortingState>([]);
  const [globalFilter,  setGlobalFilter]  = useState("");
  const [statusFilter,  setStatusFilter]  = useState<Student["status"] | "ALL">("ALL");

  const filtered = statusFilter === "ALL"
    ? students
    : students.filter((s) => s.status === statusFilter);

  const columns = useMemo<ColumnDef<Student>[]>(() => [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Student <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
            {row.original.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <p className="font-medium text-sm">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ getValue }) => <span className="text-sm font-mono">{getValue<string>()}</span>,
    },
    {
      accessorKey: "grade",
      header: "Grade",
      cell: ({ getValue }) => <span className="text-sm">{getValue<string>()}</span>,
    },
    // {
    //   accessorKey: "subjects",
    //   header: "Subjects",
    //   cell: ({ getValue }) => (
    //     <div className="flex flex-wrap gap-1">
    //       {(getValue<string[]>()).slice(0, 2).map(s => (
    //         <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">{s}</span>
    //       ))}
    //     </div>
    //   ),
    // },
    {
      accessorKey: "subjects",
      header: "Subjects",
      cell: ({ getValue }) => {
        const subjects = (getValue<string[]>() ?? []).filter(s => s && s !== "N/A");
        if (!subjects.length) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {subjects.slice(0, 2).map(s => (
              <span key={s} className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-medium">
                {s}
              </span>
            ))}
            {subjects.length > 2 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                +{subjects.length - 2}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "fees",
      header: "Fee Status",
      cell: ({ row }) => {
        const { paid, total, due } = row.original.fees;
        const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
        return (
          <div className="space-y-1 min-w-[100px]">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">₹{paid.toLocaleString("en-IN")}</span>
              <span className={due > 0 ? "text-red-500" : "text-emerald-600"}>{pct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full rounded-full", pct === 100 ? "bg-emerald-500" : "bg-amber-500")}
                style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => (
        <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", STATUS_STYLE[getValue<Student["status"]>()])}>
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: "joinedAt",
      header: "Joined",
      cell: ({ getValue }) => {
        const val = getValue<string>();
        if (!val) return <span className="text-xs text-muted-foreground">—</span>;
        return <span className="text-xs text-muted-foreground">{format(new Date(val), "dd MMM yy")}</span>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          {/* View */}
          <Link href={`/students/${row.original.id}`}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="View profile">
            <Eye className="h-3.5 w-3.5" />
          </Link>

          {/* Edit */}
          {onEdit && (
            <button
              onClick={() => onEdit(row.original)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              title="Edit student"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Delete / Deactivate */}
          <button
            onClick={() => onDelete(row.original.id)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            title="Deactivate student"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ], [onDelete, onEdit]);

  const table = useReactTable({
    data: filtered, columns,
    getCoreRowModel:      getCoreRowModel(),
    getSortedRowModel:    getSortedRowModel(),
    getFilteredRowModel:  getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange:      setSorting,
    globalFilterFn:       "includesString",
    onGlobalFilterChange: setGlobalFilter,
    initialState: { pagination: { pageSize: 10 } },
    state: { sorting, globalFilter },
  });

  return (
    <div className="space-y-3">
      {/* Search + filter */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 flex-1 min-w-[200px] max-w-xs">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="Search students…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["ALL", "ACTIVE", "INACTIVE", "SUSPENDED", "GRADUATED"] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === s ? "bg-foreground text-background" : "hover:bg-accent"
              )}>
              {s === "ALL" ? `All (${students.length})` : s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="border-b bg-muted/40">
                {hg.headers.map(h => (
                  <th key={h.id} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3 align-middle whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-32 text-center text-sm text-muted-foreground">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-xs text-muted-foreground">
          {table.getFilteredRowModel().rows.length} students
        </p>
        <div className="flex items-center gap-2">
          <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
            className="rounded-md border p-1.5 disabled:opacity-40 hover:bg-accent transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs text-muted-foreground">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
          </span>
          <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
            className="rounded-md border p-1.5 disabled:opacity-40 hover:bg-accent transition-colors">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

