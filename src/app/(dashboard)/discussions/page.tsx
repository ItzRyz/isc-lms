import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getForumCategories, getForumThreads } from "@/features/forum/actions";
import { ThreadFormDialog } from "@/features/forum/components/thread-form";
import { MessageSquare, Pin, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const [categories, threads] = await Promise.all([getForumCategories(), getForumThreads(category)]);
  const isMock = threads.length === 2 && (threads[0] as { id: string }).id === "t1";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Discussions</h1>
          <p className="text-muted-foreground">Forum categories • Threads • Posts • Realtime • Mentor/member Q&A</p>
        </div>
        <Badge variant="outline">P8 Communication</Badge>
      </div>

      {isMock && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-900 dark:text-amber-200">Dev fallback — Supabase belum configured</CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">Set Supabase env & `npx supabase db push` migration 009 untuk forum real.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant={!category ? "default" : "outline"} render={<Link href="/discussions" />}>All</Button>
        {categories.map((c: { id: string; name: string; slug: string }) => (
          <Button key={c.id} variant={category === c.id ? "default" : "outline"} render={<Link href={`/discussions?category=${c.id}`} />}>
            {c.name}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Threads
            </CardTitle>
            <CardDescription>Realtime via Supabase publication `forum_threads` • View count • Pinned first</CardDescription>
          </div>
          <ThreadFormDialog categories={categories as never} triggerLabel="New Thread" />
        </CardHeader>
        <CardContent className="space-y-3">
          {threads.length ? (
            (threads as Array<{ id: string; title: string; content: string; is_pinned: boolean; view_count: number; created_at: string; profiles?: { full_name?: string } }>).map((t) => (
              <Link key={t.id} href={`/discussions/${t.id}`} className="block rounded border p-3 hover:bg-muted/50">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium flex items-center gap-1">
                    {t.is_pinned && <Pin className="h-4 w-4 text-amber-500" />} {t.title}
                  </h3>
                  <Badge variant="outline" className="gap-1">
                    <Eye className="h-3 w-3" /> {t.view_count}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{t.content}</p>
                <p className="text-xs text-muted-foreground mt-1">By {t.profiles?.full_name || "—"} • {new Date(t.created_at).toLocaleString()}</p>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No threads. Create one.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
