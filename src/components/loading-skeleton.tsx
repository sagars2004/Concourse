import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function FlightStatusSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="h-6 w-32 rounded bg-muted" />
        <div className="h-5 w-16 rounded-full bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function RecommendationsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="space-y-3 p-5">
            <div className="flex justify-between gap-3">
              <div className="h-5 w-28 rounded bg-muted" />
              <div className="h-4 w-20 rounded bg-muted" />
            </div>
            <div className="flex gap-2">
              <div className="h-5 w-16 rounded bg-muted" />
              <div className="h-5 w-20 rounded bg-muted" />
            </div>
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
