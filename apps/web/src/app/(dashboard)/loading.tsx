import DashboardShell from '@/components/DashboardShell';

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/5 ${className ?? ''}`} />;
}

export default function DashboardLoading() {
  return (
    <DashboardShell>
      <div className="px-8 py-8 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <Skeleton className="h-36 rounded-none" />
              <div className="p-4 flex flex-col gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
