import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getNotifications, markAllAsRead } from "@/features/notifications/actions";
import { NotificationsClient } from "@/features/notifications/components/notifications-client";

export const dynamic = "force-dynamic";

export default async function Page() {
  const notifications = await getNotifications();
  const isMock = notifications.length === 3 && (notifications[0] as { id: string }).id === "n1";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-muted-foreground">IN_APP • REALTIME • EMAIL selective per §47 • Preferences per event type</p>
        </div>
        <Badge variant="outline">P8 Communication</Badge>
      </div>

      {isMock && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-900 dark:text-amber-200">Dev fallback — Supabase belum configured</CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">Set Supabase env & `npx supabase db push` migration 009 untuk notifications real.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Inbox</CardTitle>
            <CardDescription>IN_APP + REALTIME (Supabase publication `notifications`) • EMAIL selective (Resend per-event FROM, not for high-freq)</CardDescription>
          </div>
          <form
            action={async () => {
              "use server";
              await markAllAsRead();
            }}
          >
            <Button variant="outline" size="sm" type="submit">
              Mark all read
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          <NotificationsClient initialNotifications={notifications as never} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Channels & Preferences</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>Channels: IN_APP (always), REALTIME (for live), EMAIL (selective per §47: ASSIGNMENT_GRADED, GRADE_PUBLISHED, CERTIFICATE_ISSUED, etc. — not for ATTENDANCE_RECORDED high-freq)</p>
          <p>Preferences: notification_preferences (user_id, event_type, in_app, realtime, email) — RLS own only.</p>
          <p>Realtime Rules §48: persist first in PostgreSQL, then broadcast via Supabase Realtime.</p>
        </CardContent>
      </Card>
    </div>
  );
}
