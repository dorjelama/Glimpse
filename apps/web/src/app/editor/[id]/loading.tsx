export default function EditorLoading() {
  return (
    <div className="h-screen flex flex-col bg-panel text-white overflow-hidden">
      {/* Toolbar skeleton */}
      <div className="h-12 border-b border-white/10 flex items-center px-4 gap-4 flex-shrink-0">
        <div className="w-28 h-6 rounded-lg bg-white/5 animate-pulse" />
        <div className="flex-1 max-w-xs h-5 rounded-lg bg-white/5 animate-pulse" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel skeleton */}
        <div className="hidden md:flex w-48 border-r border-white/10 flex-col gap-2 p-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>

        {/* Canvas skeleton */}
        <div className="flex-1 flex items-center justify-center bg-[#e5e7eb]">
          <div className="bg-white/20 animate-pulse rounded shadow-xl" style={{ width: 360, height: 540 }} />
        </div>

        {/* Right panel skeleton */}
        <div className="hidden md:flex w-60 border-l border-white/10 flex-col gap-3 p-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
