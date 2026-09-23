"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { markAsRead } from "../actions";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  channel: "IN_APP" | "REALTIME" | "EMAIL";
  read_at: string | null;
  created_at: string;
};

export function NotificationsClient({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${user.id}` },
          (payload) => {
            const newNotif = payload.new as Notification;
            setNotifications((prev) => [newNotif, ...prev]);
            toast.success(`New notification: ${newNotif.title}`);
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const handleMarkRead = async (id: string) => {
    const res = await markAsRead(id);
    if (res.success) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    }
  };

  return (
    <div className="space-y-2">
      {notifications.length ? (
        notifications.map((n) => (
          <div key={n.id} className={`rounded border p-3 flex items-start justify-between gap-2 ${!n.read_at ? "bg-muted/30 border-primary/20" : ""}`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{n.title}</span>
                <Badge variant="outline" className="text-xs">{n.type}</Badge>
                <Badge variant="secondary" className="text-xs">{n.channel}</Badge>
                {!n.read_at && <Badge className="text-xs">Unread</Badge>}
              </div>
              {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
              <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
            </div>
            {!n.read_at && (
              <Button variant="outline" size="sm" onClick={() => handleMarkRead(n.id)}>
                Mark read
              </Button>
            )}
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">No notifications. Check preferences for EMAIL vs IN_APP.</p>
      )}
      <p className="text-xs text-muted-foreground">Unread: {notifications.filter((n) => !n.read_at).length} • Email selective: ASSIGNMENT_GRADED, GRADE_PUBLISHED, CERTIFICATE_ISSUED (per §47) — high-freq IN_APP only.</p>
    </div>
  );
}
