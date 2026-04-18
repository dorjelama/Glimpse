export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-[#1a1230] to-indigo-950 flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">Glimpse</h1>
        <p className="text-xs text-purple-300/70 mt-1">Your world in a glimpse</p>
      </div>
      {children}
    </div>
  );
}
