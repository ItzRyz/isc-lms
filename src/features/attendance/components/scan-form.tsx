"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { checkInAttendance } from "../actions";
import { toast } from "sonner";
import { QrCode, MapPin, Clock } from "lucide-react";

type SessionOpt = { id: string; title: string; qr_token: string; status: string };

export function ScanForm({ sessions }: { sessions: SessionOpt[] }) {
  const [sessionId, setSessionId] = useState(sessions[0]?.id || "");
  const [qrToken, setQrToken] = useState("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<unknown>(null);

  const selectedSession = sessions.find((s) => s.id === sessionId);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(String(pos.coords.latitude));
        setLongitude(String(pos.coords.longitude));
        toast.success("Location set");
      },
      () => toast.error("Failed to get location")
    );
  };

  const startScan = async () => {
    if (!videoRef.current) return;
    setIsScanning(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const qr = new Html5Qrcode("qr-reader");
      html5QrRef.current = qr;
      await qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          try {
            const payload = JSON.parse(decodedText);
            if (payload.session_id) setSessionId(payload.session_id);
            if (payload.qr_token) setQrToken(payload.qr_token);
            else setQrToken(decodedText);
            toast.success("QR scanned");
            qr.stop();
            setIsScanning(false);
          } catch {
            setQrToken(decodedText);
            toast.success("QR scanned (raw)");
          }
        },
        () => {}
      );
    } catch (e) {
      toast.error("Camera failed: " + (e as Error).message);
      setIsScanning(false);
    }
  };

  const stopScan = async () => {
    const qr = html5QrRef.current as { stop: () => Promise<void> } | null;
    if (qr) await qr.stop().catch(() => {});
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      const qr = html5QrRef.current as { stop: () => Promise<void> } | null;
      qr?.stop().catch(() => {});
    };
  }, []);

  const handleCheckIn = async () => {
    if (!sessionId || !qrToken) {
      toast.error("Session & QR token required");
      return;
    }
    const fd = new FormData();
    fd.set("session_id", sessionId);
    fd.set("qr_token", qrToken);
    if (latitude) fd.set("latitude", latitude);
    if (longitude) fd.set("longitude", longitude);
    const res = await checkInAttendance(fd);
    if (res.success) {
      const data = res.data as { status: string; distance?: number } | undefined;
      toast.success(`Checked in: ${data?.status || "PRESENT"}${data?.distance ? ` (${Math.round(data.distance)}m)` : ""}`);
    } else toast.error(res.error.message);
  };

  // Auto-fill qr_token when session changes (for dev: mock token)
  useEffect(() => {
    if (selectedSession && !qrToken) {
      // For dev, auto-fill mock token if user hasn't typed
      // In prod, student must scan, not auto-fill
    }
  }, [selectedSession, qrToken]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" /> Scan Attendance QR
          </CardTitle>
          <CardDescription>Session QR (short-lived) + optional geofence location. Server validates time + token + Haversine.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Session</Label>
            <select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.status})
                </option>
              ))}
            </select>
            {selectedSession && <p className="text-xs text-muted-foreground">Token: {selectedSession.qr_token.slice(0, 8)}... (short-lived)</p>}
          </div>

          <div className="space-y-2">
            <Label>QR Token (scan or paste)</Label>
            <div className="flex gap-2">
              <Input value={qrToken} onChange={(e) => setQrToken(e.target.value)} placeholder="Paste JSON payload or token" className="flex-1" />
              {!isScanning ? (
                <Button variant="outline" onClick={startScan}>
                  Scan
                </Button>
              ) : (
                <Button variant="outline" onClick={stopScan}>
                  Stop
                </Button>
              )}
            </div>
            <div id="qr-reader" ref={videoRef} className="w-full" />
            <p className="text-xs text-muted-foreground">QR payload = {`{"session_id":"...","qr_token":"..."}`} — static ID-card QR alone NOT sufficient (§16).</p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> Location (for geofence)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Input value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="Latitude" />
              <Input value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="Longitude" />
            </div>
            <Button variant="outline" size="sm" onClick={useCurrentLocation}>
              Use Current Location
            </Button>
            <p className="text-xs text-muted-foreground">Client may provide location, but server calculates distance via Haversine (§17). Never trust client says inside.</p>
          </div>

          <Button onClick={handleCheckIn} className="w-full">
            <Clock className="mr-1 h-4 w-4" /> Check In
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">How it works</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>ID_CARD QR (user.id) + SESSION QR (qr_token) + TIME window (started_at→ended_at) + optional GEOFENCE → server validates all 4 (§16).</p>
          <p>Status: PRESENT (within 15m grace) else LATE • Manual: PERMITTED/SICK via mentor.</p>
          <p>Duplicate: UNIQUE(session_id,user_id) — one check-in per session.</p>
        </CardContent>
      </Card>
    </div>
  );
}
