import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAttendanceSessions, getAttendanceRecords } from "@/features/attendance/actions";
import { getDivisions } from "@/features/organization/actions";
import { getClasses } from "@/features/organization/actions-class";
import { SessionFormDialog } from "@/features/attendance/components/session-form";
import { SessionQR } from "@/features/attendance/components/session-qr";
import { RecordsTable } from "@/features/attendance/components/records-table";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [sessions, divisions, classes, records] = await Promise.all([getAttendanceSessions(), getDivisions(), getClasses(), getAttendanceRecords()]);

  const openSession = (sessions as Array<{ id: string; status: string }>).find((s) => s.status === "OPEN");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Attendance — Sessions (Mentor)</h1>
          <p className="text-muted-foreground">Create session (time window + optional geofence) → QR short-lived → students scan • Manual & correction</p>
        </div>
        <Badge variant="outline">P6 Attendance</Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sessions</CardTitle>
            <CardDescription>SECRETARY/MENTOR can create (attendance.create) • QR token per session • Time validation server</CardDescription>
          </div>
          <SessionFormDialog divisions={divisions as never} classes={classes as never} triggerLabel="Create Session" />
        </CardHeader>
        <CardContent>
          {openSession ? (
            <SessionQR session={openSession as never} />
          ) : sessions.length ? (
            <SessionQR session={(sessions as never)[0]} />
          ) : (
            <p className="text-sm text-muted-foreground">No sessions. Create one.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Records (for correction)</CardTitle>
          <CardDescription>PERMITTED/SICK manual via mentor, correction audited (attendance_corrections + audit_logs)</CardDescription>
        </CardHeader>
        <CardContent>
          <RecordsTable records={records as never} />
        </CardContent>
      </Card>
    </div>
  );
}
