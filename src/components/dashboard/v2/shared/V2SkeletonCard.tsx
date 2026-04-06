import { Skeleton } from '../../../ui/skeleton';
import { Card, CardContent, CardHeader } from '../../../ui/card';

type V2SkeletonCardProps = {
  lines?: number;
  hasHeader?: boolean;
};

export function V2SkeletonCard({ lines = 3, hasHeader = true }: V2SkeletonCardProps) {
  return (
    <Card>
      {hasHeader && (
        <CardHeader className="space-y-2 pb-3">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4"
            style={{ width: `${[80, 95, 60, 75, 85][i % 5]}%` }}
          />
        ))}
      </CardContent>
    </Card>
  );
}
