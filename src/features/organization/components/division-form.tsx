"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { divisionSchema, type DivisionInput } from "@/lib/validation/division";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createDivision, updateDivision } from "../actions";
import { toast } from "sonner";

export function DivisionFormDialog({
  triggerLabel = "Create Division",
  defaultValues,
  divisionId,
}: {
  triggerLabel?: string;
  defaultValues?: Partial<DivisionInput>;
  divisionId?: string;
}) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<DivisionInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(divisionSchema as any) as any,
    defaultValues: {
      name: defaultValues?.name || "",
      slug: defaultValues?.slug || "",
      description: defaultValues?.description || "",
      is_active: defaultValues?.is_active ?? true,
    },
  });

  const onSubmit = async (data: DivisionInput) => {
    const fd = new FormData();
    fd.set("name", data.name);
    fd.set("slug", data.slug);
    fd.set("description", data.description || "");
    fd.set("is_active", String(data.is_active));

    const res = divisionId ? await updateDivision(divisionId, fd) : await createDivision(fd);
    if (res.success) {
      toast.success(divisionId ? "Division updated" : "Division created");
      setOpen(false);
      reset();
    } else {
      toast.error(res.error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        {triggerLabel}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{divisionId ? "Edit Division" : "Create Division"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} placeholder="Web Development" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" {...register("slug")} placeholder="web" />
            {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
            <p className="text-xs text-muted-foreground">Hanya lowercase, angka, strip. Unique per AGENTS.md §33.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} placeholder="Deskripsi divisi" rows={3} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
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
