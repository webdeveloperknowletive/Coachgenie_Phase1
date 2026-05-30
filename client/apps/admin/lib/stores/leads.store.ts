"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist, createJSONStorage } from "zustand/middleware";

import type {
  Lead,
  LeadStage,
  Activity,
  Admission,
} from "@/lib/types/lead";

const SEED_ADMISSIONS: Admission[] = [];

interface LeadStore {
  leads: Lead[];
  admissions: Admission[];

  // LEADS
  setLeads: (leads: Lead[]) => void;
  addLead: (lead: Lead) => void;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  updateStage: (id: string, stage: LeadStage) => void;
  deleteLead: (id: string) => void;

  // ACTIVITIES
  addActivity: (
    leadId: string,
    act: Omit<Activity, "id" | "createdAt">
  ) => void;

  // ADMISSIONS
  setAdmissions: (admissions: Admission[]) => void;
  addAdmission: (admission: Admission) => void;
  convertToAdmission: (leadId: string) => Admission | null;
  updateAdmission: (
    id: string,
    patch: Partial<Admission>
  ) => void;
}

export const useLeadStore = create<LeadStore>()(
  persist(
    immer((set, get) => ({
      leads: [],
      admissions: SEED_ADMISSIONS,

      // =========================
      // LEADS
      // =========================

      setLeads: (leads) => {
        set((state) => {
          state.leads = leads;
        });
      },

      addLead: (lead) => {
        set((state) => {
          state.leads.unshift(lead);
        });
      },

      updateLead: (id, patch) => {
        set((state) => {
          const index = state.leads.findIndex(
            (lead) => lead.id === id
          );

          if (index !== -1) {
            Object.assign(state.leads[index], {
              ...patch,
              updatedAt: new Date().toISOString(),
            });
          }
        });
      },

      updateStage: (id, stage) => {
        set((state) => {
          const lead = state.leads.find(
            (lead) => lead.id === id
          );

          if (!lead) return;

          lead.stage = stage;
          lead.updatedAt = new Date().toISOString();

          lead.activities.unshift({
            id: `a-${Date.now()}`,
            type: "STAGE_CHANGE",
            content: `Stage changed to ${stage.replace(
              /_/g,
              " "
            )}`,
            createdAt: new Date().toISOString(),
            createdBy: "System",
          });
        });
      },

      deleteLead: (id) => {
        set((state) => {
          state.leads = state.leads.filter(
            (lead) => lead.id !== id
          );
        });
      },

      // =========================
      // ACTIVITIES
      // =========================

      addActivity: (leadId, act) => {
        set((state) => {
          const lead = state.leads.find(
            (lead) => lead.id === leadId
          );

          if (!lead) return;

          lead.activities.unshift({
            ...act,
            id: `a-${Date.now()}`,
            createdAt: new Date().toISOString(),
          });

          lead.updatedAt = new Date().toISOString();
        });
      },

      // =========================
      // ADMISSIONS
      // =========================

      setAdmissions: (admissions) => {
        set((state) => {
          state.admissions = admissions;
        });
      },

      addAdmission: (admission) => {
        set((state) => {
          const exists = state.admissions.some(
            (a) => a.id === admission.id
          );

          if (!exists) {
            state.admissions.unshift(admission);
          }

          // sync lead stage automatically
          const lead = state.leads.find(
            (l) => l.id === admission.leadId
          );

          if (lead) {
            lead.stage = "ENROLLED";
            lead.updatedAt = new Date().toISOString();
          }
        });
      },

      convertToAdmission: (leadId) => {
        const lead = get().leads.find(
          (lead) => lead.id === leadId
        );

        if (!lead) return null;

        const existing = get().admissions.find(
          (admission) => admission.leadId === leadId
        );

        if (existing) return existing;

        const admission: Admission = {
          id: `adm-${Date.now()}`,
          leadId: lead.id,

          studentName: lead.name,
          email: lead.email,
          phone: lead.phone,

          grade: lead.grade,
          subjects: [lead.subject],

          feeAmount: 48000,
          feePaid: 0,

          status: "PENDING_DOCS",

          documents: [
            {
              name: "Aadhar Card",
              required: true,
              submitted: false,
            },
            {
              name: "Previous Marksheet",
              required: true,
              submitted: false,
            },
            {
              name: "Passport Photo",
              required: true,
              submitted: false,
            },
          ],

          createdAt: new Date().toISOString(),
        };

        set((state) => {
          state.admissions.unshift(admission);

          const leadData = state.leads.find(
            (l) => l.id === leadId
          );

          if (leadData) {
            leadData.stage = "ENROLLED";
            leadData.updatedAt =
              new Date().toISOString();
          }
        });

        return admission;
      },

      updateAdmission: (id, patch) => {
        set((state) => {
          const index = state.admissions.findIndex(
            (admission) => admission.id === id
          );

          if (index !== -1) {
            Object.assign(
              state.admissions[index],
              patch
            );
          }
        });
      },
    })),
    {
      name: "lead-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);