"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { gradeSubmission, requestRevision } from "../actions";
import { toast } from "sonner";

type Submission = {
  id: string;
  user_id: string;
  status: string;
  score: number | null;
  feedback: string | null;
  content_text: string | null;
  profiles?: { email: string; full_name: string | null };
};

type Rubric = {
  id: string;
  title: string;
  items: { id: string; criterion: string; max_points: number }[];
};

export function GradingPanel({ submission, rubric }: { submission: Submission; rubric?: Rubric | null }) {
  const [score, setScore] = useState(String(submission.score ?? ""));
  const [feedback, setFeedback] = useState(submission.feedback || "");
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});

  const totalRubricMax = rubric ? rubric.items.reduce((sum, it) => sum + it.max_points, 0) : 100;
  const totalRubricScore = Object.values(rubricScores).reduce((sum, v) => sum + v, 0);

  const handleGrade = async (status: "GRADED" | "REVISION_REQUIRED") => {
    const fd = new FormData();
    fd.set("submission_id", submission.id);
    // If rubric used, score = rubric total, else manual
    const finalScore = rubric ? String(totalRubricScore) : score;
    fd.set("score", finalScore);
    fd.set("feedback", feedback);
    fd.set("status", status);
    const res = status === "REVISION_REQUIRED" ? await requestRevision(fd) : await gradeSubmission(fd);
    if (res.success) toast.success(status === "GRADED" ? "Graded" : "Revision requested");
    else toast.error(res.error.message);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          Grading — {submission.profiles?.full_name || submission.profiles?.email || submission.user_id}
          <Badge variant="outline">{submission.status}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded border p-3 bg-muted/20">
          <p className="text-sm font-medium">Student Submission:</p>
          <p className="text-sm whitespace-pre-wrap mt-1">{submission.content_text || "— (no text, check file)"}</p>
        </div>

        {rubric && rubric.items.length > 0 && (
          <div className="space-y-2">
            <Label>Rubric: {rubric.title} (Max {totalRubricMax})</Label>
            <div className="space-y-2">
              {rubric.items.map((it) => (
                <div key={it.id} className="flex items-center gap-2">
                  <span className="flex-1 text-sm">{it.criterion} (max {it.max_points})</span>
                  <Input
                    type="number"
                    min={0}
                    max={it.max_points}
                    value={rubricScores[it.id] ?? ""}
                    onChange={(e) => setRubricScores((prev) => ({ ...prev, [it.id]: Number(e.target.value) || 0 }))}
                    className="w-20"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Total rubric: {totalRubricScore} / {totalRubricMax} — akan jadi score.</p>
          </div>
        )}

        {!rubric && (
          <div className="space-y-2">
            <Label>Score (0-1000)</Label>
            <Input type="number" value={score} onChange={(e) => setScore(e.target.value)} placeholder="85" />
          </div>
        )}

        <div className="space-y-2">
          <Label>Feedback</Label>
          <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4} placeholder="Good job, perlu revisi di..." />
        </div>

        <div className="flex gap-2">
          <Button onClick={() => handleGrade("GRADED")}>Grade (GRADED)</Button>
          <Button variant="outline" onClick={() => handleGrade("REVISION_REQUIRED")}>
            Request Revision
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Grading history preserved in submission_revisions + audit. Score server-authoritative (§14).</p>
      </CardContent>
    </Card>
  );
}
