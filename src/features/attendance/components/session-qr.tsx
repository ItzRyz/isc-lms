"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Session = {
  id: string;
  title: string;
  qr_token: string;
  started_at: string;
  ended_at: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  radius_meters: number | null;
};

export function SessionQR({ session }: { session: Session }) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<string>("");

  const qrPayload = JSON.stringify({
    session_id: session.id,
    qr_token: session.qr_token,
    // Static ID-card QR would be user.id, but session QR is separate
  });

  useEffect(() => {
    QRCode.toDataURL(qrPayload, { width: 256, margin: 2 }).then(setQrDataUrl);
  }, [qrPayload]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const end = new Date(session.ended_at);
      const diff = end.getTime() - now.getTime();
      if (diff <= 0) setTimeLeft("Expired");
      else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${m}m ${s}s`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [session.ended_at]);

  const isExpired = new Date() > new Date(session.ended_at);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {session.title}
          <Badge variant={session.status === "OPEN" && !isExpired ? "default" : "destructive"}>{session.status}</Badge>
        </CardTitle>
        <CardDescription>
          {new Date(session.started_at).toLocaleString()} → {new Date(session.ended_at).toLocaleString()} • {timeLeft}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {qrDataUrl ? (
          <div className="flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR Token" className="w-64 h-64 border rounded" />
            <p className="text-xs font-mono bg-muted px-2 py-1 rounded break-all">{session.qr_token}</p>
            <p className="text-xs text-muted-foreground">QR = session_id + qr_token (short-lived until ended_at). Show to students to scan.</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Generating QR...</p>
        )}
        {session.latitude !== null && (
          <p className="text-xs text-muted-foreground">
            Geofence: {session.latitude.toFixed(5)}, {session.longitude?.toFixed(5)} ± {session.radius_meters}m — server Haversine validates (never trust client).
          </p>
        )}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(session.qr_token)}>
            Copy Token
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(qrPayload)}>
            Copy Payload
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
