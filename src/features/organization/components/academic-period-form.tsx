"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { academicPeriodSchema, type AcademicPeriodInput } from "@/lib/validation/academic-period";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createAcademicPeriod } from "../actions-academic";
import { toast } from "sonner";

export function AcademicPeriodFormDialog({ triggerLabel = "Create Period" }: { triggerLabel?: string }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AcademicPeriodInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(academicPeriodSchema as any) as any,
    defaultValues: { name: "", start_date: "", end_date: "", is_active: true },
  });

  const onSubmit = async (data: AcademicPeriodInput) => {
    const fd = new FormData();
    fd.set("name", data.name);
    fd.set("start_date", data.start_date);
    fd.set("end_date", data.end_date);
    fd.set("is_active", String(data.is_active));
    const res = await createAcademicPeriod(fd);
    if (res.success) {
      toast.success("Academic period created");
      setOpen(false);
      reset();
    } else toast.error(res.error.message);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>{triggerLabel}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Academic Period</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input {...register("name")} placeholder="2025/2026 Ganjil" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" {...register("start_date")} />
              {errors.start_date && <p className="text-sm text-destructive">{errors.start_date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" {...register("end_date")} />
              {errors.end_date && <p className="text-sm text-destructive">{errors.end_date.message}</p>}
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
