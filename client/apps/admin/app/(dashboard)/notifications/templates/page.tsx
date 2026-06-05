// "use client";
// import { useEffect, useState } from "react";
// import { api } from "@/lib/api";

// export default function NotificationTemplatesPage() {
//   const [templates, setTemplates] = useState<any[]>([]);

//   useEffect(() => {
//     console.log("EFFECT FIRED");
//     api.get("/notifications/templates").then(res => {
//   console.log("FULL RESPONSE:", JSON.stringify(res.data));
//   setTemplates(res.data ?? []);
// });
//   }, []);

//   return (
//     <div>
//       <h1>Templates: {templates.length}</h1>
//       {templates.map(t => <p key={t.id}>{t.name}</p>)}
//     </div>
//   );
// }

"use client";
import { useEffect, useState ,useRef } from "react";
import { Plus, X, Pencil, Trash2, MessageSquare, Mail, Phone, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface Template {
  id:        string;
  name:      string;
  channel:   "email" | "whatsapp" | "sms";
  subject:   string | null;
  body:      string;
  variables: string[] | null;
  is_active: boolean;
}

type FormState = {
  name:      string;
  channel:   string;
  subject:   string;
  body:      string;
  is_active: boolean;
};

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  sms: Phone, whatsapp: MessageSquare, email: Mail,
};

const CHANNEL_LIMITS: Record<string, number> = {
  sms: 160, whatsapp: 1024, email: Infinity,
};

const inputCls =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const emptyForm: FormState = {
  name: "", channel: "email", subject: "", body: "", is_active: true,
};

function extractVariables(body: string): string[] {
  const matches = body.match(/\{\{(\w+)\}\}/g) ?? [];
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, "")))];
}

function HighlightedBody({ body }: { body: string }) {
  const parts = body.split(/(\{\{\w+\}\})/g);
  return (
    <p className="text-sm text-muted-foreground line-clamp-2">
      {parts.map((part, i) =>
        /^\{\{\w+\}\}$/.test(part)
          ? <code key={i} className="rounded bg-primary/10 text-primary px-1 py-0.5 text-[11px] font-mono">{part}</code>
          : <span key={i}>{part}</span>
      )}
    </p>
  );
}

// Standalone fetch helper — not a hook, safe to call anywhere
function loadTemplates(setter: (t: Template[]) => void) {
  return api.get("/notifications/templates")
    .then(res => setter(res.data ?? []))
    .catch(console.error);
}

