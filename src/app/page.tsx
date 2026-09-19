import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, BookOpen, Users, Award } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <GraduationCap className="h-6 w-6 text-primary" />
            ISC LMS
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" render={<Link href="/login" />}>Login</Button>
            <Button render={<Link href="/register" />}>Register</Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Study Club LMS & Organization Platform
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Platform pembelajaran untuk 3 divisi: UI/UX Design, Web Development, Machine Learning.
            Mendukung pembelajaran, tugas, kuis, absensi, ranking, dan organisasi.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" render={<Link href="/dashboard" />}>Go to Dashboard</Button>
            <Button size="lg" variant="outline" render={<Link href="/verify/certificate/demo" />}>Verify Certificate</Button>
          </div>
        </section>

        <section className="container mx-auto grid gap-4 px-4 pb-16 md:grid-cols-3">
          <Card>
            <CardHeader>
              <BookOpen className="h-8 w-8 text-primary" />
              <CardTitle>Learning</CardTitle>
              <CardDescription>Courses, Materials, Roadmap, Progress</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Division → Course → Module → Material dengan prerequisites & progress tracking server-side.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary" />
              <CardTitle>Organization</CardTitle>
              <CardDescription>Members, Divisions, Events</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Multi-role + scoped RBAC, coordinator per divisi, mentor per kelas.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Award className="h-8 w-8 text-primary" />
              <CardTitle>Assessment</CardTitle>
              <CardDescription>Points, Grades, Ranking, Certificates</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Ledger point_transactions, grade weights configurable, ranking bulanan & semester.
            </CardContent>
          </Card>
        </section>

        <section className="container mx-auto px-4 pb-8 text-center text-sm text-muted-foreground">
          <p>Tech: Next.js 16.3.5 • Supabase (Postgres + RLS + Realtime) • FastAPI 0.141.1 • Vercel</p>
          <p className="mt-1">Build Plan: P1 Foundation → P11 Hardening — Lihat BUILD_PLAN.md & AGENTS.md</p>
        </section>
      </main>
    </div>
  );
}
