"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventSchema, type EventInput } from "@/lib/validation/event";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createEvent } from "../actions";
import { toast } from "sonner";

type DivisionOpt = { id: string; name: string; slug: string };

export function EventFormDialog({ divisions, triggerLabel = "Create Event" }: { divisions: DivisionOpt[]; triggerLabel?: string }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EventInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(eventSchema as any) as any,
    defaultValues: { title: "", description: "", type: "WORKSHOP", division_id: divisions[0]?.id || null, location: "", start_at: new Date().toISOString().slice(0, 16), end_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16), max_participants: null, points_reward: 0, is_published: true },
  });

  const watchedType = watch("type");
  const watchedDiv = watch("division_id");

  const onSubmit = async (data: EventInput) => {
    const fd = new FormData();
    fd.set("title", data.title);
    fd.set("description", data.description || "");
    fd.set("type", data.type);
    if (data.division_id) fd.set("division_id", data.division_id);
    if (data.location) fd.set("location", data.location);
    fd.set("start_at", new Date(data.start_at).toISOString());
    fd.set("end_at", new Date(data.end_at).toISOString());
    if (data.max_participants) fd.set("max_participants", String(data.max_participants));
    fd.set("points_reward", String(data.points_reward));
    fd.set("is_published", String(data.is_published));
    const res = await createEvent(fd);
    if (res.success) {
      toast.success("Event created — announcement auto");
      setOpen(false);
      reset();
    } else toast.error(res.error.message);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>{triggerLabel}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input {...register("title")} placeholder="Workshop Next.js 16" />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...register("description")} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={watchedType} onValueChange={(v) => setValue("type" as never, v as never)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WORKSHOP">WORKSHOP</SelectItem>
                  <SelectItem value="SEMINAR">SEMINAR</SelectItem>
                  <SelectItem value="COMPETITION">COMPETITION</SelectItem>
                  <SelectItem value="MEETING">MEETING</SelectItem>
                  <SelectItem value="STUDY_SESSION">STUDY_SESSION</SelectItem>
                  <SelectItem value="OTHER">OTHER</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Division</Label>
              <Select value={watchedDiv || "__none"} onValueChange={(v) => setValue("division_id" as never, (v === "__none" ? null : v) as never)}>
                <SelectTrigger><SelectValue placeholder="Pilih division" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— All —</SelectItem>
                  {divisions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input {...register("location")} placeholder="Lab Web" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start At *</Label>
              <Input type="datetime-local" {...register("start_at")} />
              {errors.start_at && <p className="text-sm text-destructive">{errors.start_at.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>End At *</Label>
              <Input type="datetime-local" {...register("end_at")} />
              {errors.end_at && <p className="text-sm text-destructive">{errors.end_at.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Max Participants</Label>
              <Input type="number" {...register("max_participants")} placeholder="30" />
            </div>
            <div className="space-y-2">
              <Label>Points Reward</Label>
              <Input type="number" {...register("points_reward")} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
