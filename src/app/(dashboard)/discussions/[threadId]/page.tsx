import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getThreadById, getPostsByThread } from "@/features/forum/actions";
import { PostForm } from "@/features/forum/components/post-form";
import { ArrowLeft, Pin, Eye, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const thread = (await getThreadById(threadId)) as { id: string; title: string; content: string; is_pinned: boolean; view_count: number; created_at: string; profiles?: { full_name?: string } } | null;
  if (!thread) notFound();
  const posts = (await getPostsByThread(threadId)) as Array<{ id: string; content: string; created_at: string; profiles?: { full_name?: string } }>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" render={<Link href="/discussions" />}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        {thread.is_pinned && <Badge variant="secondary"><Pin className="mr-1 h-3 w-3" /> Pinned</Badge>}
        <Badge variant="outline" className="gap-1"><Eye className="h-3 w-3" /> {thread.view_count}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{thread.title}</CardTitle>
          <CardDescription>By {thread.profiles?.full_name || "—"} • {new Date(thread.created_at).toLocaleString()} • Realtime forum_threads publication</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{thread.content}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Replies ({posts.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {posts.length ? (
            posts.map((p) => (
              <div key={p.id} className="rounded border p-3">
                <p className="text-sm whitespace-pre-wrap">{p.content}</p>
                <p className="text-xs text-muted-foreground mt-1">By {p.profiles?.full_name || "—"} • {new Date(p.created_at).toLocaleString()}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No replies yet.</p>
          )}
          <PostForm threadId={threadId} />
        </CardContent>
      </Card>
    </div>
  );
}
