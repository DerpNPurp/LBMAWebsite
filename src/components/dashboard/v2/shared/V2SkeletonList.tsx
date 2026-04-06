import { Skeleton } from '../../../ui/skeleton';

type V2SkeletonListProps = {
  rows?: number;
  showAvatar?: boolean;
};

export function V2SkeletonList({ rows = 4, showAvatar = false }: V2SkeletonListProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
          {showAvatar && <Skeleton className="h-10 w-10 rounded-full shrink-0" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
