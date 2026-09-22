import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAttendanceSessions, getAttendanceRecords } from "@/features/attendance/actions";
import { RecordsTable } from "@/features/attendance/components/records-table";
import { QrCode, History, CalendarCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [sessions, records] = await Promise.all([getAttendanceSessions(), getAttendanceRecords()]);
  const isMock = sessions.length === 1 && sessions[0]?.id === "sess-web";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Attendance</h1>
          <p className="text-muted-foreground">QR_CODE + MANUAL • ID_CARD + SESSION + TIME + GEOFENCE • Haversine server • 5 statuses</p>
        </div>
        <Badge variant="outline">P6 Attendance</Badge>
      </div>

      {isMock && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-900 dark:text-amber-200">Dev fallback — Supabase belum configured</CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">Set Supabase env & `npx supabase db push` migration 007 untuk sessions real.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="flex gap-2">
        <Button render={<Link href="/attendance/scan" />}>
          <QrCode className="mr-1 h-4 w-4" /> Scan QR
        </Button>
        <Button variant="outline" render={<Link href="/attendance/sessions" />}>
          <CalendarCheck className="mr-1 h-4 w-4" /> Sessions (Mentor)
        </Button>
        <Button variant="outline" render={<Link href="/organization/divisions" />}>
          Manage Divisions/Classes
        </Button>
      </div>

      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="records">My Records</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Sessions</CardTitle>
              <CardDescription>OPEN/CLOSED • qr_token short-lived per session • Time window • Optional geofence</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Time Window</TableHead>
                      <TableHead>Geofence</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>QR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.length ? (
                      (sessions as Array<{ id: string; title: string; started_at: string; ended_at: string; latitude: number | null; longitude: number | null; radius_meters: number | null; status: string; qr_token: string }>).map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.title}</TableCell>
                          <TableCell className="text-xs">
                            {new Date(s.started_at).toLocaleString()} → {new Date(s.ended_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs">{s.latitude !== null ? `${s.latitude.toFixed(3)}, ${s.longitude?.toFixed(3)} ±${s.radius_meters}m` : "—"}</TableCell>
                          <TableCell>
                            <Badge variant={s.status === "OPEN" ? "default" : "outline"}>{s.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">{s.qr_token.slice(0, 8)}...</code>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No sessions. Mentor create di /attendance/sessions.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-4 w-4" /> Records
              </CardTitle>
              <CardDescription>PRESENT/LATE/PERMITTED/SICK/ABSENT • Geofence valid • Correction audited</CardDescription>
            </CardHeader>
            <CardContent>
              <RecordsTable records={records as never} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">P6 Details</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>QR = ID_CARD (user) + SESSION (qr_token) + TIME (started_at→ended_at) + GEOFENCE (optional). Token short-lived, rotation per session.</p>
          <p>Geofence: client may provide lat/lng, server Haversine calculates distance, validates ≤ radius (§17). Never trust client inside.</p>
          <p>Correction: attendance_corrections + audit_logs ATTENDANCE_CORRECTED, preserve history (no delete).</p>
        </CardContent>
      </Card>
    </div>
  );
}
