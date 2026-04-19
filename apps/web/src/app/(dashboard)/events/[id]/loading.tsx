import DashboardShell from '@/components/DashboardShell';

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/5 ${className ?? ''}`} />;
}

export default function EventLoading() {
  return (
    <DashboardShell>
      <div className="px-8 py-8 max-w-4xl">
        <Skeleton className="h-5 w-24 mb-3" />
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-40 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
