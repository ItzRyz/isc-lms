import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Award, Clock } from "lucide-react";

type Event = {
  id: string;
  title: string;
  description: string | null;
  type: "WORKSHOP" | "SEMINAR" | "COMPETITION" | "MEETING" | "STUDY_SESSION" | "OTHER";
  location: string | null;
  start_at: string;
  end_at: string;
  max_participants: number | null;
  points_reward: number;
  is_published: boolean;
  division_name?: string;
  participant_count?: number;
};

export function EventCard({ event, onRegister }: { event: Event; onRegister?: () => void }) {
  const isPast = new Date(event.end_at) < new Date();
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base line-clamp-1">{event.title}</CardTitle>
          <Badge variant={event.type === "WORKSHOP" ? "default" : event.type === "SEMINAR" ? "secondary" : "outline"}>{event.type}</Badge>
        </div>
        {event.division_name && <CardDescription className="text-xs">{event.division_name}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{event.description || "—"}</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline" className="gap-1"><Calendar className="h-3 w-3" /> {new Date(event.start_at).toLocaleDateString()}</Badge>
          <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> {new Date(event.start_at).toLocaleTimeString()} → {new Date(event.end_at).toLocaleTimeString()}</Badge>
          {event.location && <Badge variant="outline" className="gap-1"><MapPin className="h-3 w-3" /> {event.location}</Badge>}
          {event.max_participants && <Badge variant="outline" className="gap-1"><Users className="h-3 w-3" /> {event.participant_count ?? 0}/{event.max_participants}</Badge>}
          {event.points_reward > 0 && <Badge variant="secondary" className="gap-1"><Award className="h-3 w-3" /> +{event.points_reward} pts</Badge>}
          {isPast && <Badge variant="destructive">Past</Badge>}
        </div>
        {onRegister && !isPast && (
          <Button variant="outline" size="sm" className="w-full" onClick={onRegister}>
            Register
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
