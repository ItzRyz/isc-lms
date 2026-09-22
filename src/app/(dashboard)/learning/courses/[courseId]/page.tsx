import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCourseById, getModulesByCourse, getMaterialsByCourse } from "@/features/learning/actions";
import { ArrowLeft, Clock, Video, FileText, Link2, BookOpen, CheckCircle } from "lucide-react";

export const dynamic = "force-dynamic";

function MaterialIcon({ type }: { type: string }) {
  if (type === "VIDEO") return <Video className="h-4 w-4" />;
  if (type === "EXTERNAL_LINK") return <Link2 className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

export default async function Page({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);
  if (!course) notFound();

  const [modules, materials] = await Promise.all([getModulesByCourse(courseId), getMaterialsByCourse(courseId)]);

  // Group materials by module
  const materialsByModule = new Map<string, typeof materials>();
  for (const m of materials as unknown as { module_id: string }[]) {
    const list = materialsByModule.get(m.module_id) || [];
    list.push(m as never);
    materialsByModule.set(m.module_id, list as never);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" render={<Link href="/learning" />}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Badge variant="outline">{(course as { is_published?: boolean }).is_published ? "Published" : "Draft"}</Badge>
        {(course as { division_name?: string }).division_name && <Badge variant="secondary">{(course as { division_name?: string }).division_name}</Badge>}
      </div>

      <div>
        <h1 className="text-2xl font-semibold">{(course as { name: string }).name}</h1>
        <p className="text-muted-foreground">{(course as { description?: string | null }).description || "—"}</p>
        <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {(course as { estimated_duration?: number | null }).estimated_duration || 0} min
          </span>
          <span>{modules.length} modules • {materials.length} materials</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> Roadmap — DAG Prerequisites
          </CardTitle>
          <CardDescription>Next.js requires React + HTML (multi-parent demo). Complete prereq first — server validates via material_prerequisites.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Materials</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(modules as Array<{ id: string; title: string; order_index: number }>).map((mod) => {
                  const mats = (materialsByModule.get(mod.id) || []) as Array<{
                    id: string;
                    title: string;
                    type: string;
                    prerequisite_ids?: string[];
                    estimated_duration?: number | null;
                    is_published: boolean;
                  }>;
                  return (
                    <TableRow key={mod.id}>
                      <TableCell className="font-medium">
                        {mod.order_index}. {mod.title}
                      </TableCell>
                      <TableCell>
                        {mats.length ? (
                          <div className="space-y-2">
                            {mats.map((mat) => (
                              <div key={mat.id} className="flex items-center justify-between rounded border p-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <MaterialIcon type={mat.type} />
                                  <span>{mat.title}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {mat.type}
                                  </Badge>
                                  {mat.prerequisite_ids && mat.prerequisite_ids.length > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      requires {mat.prerequisite_ids.length} prereq
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  {mat.estimated_duration && <span className="text-xs text-muted-foreground">{mat.estimated_duration}m</span>}
                                  <Link href={`/learning/materials/${mat.id}`} className="text-xs text-primary hover:underline">
                                    View
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No materials</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {modules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                      No modules. Create via P3 full spec (module order 1-100).
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Progress (P3 full weight)</CardTitle>
          <CardDescription>material_progress + course_progress_snapshots (40/30/30). Assignment/Quiz 0 di P3, akan terisi P4/P5.</CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          <p>Formula: total = material*0.4 + assignment*0.3 + quiz*0.3 — weights configurable di snapshots. Bookmark & complete via material view.</p>
          <p className="mt-1">Material completion: {materials.length ? "0%" : "—"} (mock) — completeMaterial() checks DAG prerequisites server-side.</p>
        </CardContent>
      </Card>
    </div>
  );
}
