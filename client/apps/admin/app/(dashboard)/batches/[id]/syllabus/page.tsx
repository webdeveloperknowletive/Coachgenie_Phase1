"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API = "/api/proxy";

interface SyllabusItem {
  id:          string;
  title:       string;
  description: string | null;
  order:       number;
}

export default function BatchSyllabusPage() {
  const params  = useParams();
  const batchId = params?.id as string;

  const [items,   setItems]   = useState<SyllabusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!batchId) return;
    setLoading(true);
    fetch(`${API}/batches/${batchId}/syllabus`, {
      headers: { "Content-Type": "application/json" },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => setItems(json.data ?? json ?? []))
      .catch((e)  => setError(e.message))
      .finally(()  => setLoading(false));
  }, [batchId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
        Loading syllabus…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24 text-destructive text-sm">
        Failed to load syllabus: {error}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Syllabus</h1>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No syllabus items found for this batch.</p>
      ) : (
        <ol className="space-y-3">
          {items.map((item, idx) => (
            <li
              key={item.id}
              className="flex gap-4 rounded-lg border p-4 bg-card"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}