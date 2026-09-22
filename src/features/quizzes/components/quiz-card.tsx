import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, FileQuestion, Trophy, Eye } from "lucide-react";

type Quiz = {
  id: string;
  title: string;
  description: string | null;
  type: "ICE_BREAKING" | "WEEKLY" | "ASSESSMENT";
  duration_minutes: number;
  max_attempts: number;
  is_published: boolean;
  available_from: string | null;
  available_until: string | null;
  pass_score: number;
  course_name?: string;
};

function typeColor(type: string) {
  if (type === "ICE_BREAKING") return "secondary";
  if (type === "WEEKLY") return "outline";
  return "default";
}

export function QuizCard({ quiz }: { quiz: Quiz }) {
  const now = new Date();
  const isAvailable = !quiz.available_from || new Date(quiz.available_from) <= now;
  const isExpired = quiz.available_until ? now > new Date(quiz.available_until) : false;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base line-clamp-1">{quiz.title}</CardTitle>
          <Badge variant={typeColor(quiz.type) as never}>{quiz.type}</Badge>
        </div>
        {quiz.course_name && <CardDescription className="text-xs">{quiz.course_name}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{quiz.description || "—"}</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" /> {quiz.duration_minutes}m
          </Badge>
          <Badge variant="outline" className="gap-1">
            <FileQuestion className="h-3 w-3" /> Max {quiz.max_attempts}x
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Trophy className="h-3 w-3" /> Pass {quiz.pass_score}
          </Badge>
          {!isAvailable ? <Badge variant="secondary">Not yet</Badge> : isExpired ? <Badge variant="destructive">Expired</Badge> : null}
        </div>
        <Button variant="outline" size="sm" className="w-full" render={<Link href={`/quizzes/${quiz.id}`} />}>
          <Eye className="mr-1 h-3 w-3" /> View & Start
        </Button>
      </CardContent>
    </Card>
  );
}
