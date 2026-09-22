"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { correctAttendance } from "../actions";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type RecordRow = {
  id: string;
  session_id: string;
  user_id: string;
  status: string;
  checked_in_at: string | null;
  distance_meters?: number | null;
  is_geofence_valid?: boolean | null;
  profiles?: { email: string; full_name: string | null };
  attendance_sessions?: { title: string };
};

export function RecordsTable({ records }: { records: RecordRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = records.filter(
    (r) =>
      (r.profiles?.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.profiles?.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      r.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <Input placeholder="Search email / name / status..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      <div className="rounded-md border bg-card overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Checked In</TableHead>
              <TableHead>Geofence</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length ? (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="text-sm font-medium">{r.profiles?.full_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.profiles?.email || r.user_id.slice(0, 8)}</div>
                  </TableCell>
                  <TableCell className="text-xs">{r.attendance_sessions?.title || r.session_id.slice(0, 8)}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "PRESENT" ? "default" : r.status === "LATE" ? "secondary" : r.status === "ABSENT" ? "destructive" : "outline"}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{r.checked_in_at ? new Date(r.checked_in_at).toLocaleString() : "—"}</TableCell>
                  <TableCell className="text-xs">
                    {r.distance_meters !== null && r.distance_meters !== undefined ? `${Math.round(r.distance_meters)}m ${r.is_geofence_valid ? "✓" : "✗"}` : "—"}
                  </TableCell>
                  <TableCell>
                    <CorrectionDialog recordId={r.id} currentStatus={r.status} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No records.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">Total: {filtered.length} • Correction creates audit_logs ATTENDANCE_CORRECTED (§30) • UNIQUE(session_id,user_id)</p>
    </div>
  );
}

function CorrectionDialog({ recordId, currentStatus }: { recordId: string; currentStatus: string }) {
  const [open, setOpen] = useState(false);
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [reason, setReason] = useState("");

  const handleCorrect = async () => {
    if (!reason.trim()) {
      toast.error("Reason required");
      return;
    }
    const fd = new FormData();
    fd.set("record_id", recordId);
    fd.set("new_status", newStatus);
    fd.set("reason", reason);
    const res = await correctAttendance(fd);
    if (res.success) {
      toast.success("Corrected — audit logged");
      setOpen(false);
    } else toast.error(res.error.message);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>Correct</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Correct Attendance</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Current: {currentStatus}</Label>
            <Select value={newStatus} onValueChange={(v) => setNewStatus((v as string) || currentStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRESENT">PRESENT</SelectItem>
                <SelectItem value="LATE">LATE</SelectItem>
                <SelectItem value="PERMITTED">PERMITTED</SelectItem>
                <SelectItem value="SICK">SICK</SelectItem>
                <SelectItem value="ABSENT">ABSENT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Izin sakit dengan surat..." rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCorrect}>Save Correction</Button>
          </div>
          <p className="text-xs text-muted-foreground">Creates attendance_corrections + audit_logs ATTENDANCE_CORRECTED (§16 Critical).</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
