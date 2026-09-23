"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { issueCertificate } from "../actions";
import { toast } from "sonner";

export function IssueCertificateDialog({ triggerLabel = "Issue Certificate" }: { triggerLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [divisionId, setDivisionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!userId) {
      toast.error("user_id required (uuid)");
      return;
    }
    setIsSubmitting(true);
    const fd = new FormData();
    fd.set("user_id", userId);
    if (divisionId) fd.set("division_id", divisionId);
    const res = await issueCertificate(fd);
    if (res.success) {
      toast.success(`Issued — token ${(res.data as { verification_token: string }).verification_token.slice(0, 8)}...`);
      setOpen(false);
      setUserId("");
    } else toast.error(res.error.message);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>{triggerLabel}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue Certificate</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>User ID * (uuid)</Label>
            <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Paste user id" />
            <p className="text-xs text-muted-foreground">In real, select from members dropdown. For MVP, paste uuid.</p>
          </div>
          <div className="space-y-2">
            <Label>Division ID (optional)</Label>
            <Input value={divisionId} onChange={(e) => setDivisionId(e.target.value)} placeholder="Division uuid" />
          </div>
          <p className="text-xs text-muted-foreground">Generates unique certificate_number + verification_token (UNIQUE) • PDF path via storage certificates bucket (private).</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={onSubmit} disabled={isSubmitting}>{isSubmitting ? "Issuing..." : "Issue"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
