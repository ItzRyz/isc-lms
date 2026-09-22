"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { attendanceSessionSchema, type AttendanceSessionInput } from "@/lib/validation/attendance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createAttendanceSession } from "../actions";
import { toast } from "sonner";

type DivisionOpt = { id: string; name: string; slug: string };
type ClassOpt = { id: string; name: string; slug: string; division_id: string };

export function SessionFormDialog({
  divisions,
  classes,
  triggerLabel = "Create Session",
}: {
  divisions: DivisionOpt[];
  classes: ClassOpt[];
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AttendanceSessionInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(attendanceSessionSchema as any) as any,
    defaultValues: {
      title: "Attendance Session",
      division_id: divisions[0]?.id || null,
      class_id: classes[0]?.id || null,
      started_at: new Date().toISOString().slice(0, 16),
      ended_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
      latitude: null,
      longitude: null,
      radius_meters: null,
      status: "OPEN",
    },
  });

  const watchedDiv = watch("division_id");
  const filteredClasses = watch("division_id") ? classes.filter((c) => c.division_id === watch("division_id")) : classes;

  const onSubmit = async (data: AttendanceSessionInput) => {
    const fd = new FormData();
    if (data.division_id) fd.set("division_id", data.division_id);
    if (data.class_id) fd.set("class_id", data.class_id);
    fd.set("title", data.title);
    fd.set("started_at", new Date(data.started_at).toISOString());
    fd.set("ended_at", new Date(data.ended_at).toISOString());
    if (data.latitude !== null && data.latitude !== undefined) fd.set("latitude", String(data.latitude));
    if (data.longitude !== null && data.longitude !== undefined) fd.set("longitude", String(data.longitude));
    if (data.radius_meters) fd.set("radius_meters", String(data.radius_meters));
    fd.set("status", data.status);

    const res = await createAttendanceSession(fd);
    if (res.success) {
      toast.success("Session created — QR token short-lived until ended_at");
      setOpen(false);
      reset();
    } else toast.error(res.error.message);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("latitude", pos.coords.latitude);
        setValue("longitude", pos.coords.longitude);
        setValue("radius_meters", 200);
        toast.success(`Location set: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)} (±200m)`);
      },
      () => toast.error("Failed to get location")
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>{triggerLabel}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Create Attendance Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input {...register("title")} placeholder="Web Kelas A Today" />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Division</Label>
              <Select value={watchedDiv || "__none"} onValueChange={(v) => setValue("division_id" as never, (v === "__none" ? null : v) as never)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— None —</SelectItem>
                  {divisions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} ({d.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={watch("class_id") || "__none"} onValueChange={(v) => setValue("class_id" as never, (v === "__none" ? null : v) as never)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— None —</SelectItem>
                  {filteredClasses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Started At *</Label>
              <Input type="datetime-local" {...register("started_at")} />
              {errors.started_at && <p className="text-sm text-destructive">{errors.started_at.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Ended At *</Label>
              <Input type="datetime-local" {...register("ended_at")} />
              {errors.ended_at && <p className="text-sm text-destructive">{errors.ended_at.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Geofence (optional — Haversine server)</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input type="number" step="0.00001" placeholder="Latitude" {...register("latitude")} />
              <Input type="number" step="0.00001" placeholder="Longitude" {...register("longitude")} />
              <Input type="number" placeholder="Radius m" {...register("radius_meters")} />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={useCurrentLocation}>
              Use Current Location
            </Button>
            <p className="text-xs text-muted-foreground">Static ID-card QR identifies user, but NOT proof — must combine with session QR + time + geofence (§16).</p>
            {errors.latitude && <p className="text-sm text-destructive">{errors.latitude.message}</p>}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
