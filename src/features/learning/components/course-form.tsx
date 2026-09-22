"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { courseSchema, type CourseInput } from "@/lib/validation/course";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createCourse } from "../actions";
import { toast } from "sonner";

type DivisionOpt = { id: string; name: string; slug: string };

export function CourseFormDialog({ divisions, triggerLabel = "Create Course" }: { divisions: DivisionOpt[]; triggerLabel?: string }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CourseInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(courseSchema as any) as any,
    defaultValues: { name: "", slug: "", description: "", division_id: divisions[0]?.id || "", is_published: false, estimated_duration: null },
  });

  const watchedDiv = watch("division_id");

  const onSubmit = async (data: CourseInput) => {
    const fd = new FormData();
    fd.set("division_id", data.division_id);
    fd.set("name", data.name);
    fd.set("slug", data.slug);
    fd.set("description", data.description || "");
    fd.set("is_published", String(data.is_published));
    if (data.scheduled_at) fd.set("scheduled_at", data.scheduled_at);
    if (data.estimated_duration) fd.set("estimated_duration", String(data.estimated_duration));
    const res = await createCourse(fd);
    if (res.success) {
      toast.success("Course created");
      setOpen(false);
      reset();
    } else toast.error(res.error.message);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>{triggerLabel}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Course</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-4">
          <div className="space-y-2">
            <Label>Division *</Label>
            <Select value={watchedDiv} onValueChange={(v) => setValue("division_id" as never, v as never)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih division" />
              </SelectTrigger>
              <SelectContent>
                {divisions.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} ({d.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.division_id && <p className="text-sm text-destructive">{errors.division_id.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input {...register("name")} placeholder="Frontend Development" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Slug *</Label>
            <Input {...register("slug")} placeholder="frontend-development" />
            {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...register("description")} rows={2} placeholder="HTML, CSS, JS..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input type="number" {...register("estimated_duration")} placeholder="600" />
            </div>
            <div className="space-y-2">
              <Label>Scheduled At</Label>
              <Input type="datetime-local" {...register("scheduled_at")} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
