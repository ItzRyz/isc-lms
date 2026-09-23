import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAnnouncements } from "@/features/announcements/actions";
import { AnnouncementFormDialog } from "@/features/announcements/components/announcement-form";
import { Pin, Megaphone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Page() {
  const announcements = await getAnnouncements();
  const isMock = announcements.length === 2 && (announcements[0] as { id: string }).id === "ann1";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Organization / Announcements</h1>
          <p className="text-muted-foreground">CRUD scoped — LEADER/SECRETARY/COORDINATOR • Pinned • Realtime + Resend selective (major only)</p>
        </div>
        <Badge variant="outline">P8 Communication</Badge>
      </div>

      {isMock && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-900 dark:text-amber-200">Dev fallback — Supabase belum configured</CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">Set Supabase env & `npx supabase db push` migration 009 untuk announcements real.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" /> Announcements
            </CardTitle>
            <CardDescription>Pinned first • IN_APP notifications auto-created • Email only for major (via Resend)</CardDescription>
          </div>
          <AnnouncementFormDialog triggerLabel="Create Announcement" />
        </CardHeader>
        <CardContent className="space-y-3">
          {announcements.length ? (
            (announcements as Array<{ id: string; title: string; content: string; is_pinned: boolean; created_at: string; profiles?: { full_name?: string } }>).map((a) => (
              <div key={a.id} className={`rounded border p-3 ${a.is_pinned ? "border-amber-300 bg-amber-50 dark:bg-amber-950/10" : "bg-card"}`}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium flex items-center gap-1">
                    {a.is_pinned && <Pin className="h-4 w-4 text-amber-500" />} {a.title}
                  </h3>
                  {a.is_pinned && <Badge variant="secondary">Pinned</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.content}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  By {a.profiles?.full_name || "System"} • {new Date(a.created_at).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No announcements.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
