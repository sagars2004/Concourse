import { MapPin, Clock, Footprints } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TimeIndicator } from "@/components/time-indicator";

export interface FoodRecommendationProps {
  name: string;
  cuisine: string;
  walkTime: number;
  roundTrip: number;
  location: string;
  level: "green" | "yellow" | "red";
  opinion: string;
  tags: string[];
}

export function FoodRecommendationCard({
  name,
  cuisine,
  walkTime,
  roundTrip,
  location,
  level,
  opinion,
  tags,
}: FoodRecommendationProps) {
  return (
    <Card className="flex h-full min-h-0 flex-col transition-colors hover:border-primary/30">
      <CardContent className="flex min-h-0 flex-1 flex-col space-y-3 p-5">
        <div className="min-w-0">
          <h4 className="truncate font-semibold">{name}</h4>
          <p className="text-sm text-muted-foreground">{cuisine}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Footprints className="h-3.5 w-3.5 shrink-0" />
            {walkTime} min walk
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {roundTrip} min round trip
          </span>
        </div>

        <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{location}</span>
        </div>

        <p className="border-l-2 border-primary/30 pl-3 text-sm italic text-muted-foreground">
          &ldquo;{opinion}&rdquo;
        </p>

        <div className="shrink-0 pt-2">
          <TimeIndicator level={level} />
        </div>
      </CardContent>
    </Card>
  );
}
