export const queryKeys = {
  auth: {
    me: ()                       => ["auth", "me"] as const,
  },
  students: {
    all:    (tenantId: string)   => ["students", tenantId] as const,
    detail: (id: string)        => ["students", "detail", id] as const,
    attendance: (id: string)    => ["students", id, "attendance"] as const,
    progress:   (id: string)    => ["students", id, "progress"] as const,
  },
  sessions: {
    all:    (tenantId: string)   => ["sessions", tenantId] as const,
    detail: (id: string)        => ["sessions", "detail", id] as const,
    byDate: (date: string)      => ["sessions", "date", date] as const,
  },
  attendance: {
    all:       (tenantId: string) => ["attendance", tenantId] as const,
    byStudent: (id: string)       => ["attendance", "student", id] as const,
    byMonth:   (id: string, month: string) => ["attendance", id, month] as const,
  },
  billing: {
    all:    (tenantId: string)   => ["billing", tenantId] as const,
    detail: (id: string)        => ["billing", "detail", id] as const,
  },
  ai: {
    session: (id: string)       => ["ai", "session", id] as const,
  },
} as const;