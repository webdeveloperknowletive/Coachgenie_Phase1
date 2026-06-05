"use client";
import { useState, useCallback } from "react";
import type { AttendanceStatus } from "@/lib/types/academic";

interface AttendanceEntry {
  studentId: string;
  status:    AttendanceStatus;
  note?:     string;
}

export function useAttendanceSession(studentIds: string[]) {
  const [entries, setEntries] = useState<Record<string, AttendanceEntry>>(() =>
    Object.fromEntries(studentIds.map(id => [id, { studentId: id, status: "present" }]))
  );
  const [saved, setSaved]   = useState(false);
  const [saving, setSaving] = useState(false);

  const mark = useCallback((studentId: string, status: AttendanceStatus) => {
    setEntries(prev => ({ ...prev, [studentId]: { ...prev[studentId]!, studentId, status } }));
    setSaved(false);
  }, []);

  const markAll = useCallback((status: AttendanceStatus) => {
    setEntries(prev => Object.fromEntries(
      Object.keys(prev).map(id => [id, { ...prev[id]!, status }])
    ));
    setSaved(false);
  }, []);

  // const save = useCallback(async (saveFn: (entries: AttendanceEntry[]) => Promise<void>) => {
  //   setSaving(true);
  //   await saveFn(Object.values(entries));
  //   setSaving(false);
  //   setSaved(true);
  // }, [entries]);
  const save = useCallback(async (saveFn: (entries: AttendanceEntry[]) => Promise<void>) => {
  setSaving(true);
  try {
    await saveFn(Object.values(entries));
    setSaved(true);
  } catch (err) {
    setSaved(false);  // ← don't mark as saved if it failed
    throw err;        // ← re-throw so handleSave can catch it
  } finally {
    setSaving(false);
  }
}, [entries]);

  return { entries, mark, markAll, save, saved, saving };
}