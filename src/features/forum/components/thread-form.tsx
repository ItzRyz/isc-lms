"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { threadSchema, type ThreadInput } from "@/lib/validation/communication";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createThread } from "../actions";
import { toast } from "sonner";

type CategoryOpt = { id: string; name: string; slug: string };

export function ThreadFormDialog({ categories, triggerLabel = "New Thread" }: { categories: CategoryOpt[]; triggerLabel?: string }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ThreadInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(threadSchema as any) as any,
    defaultValues: { title: "", content: "", category_id: categories[0]?.id || "", is_pinned: false, is_locked: false },
  });

  const watchedCat = watch("category_id");

  const onSubmit = async (data: ThreadInput) => {
    const fd = new FormData();
    fd.set("category_id", data.category_id);
    fd.set("title", data.title);
    fd.set("content", data.content);
    fd.set("is_pinned", String(data.is_pinned));
    const res = await createThread(fd);
    if (res.success) {
      toast.success("Thread created");
      setOpen(false);
      reset();
    } else toast.error(res.error.message);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>{triggerLabel}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Thread</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-4">
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select value={watchedCat} onValueChange={(v) => setValue("category_id" as never, v as never)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category_id && <p className="text-sm text-destructive">{errors.category_id.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input {...register("title")} placeholder="Bagaimana handle prerequisites DAG?" />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Content *</Label>
            <Textarea {...register("content")} rows={4} placeholder="Mohon penjelasan..." />
            {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
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
