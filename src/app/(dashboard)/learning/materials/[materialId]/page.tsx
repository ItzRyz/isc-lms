import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMaterialById, completeMaterial, toggleBookmark } from "@/features/learning/actions";
import { ArrowLeft, Bookmark, CheckCircle, Clock, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ materialId: string }> }) {
  const { materialId } = await params;
  const mat = await getMaterialById(materialId);
  if (!mat) notFound();

  const material = mat as {
    id: string;
    title: string;
    type: string;
    content_url: string | null;
    storage_path: string | null;
    is_published: boolean;
    scheduled_at: string | null;
    estimated_duration: number | null;
    visibility: string;
    course_id: string;
  };

  const isScheduled = material.scheduled_at && new Date(material.scheduled_at) > new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" render={<Link href={`/learning/courses/${material.course_id}`} />}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Course
        </Button>
        <Badge variant={material.is_published ? "default" : "outline"}>{material.is_published ? "Published" : "Draft"}</Badge>
        <Badge variant="secondary">{material.type}</Badge>
        {isScheduled && <Badge variant="outline">Scheduled: {new Date(material.scheduled_at!).toLocaleString()}</Badge>}
      </div>

      <div>
        <h1 className="text-2xl font-semibold">{material.title}</h1>
        <p className="text-muted-foreground">Type {material.type} • Visibility {material.visibility} • {material.estimated_duration || 0} min</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Content</CardTitle>
            <CardDescription>
              {material.type === "DOCUMENT" && "Document — Storage materials bucket (private signed URL di P3 full)"}
              {material.type === "VIDEO" && "Video — embed atau external link"}
              {material.type === "EXTERNAL_LINK" && "External link"}
              {(material.type === "ASSIGNMENT_REF" || material.type === "QUIZ_REF") && "Reference — assignment/quiz (P4/P5 akan link)"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {material.type === "EXTERNAL_LINK" && material.content_url && (
              <a href={material.content_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                <ExternalLink className="h-4 w-4" /> {material.content_url}
              </a>
            )}
            {material.type === "VIDEO" && material.content_url && (
              <div className="rounded border p-4 bg-muted/20">
                <p className="text-sm">Video URL: {material.content_url}</p>
                <p className="text-xs text-muted-foreground mt-1">Embed player akan di-render di sini (YouTube/Storage signed URL).</p>
              </div>
            )}
            {material.type === "DOCUMENT" && (
              <div className="rounded border p-4 bg-muted/20">
                <p className="text-sm">Document: {material.storage_path || "No file — upload via P3 full spec Storage materials bucket"}</p>
                <p className="text-xs text-muted-foreground mt-1">Validate MIME/size/ownership, private signed URL.</p>
              </div>
            )}
            {(material.type === "ASSIGNMENT_REF" || material.type === "QUIZ_REF") && (
              <p className="text-sm text-muted-foreground">Ref ID: {material.type === "ASSIGNMENT_REF" ? (material as { assignment_id?: string }).assignment_id || "—" : (material as { quiz_id?: string }).quiz_id || "—"}</p>
            )}
            {!material.is_published && <p className="text-sm text-amber-600">Draft — not visible to MEMBER until published.</p>}
            {isScheduled && <p className="text-sm text-amber-600">Scheduled — visible after {material.scheduled_at}</p>}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <form
                action={async () => {
                  "use server";
                  await completeMaterial(material.id);
                }}
              >
                <Button type="submit" className="w-full">
                  <CheckCircle className="mr-1 h-4 w-4" /> Mark Complete
                </Button>
              </form>
              <p className="text-xs text-muted-foreground">Server checks DAG prerequisites (material_prerequisites) — fails if prereq not completed.</p>

              <form
                action={async () => {
                  "use server";
                  await toggleBookmark(material.id, false);
                }}
              >
                <Button variant="outline" type="submit" className="w-full">
                  <Bookmark className="mr-1 h-4 w-4" /> Bookmark
                </Button>
              </form>
              <p className="text-xs text-muted-foreground">Bookmark → material_bookmarks (UNIQUE user_id,material_id) • In-app + Realtime.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Meta</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <p>Version: {(material as { version?: number }).version || 1} • Visibility: {material.visibility}</p>
              <p>Estimated: {material.estimated_duration || 0} min</p>
              <p>Storage: private bucket `materials`, signed URL, MIME/size validation (AGENTS.md §37)</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
