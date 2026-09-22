"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { assignmentSchema, type AssignmentInput } from "@/lib/validation/assignment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createAssignment } from "../actions";
import { toast } from "sonner";

type CourseOpt = { id: string; name: string; slug: string };

export function AssignmentFormDialog({ courses, triggerLabel = "Create Assignment" }: { courses: CourseOpt[]; triggerLabel?: string }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AssignmentInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(assignmentSchema as any) as any,
    defaultValues: {
      title: "",
      description: "",
      type: "INDIVIDUAL",
      submission_type: "FILE_AND_TEXT",
      due_at: null,
      allow_late: true,
      max_score: 100,
      max_attempts: 1,
      is_published: false,
      course_id: courses[0]?.id || "",
    },
  });

  const watchedCourse = watch("course_id");
  const watchedType = watch("type");
  const watchedSubmission = watch("submission_type");

  const onSubmit = async (data: AssignmentInput) => {
    const fd = new FormData();
    fd.set("course_id", data.course_id);
    if (data.module_id) fd.set("module_id", data.module_id);
    fd.set("title", data.title);
    fd.set("description", data.description || "");
    fd.set("type", data.type);
    fd.set("submission_type", data.submission_type);
    if (data.due_at) fd.set("due_at", data.due_at);
    fd.set("allow_late", String(data.allow_late));
    fd.set("max_score", String(data.max_score));
    fd.set("max_attempts", String(data.max_attempts));
    fd.set("is_published", String(data.is_published));
    const res = await createAssignment(fd);
    if (res.success) {
      toast.success("Assignment created");
      setOpen(false);
      reset();
    } else toast.error(res.error.message);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>{triggerLabel}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Create Assignment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-4">
          <div className="space-y-2">
            <Label>Course *</Label>
            <Select value={watchedCourse} onValueChange={(v) => setValue("course_id" as never, v as never)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.course_id && <p className="text-sm text-destructive">{errors.course_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Title *</Label>
            <Input {...register("title")} placeholder="Tugas HTML — Landing Page" />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...register("description")} rows={3} placeholder="Buat landing page..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={watchedType} onValueChange={(v) => setValue("type" as never, v as never)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDIVIDUAL">INDIVIDUAL</SelectItem>
                  <SelectItem value="GROUP">GROUP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Submission</Label>
              <Select value={watchedSubmission} onValueChange={(v) => setValue("submission_type" as never, v as never)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FILE">FILE</SelectItem>
                  <SelectItem value="TEXT">TEXT</SelectItem>
                  <SelectItem value="FILE_AND_TEXT">FILE_AND_TEXT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Due At</Label>
              <Input type="datetime-local" {...register("due_at")} />
              <p className="text-xs text-muted-foreground">Server validates — late = submitted after due_at.</p>
            </div>
            <div className="space-y-2">
              <Label>Max Score</Label>
              <Input type="number" {...register("max_score")} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
