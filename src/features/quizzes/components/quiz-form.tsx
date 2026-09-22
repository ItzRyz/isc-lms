"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { quizSchema, type QuizInput } from "@/lib/validation/quiz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createQuiz } from "../actions";
import { toast } from "sonner";

type CourseOpt = { id: string; name: string; slug: string };

export function QuizFormDialog({ courses, triggerLabel = "Create Quiz" }: { courses: CourseOpt[]; triggerLabel?: string }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<QuizInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(quizSchema as any) as any,
    defaultValues: {
      title: "",
      description: "",
      type: "WEEKLY",
      duration_minutes: 15,
      max_attempts: 1,
      shuffle_questions: false,
      shuffle_choices: false,
      is_published: false,
      pass_score: 60,
      course_id: courses[0]?.id || "",
    },
  });

  const watchedCourse = watch("course_id");
  const watchedType = watch("type");

  const onSubmit = async (data: QuizInput) => {
    const fd = new FormData();
    fd.set("course_id", data.course_id);
    fd.set("title", data.title);
    fd.set("description", data.description || "");
    fd.set("type", data.type);
    fd.set("duration_minutes", String(data.duration_minutes));
    fd.set("max_attempts", String(data.max_attempts));
    fd.set("shuffle_questions", String(data.shuffle_questions));
    fd.set("shuffle_choices", String(data.shuffle_choices));
    if (data.available_from) fd.set("available_from", data.available_from);
    if (data.available_until) fd.set("available_until", data.available_until);
    fd.set("is_published", String(data.is_published));
    fd.set("pass_score", String(data.pass_score));
    const res = await createQuiz(fd);
    if (res.success) {
      toast.success("Quiz created");
      setOpen(false);
      reset();
    } else toast.error(res.error.message);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>{triggerLabel}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Create Quiz</DialogTitle>
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
            <Input {...register("title")} placeholder="Quiz HTML — Weekly" />
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ICE_BREAKING">ICE_BREAKING</SelectItem>
                  <SelectItem value="WEEKLY">WEEKLY</SelectItem>
                  <SelectItem value="ASSESSMENT">ASSESSMENT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration (min)</Label>
              <Input type="number" {...register("duration_minutes")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Max Attempts</Label>
              <Input type="number" {...register("max_attempts")} />
            </div>
            <div className="space-y-2">
              <Label>Pass Score</Label>
              <Input type="number" {...register("pass_score")} />
            </div>
          </div>

          <div className="flex gap-2">
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" {...register("shuffle_questions")} /> Shuffle Q
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" {...register("shuffle_choices")} /> Shuffle Choices
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" {...register("is_published")} /> Published
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
