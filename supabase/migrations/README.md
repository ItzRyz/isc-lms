# Migrations

Urutan wajib (AGENTS.md §57, BUILD_PLAN.md §4.3):

1. `001_identity_rbac.sql` — profiles, roles, permissions, user_roles, role_permissions, user_divisions + seed 10 roles + RLS helpers `has_role`, `has_permission`
2. `002_organization.sql` — organizations, divisions, positions, batches, academic_periods, classes, class_members
3. `003_learning.sql` — courses, modules, materials, material_files, material_links, prerequisites, progress, bookmarks, roadmaps
4. `004_assignment_quiz.sql` — assignments, submissions, rubrics, quizzes, questions, attempts
5. `005_attendance_assessment.sql` — attendance_sessions/records/corrections, grades, point_transactions, ranking_periods
6. `006_communication_events.sql` — announcements, forum, messages, notifications, events, achievements, certificates, finance, audit_logs

Buat dengan:

```bash
npx supabase migration new identity_rbac
# edit supabase/migrations/*_identity_rbac.sql
npx supabase db reset   # test lokal
npx supabase db push    # push ke linked project
```

Constraint penting: UNIQUE(user_id,role_id), UNIQUE(attendance_session_id,user_id), FK RESTRICT untuk grades/points/audit (AGENTS.md §33).
Soft delete: deleted_at, deleted_by untuk users/courses/materials/assignments/quizzes (AGENTS.md §34).
