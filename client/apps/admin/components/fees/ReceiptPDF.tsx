"use client";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Printer, X } from "lucide-react";
import { format } from "date-fns";
import type { Invoice, Payment } from "@/lib/types/finance";

interface ReceiptPDFProps {
  invoice: Invoice;
  payment: Payment;
  onClose: () => void;
}

function ReceiptContent({ invoice, payment }: { invoice: Invoice; payment: Payment }) {
  return (
    <div className="p-8 font-sans text-sm text-gray-800 bg-white min-h-[400px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold">CG</div>
            <span className="text-xl font-bold text-gray-900">CoachGenie</span>
          </div>
          <p className="text-xs text-gray-500">Excellence in Education</p>
          <p className="text-xs text-gray-500 mt-1">Pune, Maharashtra — India</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">RECEIPT</p>
          <p className="text-xs text-gray-500 mt-1">Invoice: {invoice.invoiceNo}</p>
          <p className="text-xs text-gray-500">Receipt ID: {payment.id.toUpperCase()}</p>
          <p className="text-xs text-gray-500">Date: {format(new Date(payment.date), "dd MMM yyyy")}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t-2 border-blue-600 mb-6" />

      {/* Student info */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Billed To</p>
          <p className="font-semibold text-gray-900">{invoice.studentName}</p>
          <p className="text-gray-600 text-xs">{invoice.grade}</p>
          <p className="text-gray-600 text-xs">{invoice.description}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment Details</p>
          <p className="text-gray-600 text-xs">Mode: <span className="font-medium text-gray-900">{payment.mode.replace("_"," ")}</span></p>
          <p className="text-gray-600 text-xs">Reference: <span className="font-medium text-gray-900">{payment.reference}</span></p>
          <p className="text-gray-600 text-xs">Recorded by: <span className="font-medium text-gray-900">{payment.recordedBy}</span></p>
        </div>
      </div>

      {/* Amount box */}
      <div className="bg-blue-50 rounded-xl p-5 mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">Amount Paid</p>
          <p className="text-3xl font-bold text-blue-700">₹{payment.amount.toLocaleString("en-IN")}</p>
        </div>
        <div className="text-right text-xs text-gray-500 space-y-0.5">
          <p>Total Invoice: ₹{invoice.amount.toLocaleString("en-IN")}</p>
          <p>Previously Paid: ₹{(invoice.paid - payment.amount).toLocaleString("en-IN")}</p>
          <p className="font-semibold text-gray-700">Balance Due: ₹{(invoice.amount - invoice.paid).toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Note */}
      {payment.note && (
        <div className="mb-6 p-3 rounded-lg bg-gray-50 border">
          <p className="text-xs text-gray-500 mb-1">Note</p>
          <p className="text-sm text-gray-700">{payment.note}</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t pt-4 flex items-end justify-between">
        <div>
          <p className="text-xs text-gray-500">This is a computer-generated receipt and does not require a signature.</p>
          <p className="text-xs text-gray-400 mt-1">Generated on {format(new Date(), "dd MMM yyyy, hh:mm a")}</p>
        </div>
        <div className="text-right">
          <div className="h-12 w-28 border-b-2 border-gray-400 mb-1" />
          <p className="text-xs text-gray-500">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
}

export function ReceiptPDF({ invoice, payment, onClose }: ReceiptPDFProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef });

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl rounded-2xl border bg-background shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b px-6 py-3 shrink-0">
          <p className="font-semibold text-sm">Receipt Preview</p>
          <div className="flex gap-2">
            <button onClick={() => handlePrint()}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              <Printer className="h-4 w-4" /> Print / Save PDF
            </button>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-accent transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* Preview */}
        <div className="overflow-y-auto flex-1 bg-gray-100 p-6">
          <div ref={contentRef} className="bg-white rounded-xl shadow-lg overflow-hidden max-w-xl mx-auto">
            <ReceiptContent invoice={invoice} payment={payment} />
          </div>
        </div>
      </div>
    </>
  );
}