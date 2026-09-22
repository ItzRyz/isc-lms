import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, FileText, Eye } from "lucide-react";

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  type: "INDIVIDUAL" | "GROUP";
  submission_type: "FILE" | "TEXT" | "FILE_AND_TEXT";
  due_at: string | null;
  allow_late: boolean;
  max_score: number;
  is_published: boolean;
  course_name?: string;
};

function getStatusBadge(due_at: string | null, allow_late: boolean) {
  if (!due_at) return <Badge variant="secondary">No deadline</Badge>;
  const now = new Date();
  const due = new Date(due_at);
  const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (diffHours < 0) return <Badge variant="destructive">{allow_late ? "Late allowed" : "Closed"}</Badge>;
  if (diffHours < 24) return <Badge variant="secondary">Due soon</Badge>;
  return <Badge variant="outline">Open</Badge>;
}

export function AssignmentCard({ assignment }: { assignment: Assignment }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base line-clamp-1">{assignment.title}</CardTitle>
          {assignment.is_published ? <Badge>Published</Badge> : <Badge variant="outline">Draft</Badge>}
        </div>
        {assignment.course_name && <CardDescription className="text-xs">{assignment.course_name}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{assignment.description || "—"}</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" /> {assignment.type}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <FileText className="h-3 w-3" /> {assignment.submission_type}
          </Badge>
          {getStatusBadge(assignment.due_at, assignment.allow_late)}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {assignment.due_at ? new Date(assignment.due_at).toLocaleString() : "No deadline"} 
          <span className="flex items-center gap-1 ml-auto">
            <Clock className="h-3 w-3" /> Max {assignment.max_score}
          </span>
        </div>
        <Button variant="outline" size="sm" className="w-full" render={<Link href={`/assignments/${assignment.id}`} />}>
          <Eye className="mr-1 h-3 w-3" /> View & Submit
        </Button>
      </CardContent>
    </Card>
  );
}
