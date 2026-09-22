import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

type Course = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_published: boolean;
  scheduled_at: string | null;
  estimated_duration: number | null;
  division_name?: string;
};

export function CourseCard({ course }: { course: Course }) {
  const isScheduled = course.scheduled_at && new Date(course.scheduled_at) > new Date();
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base line-clamp-1">{course.name}</CardTitle>
          {course.is_published ? <Badge>Published</Badge> : <Badge variant="outline">Draft</Badge>}
        </div>
        {course.division_name && <CardDescription className="text-xs">{course.division_name}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{course.description || "—"}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {course.estimated_duration && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {course.estimated_duration}m
            </span>
          )}
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" /> {course.slug}
          </span>
          {isScheduled && <Badge variant="secondary" className="text-xs">Scheduled</Badge>}
        </div>
        <Button variant="outline" size="sm" className="w-full" render={<Link href={`/learning/courses/${course.id}`} />}>
          <Eye className="mr-1 h-3 w-3" /> View
        </Button>
      </CardContent>
    </Card>
  );
}
