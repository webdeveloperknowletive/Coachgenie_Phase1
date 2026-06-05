// apps/admin/src/hooks/useLeads.ts  — copy this pattern for every module
import { useState, useEffect, useCallback } from "react";
import { leadsService } from "../services/leadsService";
import { toast } from "sonner"; // or your toast lib

export function useLeads() {
  const [leads,   setLeads]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await leadsService.list();
      setLeads(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createLead = async (body: unknown) => {
    await leadsService.create(body);
    toast.success("Lead added");
    fetch();
  };

  const updateLead = async (id: string, body: unknown) => {
    await leadsService.update(id, body);
    fetch();
  };

  const deleteLead = async (id: string) => {
    await leadsService.delete(id);
    toast.success("Lead removed");
    fetch();
  };

  return { leads, loading, error, createLead, updateLead, deleteLead, refetch: fetch };
}