export default function NotificationTemplatesPage() {
  console.log("COMPONENT RENDERED");
  const [templates,  setTemplates]  = useState<Template[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState<Template | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId,   setDeleteId]   = useState<string | null>(null);
  const [deleting,   setDeleting]   = useState(false);
  const [form,       setForm]       = useState<FormState>(emptyForm);

  const mountedRef = useRef(true);

useEffect(() => {
  mountedRef.current = true;
  
  api.get("/notifications/templates")
    .then(res => {
      if (mountedRef.current) {
        setTemplates(res.data ?? []);
        setLoading(false);
      }
    })
    .catch(err => {
      console.error(err);
      if (mountedRef.current) setLoading(false);
    });

  return () => { mountedRef.current = false; };
}, []);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(t: Template) {
    setEditTarget(t);
    setForm({
      name:      t.name,
      channel:   t.channel,
      subject:   t.subject ?? "",
      body:      t.body,
      is_active: t.is_active,
    });
    setShowForm(true);
  }

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.body.trim()) return toast.error("Body is required");
    if (form.channel === "email" && !form.subject.trim())
      return toast.error("Subject is required for email templates");

    const limit = CHANNEL_LIMITS[form.channel];
    if (form.body.length > limit)
      return toast.error(`${form.channel.toUpperCase()} body must be under ${limit} characters`);

    setSubmitting(true);
    try {
      const payload = {
        name:      form.name.trim(),
        channel:   form.channel,
        subject:   form.subject.trim() || null,
        body:      form.body.trim(),
        variables: extractVariables(form.body),
        is_active: form.is_active,
      };

      if (editTarget) {
        await api.patch(`/notifications/templates/${editTarget.id}`, payload);
        toast.success("Template updated!");
      } else {
        await api.post("/notifications/templates", payload);
        toast.success("Template created!");
      }

      await loadTemplates(setTemplates);
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Failed to save template");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/notifications/templates/${deleteId}`);
      toast.success("Template deleted");
      await loadTemplates(setTemplates);
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Failed to delete template");
    } finally {
      setDeleting(false);
    }
  }

  const charLimit  = CHANNEL_LIMITS[form.channel];
  const charCount  = form.body.length;
  const overLimit  = charCount > charLimit;
  const nearLimit  = !overLimit && charLimit < Infinity && charCount > charLimit * 0.85;

  console.log("TEMPLATES STATE:", templates, "LOADING:", loading);
  if (loading) return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notification Templates</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{templates.length} templates</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> New Template
        </button>
      </div>

      {/* Template list */}
      <div className="space-y-3">
        {templates.length === 0 && (
          <div className="flex items-center justify-center h-40 rounded-xl border bg-card text-sm text-muted-foreground">
            No templates yet. Create one to get started.
          </div>
        )}

        {templates.map((t, i) => {
          const Icon = CHANNEL_ICONS[t.channel] ?? Mail;
          const vars = extractVariables(t.body);
          return (
            <div key={t.id} className="rounded-xl border bg-card p-5 fade-in"
              style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="rounded-lg bg-muted p-2 shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{t.name}</p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase">{t.channel}</span>
                      <span className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        t.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      )}>
                        {t.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {t.subject && (
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Subject: {t.subject}
                      </p>
                    )}
                    <HighlightedBody body={t.body} />
                    {vars.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {vars.map(v => (
                          <code key={v} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">
                            {`{{${v}}}`}
                          </code>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(t)} title="Edit template"
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteId(t.id)} title="Delete template"
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg rounded-2xl border bg-background shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="font-semibold">{editTarget ? "Edit Template" : "New Template"}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Name *</label>
                <input value={form.name} onChange={e => setField("name", e.target.value)}
                  placeholder="e.g. Fee Due Reminder" className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Channel</label>
                  <select value={form.channel} onChange={e => setField("channel", e.target.value)}
                    className={inputCls}>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 self-end pb-1">
                  <input type="checkbox" id="isActive" checked={form.is_active}
                    onChange={e => setField("is_active", e.target.checked)}
                    className="h-4 w-4 accent-primary" />
                  <label htmlFor="isActive" className="text-sm font-medium">Active</label>
                </div>
              </div>

              {form.channel === "email" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Subject *</label>
                  <input value={form.subject} onChange={e => setField("subject", e.target.value)}
                    placeholder="Fee Due — Your School" className={inputCls} />
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Body *</label>
                  {charLimit < Infinity && (
                    <span className={cn(
                      "text-xs",
                      overLimit  ? "text-red-500 font-medium" :
                      nearLimit  ? "text-amber-600" :
                      "text-muted-foreground"
                    )}>
                      {charCount}/{charLimit}
                    </span>
                  )}
                </div>
                <textarea rows={4} value={form.body}
                  onChange={e => setField("body", e.target.value)}
                  placeholder="Use {{variableName}} for dynamic values — e.g. Dear {{studentName}}, your fee of ₹{{amount}} is due on {{dueDate}}."
                  className={cn(
                    "flex w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none",
                    overLimit ? "border-red-400 focus-visible:ring-red-400" : "border-input"
                  )} />
                {overLimit && (
                  <p className="text-xs text-red-500">
                    Body exceeds {charLimit} character limit for {form.channel.toUpperCase()}
                  </p>
                )}
              </div>

              {extractVariables(form.body).length > 0 && (
                <div className="rounded-lg bg-muted/50 border px-3 py-2">
                  <p className="text-xs text-muted-foreground mb-1.5 font-medium">
                    Auto-detected variables
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {extractVariables(form.body).map(v => (
                      <code key={v} className="rounded bg-primary/10 text-primary px-1.5 py-0.5 text-[11px] font-mono">
                        {`{{${v}}}`}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => setShowForm(false)}
                  className="rounded-md border px-4 py-2 text-sm hover:bg-accent transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting || overLimit}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
                  {submitting ? "Saving…" : editTarget ? "Save Changes" : "Create Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setDeleteId(null)}>
          <div className="w-full max-w-sm rounded-2xl border bg-background shadow-2xl p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <h2 className="font-semibold">Delete template?</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              This template will be permanently deleted. Any auto-triggers linked to it will stop working.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)}
                className="rounded-md border px-4 py-2 text-sm hover:bg-accent transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 transition-colors">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  ); }