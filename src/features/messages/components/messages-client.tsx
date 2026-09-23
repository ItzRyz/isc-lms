"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sendMessage } from "../actions";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Send, MessageSquare } from "lucide-react";

type Conversation = { id: string; title: string; is_group: boolean };
type Message = { id: string; conversation_id: string; sender_id: string; content: string; created_at: string; profiles?: { full_name?: string } };

export function MessagesClient({
  conversations,
  initialMessages,
  selectedId,
}: {
  conversations: Conversation[];
  initialMessages: Message[];
  selectedId: string | null;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [content, setContent] = useState("");
  const [selected, setSelected] = useState<string | null>(selectedId);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages(initialMessages);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(selectedId);
  }, [initialMessages, selectedId]);

  // Realtime subscription for messages in selected conversation
  useEffect(() => {
    if (!selected) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${selected}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selected}` }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) => [...prev, newMsg]);
        toast.success("New message (realtime)");
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selected]);

  const handleSend = async () => {
    if (!selected || !content.trim()) return;
    const fd = new FormData();
    fd.set("conversation_id", selected);
    fd.set("content", content);
    const res = await sendMessage(fd);
    if (res.success) {
      setContent("");
      toast.success("Sent");
    } else toast.error(res.error.message);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Conversations</h3>
        {conversations.length ? (
          conversations.map((c) => (
            <Link
              key={c.id}
              href={`/messages?conversation=${c.id}`}
              className={`block rounded border p-2 hover:bg-muted ${selected === c.id ? "bg-muted border-primary" : ""}`}
            >
              <div className="text-sm font-medium flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> {c.title}
              </div>
              <div className="text-xs text-muted-foreground">{c.is_group ? "Group" : "Direct"}</div>
            </Link>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No conversations.</p>
        )}
      </div>

      <div className="md:col-span-2 space-y-3">
        {!selected ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">Select a conversation.</CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-3 space-y-2 max-h-96 overflow-auto">
                {messages.length ? (
                  messages.map((m) => (
                    <div key={m.id} className="rounded border p-2">
                      <p className="text-sm">{m.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.profiles?.full_name || m.sender_id.slice(0, 8)} • {new Date(m.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No messages. Start chatting.</p>
                )}
              </CardContent>
            </Card>
            <div className="flex gap-2">
              <Input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Type message..." className="flex-1" />
              <Button onClick={handleSend}>
                <Send className="mr-1 h-4 w-4" /> Send
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Realtime via Supabase publication `messages` • Persisted first in PostgreSQL (§48) • Not only realtime.</p>
          </>
        )}
      </div>
    </div>
  );
}
