"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { submitQuizAttempt } from "../actions";
import { toast } from "sonner";
import { Timer, Send } from "lucide-react";

type Question = {
  id: string;
  content: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "MULTIPLE_ANSWER";
  points: number;
  choices: { id: string; text: string }[];
};

type Props = {
  attemptId: string;
  questions: Question[];
  expiresAt: string | null;
  durationMinutes: number;
};

export function AttemptForm({ attemptId, questions, expiresAt, durationMinutes }: Props) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (!expiresAt) return durationMinutes * 60;
    const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });
  const [submitting, setSubmitting] = useState(false);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleSelect = (qId: string, choiceId: string, type: string, checked?: boolean) => {
    setAnswers((prev) => {
      if (type === "MULTIPLE_ANSWER") {
        const cur = prev[qId] || [];
        if (checked) return { ...prev, [qId]: [...cur, choiceId] };
        return { ...prev, [qId]: cur.filter((c) => c !== choiceId) };
      }
      return { ...prev, [qId]: [choiceId] };
    });
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const payload = Object.entries(answers).map(([question_id, selected_choice_ids]) => ({ question_id, selected_choice_ids }));
    for (const q of questions) {
      if (!payload.find((p) => p.question_id === q.id)) payload.push({ question_id: q.id, selected_choice_ids: [] });
    }
    const fd = new FormData();
    fd.set("attempt_id", attemptId);
    fd.set("answers", JSON.stringify(payload));
    const res = await submitQuizAttempt(fd);
    if (res.success) {
      toast.success(`Submitted! Score: ${(res.data as { score: number })?.score ?? "?"}%`);
      window.location.href = window.location.href;
    } else {
      toast.error(res.error.message);
    }
    setSubmitting(false);
  };

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      toast.error("Time expired — submitting automatically");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant={timeLeft < 60 ? "destructive" : timeLeft < 300 ? "secondary" : "outline"} className="gap-1">
          <Timer className="h-3 w-3" /> {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")} / {durationMinutes}m
        </Badge>
        <span className="text-xs text-muted-foreground">Randomized server-side • Score server-calculated • Do not trust client</span>
      </div>

      {questions.map((q, idx) => (
        <Card key={q.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>
                {idx + 1}. {q.content}
              </span>
              <Badge variant="outline">{q.type}</Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground">{q.points} points • {q.type === "MULTIPLE_ANSWER" ? "Choose multiple" : q.type === "TRUE_FALSE" ? "True/False" : "Choose one"}</p>
          </CardHeader>
          <CardContent>
            {q.type === "MULTIPLE_ANSWER" ? (
              <div className="space-y-2">
                {q.choices.map((c) => (
                  <Label key={c.id} className="flex items-center gap-2 rounded border p-2 hover:bg-muted">
                    <Checkbox
                      checked={(answers[q.id] || []).includes(c.id)}
                      onCheckedChange={(checked) => handleSelect(q.id, c.id, q.type, checked as boolean)}
                    />
                    {c.text}
                  </Label>
                ))}
              </div>
            ) : (
              <RadioGroup value={answers[q.id]?.[0] || ""} onValueChange={(v) => handleSelect(q.id, v, q.type)}>
                <div className="space-y-2">
                  {q.choices.map((c) => (
                    <Label key={c.id} className="flex items-center gap-2 rounded border p-2 hover:bg-muted">
                      <RadioGroupItem value={c.id} />
                      {c.text}
                    </Label>
                  ))}
                </div>
              </RadioGroup>
            )}
          </CardContent>
        </Card>
      ))}

      <Button onClick={handleSubmit} disabled={submitting || timeLeft === 0} className="w-full">
        <Send className="mr-1 h-4 w-4" /> {submitting ? "Submitting..." : "Submit Quiz"}
      </Button>
      <p className="text-xs text-muted-foreground text-center">Server validates: availability, attempt limit, ownership, timer. Score calculated server-side via correct choices.</p>
    </div>
  );
}
