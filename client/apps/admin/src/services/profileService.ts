// apps/admin/src/services/profileService.ts
import { api } from "@/lib/api";

export const profileService = {
  get:    () => api.get("/profile/"),
  update: (body: unknown) => api.patch("/profile/", body),
};