import type { Permission, Role, Scope, UserRole } from "@/types/roles";

// High-level permission matrix (AGENTS.md §9) — source of truth untuk can()
export const ROLE_PERMISSIONS: Record<Role, Array<{ permission: Permission; scope: Scope }>> = {
  SUPER_ADMIN: [{ permission: "*", scope: "GLOBAL" }],
  LEADER: [
    { permission: "user.view", scope: "GLOBAL" },
    { permission: "course.view", scope: "GLOBAL" },
    { permission: "assignment.view", scope: "GLOBAL" },
  ],
  CO_LEADER: [{ permission: "user.view", scope: "GLOBAL" }],
  SECRETARY: [{ permission: "attendance.view", scope: "GLOBAL" }],
  TREASURER: [{ permission: "finance.view", scope: "GLOBAL" }],
  WEB_COORDINATOR: [
    { permission: "material.create", scope: "DIVISION" },
    { permission: "course.view", scope: "DIVISION" },
  ],
  ML_COORDINATOR: [
    { permission: "material.create", scope: "DIVISION" },
    { permission: "course.view", scope: "DIVISION" },
  ],
  UIUX_COORDINATOR: [
    { permission: "material.create", scope: "DIVISION" },
    { permission: "course.view", scope: "DIVISION" },
  ],
  MENTOR: [
    { permission: "assignment.view", scope: "CLASS" },
    { permission: "assignment.grade", scope: "CLASS" },
    { permission: "material.create", scope: "DIVISION" },
  ],
  MEMBER: [
    { permission: "course.view", scope: "OWN" },
    { permission: "assignment.view", scope: "OWN" },
  ],
};

// Scope hierarchy check
export function isScopeSufficient(userScope: Scope, requiredScope: Scope): boolean {
  const hierarchy: Record<Scope, number> = {
    GLOBAL: 5,
    ORGANIZATION: 4,
    DIVISION: 3,
    CLASS: 2,
    COURSE: 1,
    OWN: 0,
  };
  return hierarchy[userScope] >= hierarchy[requiredScope];
}
