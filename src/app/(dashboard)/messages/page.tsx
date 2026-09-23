import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getConversations, getMessages } from "@/features/messages/actions";
import { MessagesClient } from "@/features/messages/components/messages-client";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ conversation?: string }> }) {
  const { conversation } = await searchParams;
  const conversations = await getConversations();
  const messages = conversation ? await getMessages(conversation) : [];
  const isMock = conversations.length === 1 && (conversations[0] as { id: string }).id === "conv1";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Messages</h1>
          <p className="text-muted-foreground">Private messaging • Conversations • Realtime via Supabase publication `messages` • unread counters</p>
        </div>
        <Badge variant="outline">P8 Communication</Badge>
      </div>

      {isMock && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-900 dark:text-amber-200">Dev fallback — Supabase belum configured</CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">Set Supabase env & `npx supabase db push` migration 009 untuk messages real.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
          <CardDescription>Select conversation • Realtime messages • Do not use realtime as only persistence (persist first in PostgreSQL §48)</CardDescription>
        </CardHeader>
        <CardContent>
          <MessagesClient conversations={conversations as never} initialMessages={messages as never} selectedId={conversation || null} />
        </CardContent>
      </Card>
    </div>
  );
}
