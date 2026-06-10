"use client";
import { useState, useCallback } from "react";
import type { ExamResult } from "@/lib/types/academic";

export function useBulkResultEntry(initial: ExamResult[]) {
  const [results, setResults] = useState<ExamResult[]>(initial);
  const [dirty, setDirty]     = useState(false);

  const update = useCallback((studentId: string, marks: number | null) => {
    setResults(prev => prev.map(r =>
      r.studentId === studentId ? { ...r, marks } : r
    ));
    setDirty(true);
  }, []);

  const reset = useCallback((newResults: ExamResult[]) => {
    setResults(newResults);
    setDirty(false);
  }, []);

  return { results, update, dirty, reset };
}
