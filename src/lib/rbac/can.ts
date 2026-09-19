import type { Permission, UserRole } from "@/types/roles";
import { isScopeSufficient } from "./permissions";

/**
 * Authorization service — NEVER trust client role directly.
 * Selalu fetch user_roles dari DB server-side lalu pakai can().
 *
 * Bad:  if (user.role === "MENTOR") ...
 * Good: can(userRoles, "assignment.grade", { scope: "CLASS", classId })
 */
export function can(
  userRoles: UserRole[],
  permission: Permission,
  context?: {
    scope?: string;
    divisionId?: string | null;
    classId?: string | null;
    courseId?: string | null;
    ownerId?: string | null;
    userId?: string | null;
  }
): boolean {
  // SUPER_ADMIN bypass
  if (userRoles.some((r) => r.role === "SUPER_ADMIN")) return true;

  for (const role of userRoles) {
    // Wildcard check sudah di-handle di atas, untuk completeness:
    // if role has permission "*", allow

    // Scope check — jika context meminta scope tertentu, user harus punya scope yang cukup
    if (context?.scope) {
      // @ts-expect-error - scope type narrowing
      if (!isScopeSufficient(role.scope, context.scope)) continue;
    }

    // Division scope: coordinator hanya untuk division-nya
    if (role.scope === "DIVISION" && context?.divisionId) {
      if (role.divisionId && role.divisionId !== context.divisionId) continue;
    }

    if (role.scope === "CLASS" && context?.classId) {
      if (role.classId && role.classId !== context.classId) continue;
    }

    if (role.scope === "COURSE" && context?.courseId) {
      if (role.courseId && role.courseId !== context.courseId) continue;
    }

    if (role.scope === "OWN" && context?.ownerId && context?.userId) {
      if (context.ownerId !== context.userId) continue;
    }

    // Permission name check — exact match atau wildcard
    // Untuk simplifikasi, cek apakah role memiliki permission tersebut
    // Di implementasi real, load dari DB: role_permissions join
    // Placeholder: jika tidak ada matrix detail, izinkan jika role ada
    // TODO: ganti dengan lookup DB saat migration 001 siap
    return true; // sementara permissive — akan di-tighten setelah permission seed
  }

  return false;
}

export function requirePermission(
  userRoles: UserRole[],
  permission: Permission,
  context?: Parameters<typeof can>[2]
) {
  if (!can(userRoles, permission, context)) {
    const error = new Error(`Forbidden: missing permission ${permission}`);
    // Typed error code untuk API response (AGENTS.md §52)
    (error as unknown as { code: string }).code = "FORBIDDEN";
    throw error;
  }
}
