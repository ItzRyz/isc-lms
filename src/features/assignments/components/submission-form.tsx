"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { submitAssignment } from "../actions";
import { toast } from "sonner";
import { Save, Send, Clock } from "lucide-react";

type Props = {
  assignment: {
    id: string;
    title: string;
    submission_type: "FILE" | "TEXT" | "FILE_AND_TEXT";
    due_at: string | null;
    allow_late: boolean;
  };
  existingSubmission?: {
    id: string;
    status: string;
    content_text: string | null;
    score: number | null;
    feedback: string | null;
  } | null;
};

export function SubmissionForm({ assignment, existingSubmission }: Props) {
  const [contentText, setContentText] = useState(existingSubmission?.content_text || "");
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const draftTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const dueAt = assignment.due_at ? new Date(assignment.due_at) : null;
  const now = new Date();
  const isLate = dueAt ? now > dueAt : false;
  const isClosed = isLate && !assignment.allow_late;

  // Autosave draft every 2s after typing (debounce)
  useEffect(() => {
    if (existingSubmission?.status === "GRADED") return; // don't autosave graded
    if (contentText === (existingSubmission?.content_text || "")) return; // no change

    if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);
    draftTimeoutRef.current = setTimeout(async () => {
      if (!contentText.trim() && !file) return;
      setIsSaving(true);
      const fd = new FormData();
      fd.set("assignment_id", assignment.id);
      fd.set("content_text", contentText);
      fd.set("is_draft", "true");
      // Note: file not autosaved, only text (file autosave requires upload, skip for MVP)
      const res = await submitAssignment(fd);
      if (res.success) {
        setLastSaved(new Date());
        toast.success("Draft autosaved", { duration: 1500 });
      }
      setIsSaving(false);
    }, 2000);

    return () => {
      if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);
    };
  }, [contentText, file, assignment.id, existingSubmission?.content_text, existingSubmission?.status]);

  const handleSubmit = async (isDraft: boolean) => {
    if (isClosed && !isDraft) {
      toast.error("Deadline passed and late not allowed");
      return;
    }
    const fd = new FormData();
    fd.set("assignment_id", assignment.id);
    fd.set("content_text", contentText);
    fd.set("is_draft", String(isDraft));
    if (file) fd.set("file", file);

    const res = await submitAssignment(fd);
    if (res.success) {
      toast.success(isDraft ? "Draft saved" : isLate ? "Submitted (Late)" : "Submitted");
      if (!isDraft) setLastSaved(new Date());
    } else {
      toast.error(res.error.message);
    }
  };

  if (existingSubmission?.status === "GRADED") {
    return (
      <div className="rounded-md border p-4 bg-green-50 dark:bg-green-950/20 space-y-2">
        <div className="flex items-center gap-2">
          <Badge className="bg-green-600">GRADED</Badge>
          <span className="text-sm font-medium">Score: {existingSubmission.score ?? "—"}/100</span>
        </div>
        {existingSubmission.feedback && (
          <div className="text-sm">
            <p className="font-medium">Mentor Feedback:</p>
            <p className="text-muted-foreground whitespace-pre-wrap">{existingSubmission.feedback}</p>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Grading history preserved in submission_revisions.</p>
      </div>
    );
  }

  if (existingSubmission?.status === "REVISION_REQUIRED") {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3">
          <Badge variant="secondary" className="bg-amber-500 text-white">
            REVISION_REQUIRED
          </Badge>
          <p className="text-sm mt-1">{existingSubmission.feedback || "Perlu revisi — silakan resubmit."}</p>
        </div>
        <SubmissionInputs
          assignment={assignment}
          contentText={contentText}
          setContentText={setContentText}
          file={file}
          setFile={setFile}
          isSaving={isSaving}
          lastSaved={lastSaved}
          onDraft={() => handleSubmit(true)}
          onSubmit={() => handleSubmit(false)}
        />
      </div>
    );
  }

  return (
    <SubmissionInputs
      assignment={assignment}
      contentText={contentText}
      setContentText={setContentText}
      file={file}
      setFile={setFile}
      isSaving={isSaving}
      lastSaved={lastSaved}
      onDraft={() => handleSubmit(true)}
      onSubmit={() => handleSubmit(false)}
      isLate={isLate}
      isClosed={isClosed}
      existingStatus={existingSubmission?.status}
    />
  );
}

function SubmissionInputs({
  assignment,
  contentText,
  setContentText,
  file,
  setFile,
  isSaving,
  lastSaved,
  onDraft,
  onSubmit,
  isLate,
  isClosed,
  existingStatus,
}: {
  assignment: Props["assignment"];
  contentText: string;
  setContentText: (v: string) => void;
  file: File | null;
  setFile: (f: File | null) => void;
  isSaving: boolean;
  lastSaved: Date | null;
  onDraft: () => void;
  onSubmit: () => void;
  isLate?: boolean;
  isClosed?: boolean;
  existingStatus?: string | null;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs">
        {isLate && <Badge variant="destructive">Late — submitted after due_at (server-authoritative)</Badge>}
        {isClosed && <Badge variant="destructive">Closed — late not allowed</Badge>}
        {existingStatus === "DRAFT" && <Badge variant="outline">Draft</Badge>}
        {existingStatus === "LATE" && <Badge variant="destructive">Late</Badge>}
        {isSaving && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" /> Autosaving...
          </span>
        )}
        {lastSaved && !isSaving && <span className="text-muted-foreground">Last saved {lastSaved.toLocaleTimeString()}</span>}
      </div>

      {(assignment.submission_type === "TEXT" || assignment.submission_type === "FILE_AND_TEXT") && (
        <div className="space-y-2">
          <Label>Text Submission</Label>
          <Textarea value={contentText} onChange={(e) => setContentText(e.target.value)} placeholder="Tulis jawaban / deskripsi..." rows={6} />
          <p className="text-xs text-muted-foreground">Autosave draft 2s setelah mengetik (hanya text).</p>
        </div>
      )}

      {(assignment.submission_type === "FILE" || assignment.submission_type === "FILE_AND_TEXT") && (
        <div className="space-y-2">
          <Label>File Upload (private bucket assignment-submissions, 10MB max)</Label>
          <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} accept=".pdf,.zip,.doc,.docx,.png,.jpg,.txt" />
          {file && <p className="text-xs text-muted-foreground">Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB) — MIME validated server-side.</p>}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={onDraft} disabled={isSaving}>
          <Save className="mr-1 h-4 w-4" /> Save Draft
        </Button>
        <Button onClick={onSubmit} disabled={!!isClosed}>
          <Send className="mr-1 h-4 w-4" /> {isLate ? "Submit (Late)" : "Submit"}
        </Button>
      </div>
      {isClosed && <p className="text-xs text-destructive">Cannot submit — deadline passed and allow_late=false (server validates).</p>}
    </div>
  );
}
