import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAttendanceSessions } from "@/features/attendance/actions";
import { ScanForm } from "@/features/attendance/components/scan-form";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sessions = await getAttendanceSessions();
  const openSessions = (sessions as Array<{ id: string; title: string; qr_token: string; status: string }>).filter((s) => s.status === "OPEN");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Attendance — Scan</h1>
          <p className="text-muted-foreground">Scan session QR (ID_CARD + SESSION). Camera via html5-qrcode, fallback manual paste.</p>
        </div>
        <Badge variant="outline">P6 Attendance</Badge>
      </div>

      {openSessions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No open sessions</CardTitle>
            <CardDescription>Mentor belum buat session untuk hari ini, atau sudah expired.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ScanForm sessions={openSessions as never} />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Privacy & Security</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          <p>Geolocation optional, tapi required jika session geofenced. Location dikirim ke server, Haversine validated, distance disimpan.</p>
          <p>Static ID-card QR hanya identifikasi, tidak cukup tanpa session QR (§16).</p>
        </CardContent>
      </Card>
    </div>
  );
}
