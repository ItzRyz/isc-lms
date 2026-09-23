import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getEvents } from "@/features/events/actions";
import { getDivisions } from "@/features/organization/actions";
import { EventCard } from "@/features/events/components/event-card";
import { EventFormDialog } from "@/features/events/components/event-form";
import { Calendar, Award } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ division?: string }> }) {
  const { division } = await searchParams;
  const [events, divisions] = await Promise.all([getEvents(division), getDivisions()]);
  const isMock = events.length === 2 && (events[0] as { id: string }).id === "ev1";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Organization / Events</h1>
          <p className="text-muted-foreground">WORKSHOP/SEMINAR/COMPETITION/MEETING/STUDY_SESSION • Registration • Attendance • Points • Certificate</p>
        </div>
        <Badge variant="outline">P9 Events</Badge>
      </div>

      {isMock && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-900 dark:text-amber-200">Dev fallback — Supabase belum configured</CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">Set Supabase env & `npx supabase db push` migration 010 untuk events real.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Events</CardTitle>
            <CardDescription>Registration capped • Points reward on register/attendance • Certificate via event → certificates</CardDescription>
          </div>
          <EventFormDialog divisions={divisions as never} triggerLabel="Create Event" />
        </CardHeader>
        <CardContent>
          {events.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(events as Array<{ id: string; title: string; description: string | null; type: "WORKSHOP" | "SEMINAR" | "COMPETITION" | "MEETING" | "STUDY_SESSION" | "OTHER"; location: string | null; start_at: string; end_at: string; max_participants: number | null; points_reward: number; is_published: boolean }> ).map((e) => (
                <EventCard key={e.id} event={e as never} />
              ))}
            </div>
          ) : (
            <div className="rounded border border-dashed p-8 text-center text-muted-foreground">
              <p>No events.</p>
              <p className="text-sm">Create workshop/seminar — points auto via point_transactions.</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-4">Total: {events.length} • Types 6 • Registration UNIQUE(event_id,user_id) • Attendance via event_participants.attended</p>
        </CardContent>
      </Card>
    </div>
  );
}
