"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { classSchema, type ClassInput } from "@/lib/validation/class";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClass } from "../actions-class";
import { toast } from "sonner";

type DivisionOpt = { id: string; name: string; slug: string };
type PeriodOpt = { id: string; name: string };

export function ClassFormDialog({
  divisions,
  periods,
  triggerLabel = "Create Class",
}: {
  divisions: DivisionOpt[];
  periods: PeriodOpt[];
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
  } = useForm<ClassInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(classSchema as any) as any,
    defaultValues: { name: "", slug: "", division_id: divisions[0]?.id || "", academic_period_id: periods[0]?.id || null, is_active: true },
  });

  const watchedDivision = watch("division_id");
  const watchedPeriod = watch("academic_period_id");

  const onSubmit = async (data: ClassInput) => {
    const fd = new FormData();
    fd.set("division_id", data.division_id);
    if (data.academic_period_id) fd.set("academic_period_id", data.academic_period_id);
    fd.set("name", data.name);
    fd.set("slug", data.slug);
    fd.set("is_active", String(data.is_active));
    const res = await createClass(fd);
    if (res.success) {
      toast.success("Class created");
      setOpen(false);
      reset();
    } else toast.error(res.error.message);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>{triggerLabel}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Class</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-4">
          <div className="space-y-2">
            <Label>Division *</Label>
            <Select value={watchedDivision} onValueChange={(v) => setValue("division_id" as never, v as never)}>
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
            <Label>Academic Period</Label>
            <Select
              value={(watchedPeriod as string | null) || "__none"}
              onValueChange={(v) => setValue("academic_period_id" as never, (v === "__none" ? null : v) as never)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— None —</SelectItem>
                {periods.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Name *</Label>
            <Input {...register("name")} placeholder="Web - Kelas A 2025 Ganjil" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Slug *</Label>
            <Input {...register("slug")} placeholder="web-a-2025-ganjil" />
            {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
            <p className="text-xs text-muted-foreground">Unique per division (UNIQUE division_id, slug).</p>
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
