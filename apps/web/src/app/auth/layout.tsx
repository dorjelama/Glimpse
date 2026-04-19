export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <p className="text-3xl font-semibold text-terra mb-1" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.02em' }}>Glimpse</p>
        <p className="text-xs text-ink/40 uppercase tracking-widest">by Elegant Decorations</p>
      </div>
      {children}
    </div>
  );
}
