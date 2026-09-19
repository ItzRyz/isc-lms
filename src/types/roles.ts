export const ROLES = [
  "SUPER_ADMIN",
  "LEADER",
  "CO_LEADER",
  "SECRETARY",
  "TREASURER",
  "WEB_COORDINATOR",
  "ML_COORDINATOR",
  "UIUX_COORDINATOR",
  "MENTOR",
  "MEMBER",
] as const;

export type Role = (typeof ROLES)[number];

export const SCOPES = [
  "GLOBAL",
  "ORGANIZATION",
  "DIVISION",
  "CLASS",
  "COURSE",
  "OWN",
] as const;

export type Scope = (typeof SCOPES)[number];

// Permission naming: resource.action (AGENTS.md §7)
export type Permission =
  | "user.view"
  | "user.create"
  | "user.update"
  | "user.delete"
  | "role.view"
  | "role.create"
  | "role.update"
  | "role.delete"
  | "course.view"
  | "course.create"
  | "course.update"
  | "course.delete"
  | "material.view"
  | "material.create"
  | "material.update"
  | "material.delete"
  | "assignment.view"
  | "assignment.create"
  | "assignment.update"
  | "assignment.delete"
  | "assignment.grade"
  | "quiz.view"
  | "quiz.create"
  | "quiz.update"
  | "quiz.delete"
  | "quiz.grade"
  | "attendance.view"
  | "attendance.create"
  | "attendance.correct"
  | "grade.view"
  | "grade.create"
  | "grade.update"
  | "notification.view"
  | "notification.manage"
  | string; // allow future permissions

export interface UserRole {
  role: Role;
  scope: Scope;
  divisionId?: string | null;
  classId?: string | null;
  courseId?: string | null;
}
