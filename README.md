# ISC LMS — Study Club LMS & Organization Platform

Platform LMS + Organization Management untuk Study Club dengan 3 divisi: **UI/UX Design, Web Development, Machine Learning**.

Stack: **Next.js 16.3.5** + **Supabase** (Postgres, Auth, RLS, Realtime, Storage) + **FastAPI 0.141.1** (ML) + **Vercel**.

> Spec lengkap: lihat `AGENTS.md` & `BUILD_PLAN.md` (di `E:\ISC\`).

## Quick Start

```bash
# 1. Install
npm install

# 2. Env (copy template)
copy .env.example .env.local
# isi NEXT_PUBLIC_SUPABASE_URL & ANON_KEY dari dashboard supabase

# 3. Dev
npm run dev
# → http://localhost:3000

# 4. Build check
npm run build
npm run lint
```

## Struktur

```
src/app/
├── (auth)/login,register,forgot-password,reset-password
├── (dashboard)/dashboard,learning,assignments,quizzes,attendance,grades,ranking,...
├── organization/members,divisions,events,announcements
├── mentor/students,assignments,quizzes,grades,attendance
├── coordinator/division,courses,materials,reports
├── admin/users,roles,permissions,settings,audit-logs
├── verify/certificate/[token]
└── api/v1/attendance,assignments,quizzes,notifications,ml

src/features/  # per-domain logic
src/lib/
  ├── supabase/{client,server,admin,middleware}
  ├── auth/
  ├── rbac/{can,permissions}
  ├── validation/
  ├── ml/client.ts
  └── utils/{geofence,grade}

supabase/migrations/  # 001-006 (RBAC → Organization → Learning → ...)
fastapi/app/          # ML service isolated dari LMS
```

## RBAC

Multi-role + scope-aware: `GLOBAL/ORGANIZATION/DIVISION/CLASS/COURSE/OWN` — lihat `src/types/roles.ts` & `src/lib/rbac/can.ts`. Jangan bypass RLS di client.

## Supabase Setup (Phase 1 → 2)

```bash
npm i -g supabase
supabase login
supabase link --project-ref <PROJECT_REF>
supabase db push   # setelah migration 001 siap
```

Migrations urutan ada di `supabase/migrations/README.md`. Seed roles/permissions di `001`.

## FastAPI

```bash
cd fastapi
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Next.js panggil via `src/lib/ml/client.ts` (server-only, pakai `FASTAPI_INTERNAL_SECRET`).

## Phases (AGENTS.md §57)

- ✅ P1 Foundation — DONE: scaffold, shadcn, supabase helpers, RBAC, layout, middleware, 43 routes
- ⬜ P2 Organization — divisions/members/classes
- ⬜ P3 LMS Core — courses/modules/materials/roadmap
- ... sampai P11 Hardening

Lihat `E:\ISC\BUILD_PLAN.md` untuk checklist detail.

## Scripts

- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build
- `npm run lint` — eslint
- `npm run start` — start prod

## Env Vars

Lihat `.env.example` — hanya `NEXT_PUBLIC_*` yang expose ke browser. Service-role, Sender, FastAPI secret **server-only**.

## Contributing

Branch: `main` ← `develop` ← `feature/*` — commit style `feat:`, `fix:`, `chore:` (AGENTS.md §64). PR checklist §65 wajib.
