"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { MemberRow } from "../actions-member";

export function MembersTable({ members }: { members: MemberRow[] }) {
  const [search, setSearch] = useState("");
  const filtered = members.filter(
    (m) =>
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      (m.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      m.roles.join(" ").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <Input placeholder="Search email / name / role..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      <div className="rounded-md border bg-card overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Divisions</TableHead>
              <TableHead>Classes</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length ? (
              filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs">{(m.full_name || m.email).slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{m.full_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{m.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {m.roles.length ? m.roles.map((r) => <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>) : <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {m.division_slugs.length ? m.division_slugs.map((s) => <Badge key={s} variant="outline">{s}</Badge>) : <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">{m.class_names.length ? m.class_names.join(", ") : "—"}</div>
                  </TableCell>
                  <TableCell>{m.is_active ? <Badge>Active</Badge> : <Badge variant="destructive">Inactive</Badge>}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No members found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">Total: {filtered.length} members • multi-role + user_divisions • coordinator view own division only (app layer filter jika coordinator)</p>
    </div>
  );
}
