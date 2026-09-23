"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createFinanceTransaction } from "../actions";
import { toast } from "sonner";

type AccountOpt = { id: string; name: string; balance: number };

export function FinanceFormDialog({ accounts, triggerLabel = "New Transaction" }: { accounts: AccountOpt[]; triggerLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!accountId || !amount) {
      toast.error("Account & amount required");
      return;
    }
    setIsSubmitting(true);
    const fd = new FormData();
    fd.set("account_id", accountId);
    fd.set("amount", amount);
    fd.set("description", description);
    const res = await createFinanceTransaction(fd);
    if (res.success) {
      toast.success("Transaction created");
      setOpen(false);
      setAmount("");
      setDescription("");
    } else toast.error(res.error.message);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>{triggerLabel}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Financial Transaction</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Account *</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} (Rp {a.balance.toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Amount * (positive income, negative expense)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500000 or -150000" />
            <p className="text-xs text-muted-foreground">amount ≠0, validated zod</p>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Member Contribution" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={onSubmit} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
          </div>
          <p className="text-xs text-muted-foreground">TREASURER only — RLS isolated • ON DELETE RESTRICT (no cascade) • Audit via audit_logs.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
