"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Division } from "../types";
import { DivisionFormDialog } from "./division-form";
import { deleteDivision } from "../actions";
import { toast } from "sonner";

type Props = { divisions: Division[] };

export function DivisionTable({ divisions }: Props) {
  const [search, setSearch] = useState("");

  const filtered = divisions.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Input placeholder="Search name or slug..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <DivisionFormDialog triggerLabel="Create Division" />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length ? (
              filtered.map((div) => (
                <TableRow key={div.id}>
                  <TableCell className="font-medium">{div.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{div.slug}</code>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[240px] truncate">{div.description || "—"}</TableCell>
                  <TableCell>{div.is_active ? <Badge>Active</Badge> : <Badge variant="outline">Inactive</Badge>}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <DivisionFormDialog
                        triggerLabel="Edit"
                        divisionId={div.id}
                        defaultValues={{ name: div.name, slug: div.slug, description: div.description || "", is_active: div.is_active }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!confirm(`Delete division "${div.name}"? (soft delete)`)) return;
                          const res = await deleteDivision(div.id);
                          if (res.success) toast.success("Division deleted (soft)");
                          else toast.error(res.error.message);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No divisions found. {search ? "Try another search." : "Create one."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">Total: {filtered.length} divisions • RLS scope DIVISION • is_division_member enforced server-side</p>
    </div>
  );
}
