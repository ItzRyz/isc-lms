"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { announcementSchema, type AnnouncementInput } from "@/lib/validation/communication";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createAnnouncement } from "../actions";
import { toast } from "sonner";

export function AnnouncementFormDialog({ triggerLabel = "Create Announcement" }: { triggerLabel?: string }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AnnouncementInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(announcementSchema as any) as any,
    defaultValues: { title: "", content: "", is_pinned: false, is_published: true },
  });

  const onSubmit = async (data: AnnouncementInput) => {
    const fd = new FormData();
    fd.set("title", data.title);
    fd.set("content", data.content);
    if (data.division_id) fd.set("division_id", data.division_id);
    fd.set("is_pinned", String(data.is_pinned));
    fd.set("is_published", String(data.is_published));
    const res = await createAnnouncement(fd);
    if (res.success) {
      toast.success("Announcement created — notifications sent (IN_APP)");
      setOpen(false);
      reset();
    } else toast.error(res.error.message);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>{triggerLabel}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Announcement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input {...register("title")} placeholder="Web Workshop" />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Content *</Label>
            <Textarea {...register("content")} rows={4} placeholder="Workshop next week..." />
            {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
          </div>
          <div className="flex gap-2">
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" {...register("is_pinned")} /> Pinned
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" {...register("is_published")} defaultChecked /> Published
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
