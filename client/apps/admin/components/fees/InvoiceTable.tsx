"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel,
  flexRender, type ColumnDef, type SortingState,
} from "@tanstack/react-table";
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Invoice } from "@/lib/types/finance";

export const STATUS_CONFIG: Record<Invoice["status"], { label: string; className: string }> = {
  PAID:    { label: "Paid",    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400" },
  PENDING: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400" },
  OVERDUE: { label: "Overdue", className: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400" },
  PARTIAL: { label: "Partial", className: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400" },
};

interface InvoiceTableProps {
  invoices:     Invoice[];
  statusFilter: Invoice["status"] | "ALL";
}

export function InvoiceTable({ invoices, statusFilter }: InvoiceTableProps) {
  const [sorting, setSorting]           = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const filtered = statusFilter === "ALL"
    ? invoices
    : invoices.filter(i => i.status === statusFilter);

  const columns = useMemo<ColumnDef<Invoice>[]>(() => [
    {
      accessorKey: "invoiceNo",
      header: "Invoice #",
      cell: ({ getValue }) => <span className="font-mono text-xs font-semibold">{getValue<string>()}</span>,
    },
    {
      accessorKey: "studentName",
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Student <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-sm">{row.original.studentName}</p>
          <p className="text-xs text-muted-foreground">{row.original.grade}</p>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ getValue }) => (
        <p className="text-sm text-muted-foreground max-w-[200px] truncate">{getValue<string>()}</p>
      ),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Amount <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => {
        const pct = Math.round((row.original.paid / row.original.amount) * 100);
        return (
          <div className="space-y-1 min-w-[120px]">
            <div className="flex justify-between text-xs">
              <span className="font-medium">₹{row.original.paid.toLocaleString("en-IN")}</span>
              <span className="text-muted-foreground">of ₹{row.original.amount.toLocaleString("en-IN")}</span>
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
      cell: ({ getValue }) => {
        const cfg = STATUS_CONFIG[getValue<Invoice["status"]>()];
        return (
          <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", cfg.className)}>
            {cfg.label}
          </span>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ getValue }) => {
        const date = new Date(getValue<string>());
        const overdue = date < new Date();
        return (
          <span className={cn("text-xs", overdue ? "text-red-500 font-medium" : "text-muted-foreground")}>
            {format(date, "dd MMM yyyy")}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Link href={`/fees/${row.original.id}`}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors inline-flex">
          <Eye className="h-3.5 w-3.5" />
        </Link>
      ),
    },
  ], []);

  const table = useReactTable({
    data: filtered, columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    globalFilterFn: "includesString",
    onGlobalFilterChange: setGlobalFilter,
    initialState: { pagination: { pageSize: 10 } },
    state: { sorting, globalFilter },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 max-w-xs">
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <input value={globalFilter} onChange={e => setGlobalFilter(e.target.value)}
          placeholder="Search invoices…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
      </div>
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
              <tr><td colSpan={columns.length} className="h-32 text-center text-sm text-muted-foreground">No invoices found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{table.getFilteredRowModel().rows.length} invoices</p>
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
