'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/authStore';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user === null) { router.push('/'); return; }
    if (user.role !== 'ADMIN') router.push('/');
  }, [user, router]);

  if (!user || user.role !== 'ADMIN') return null;

  const navLinks = [
    { href: '/admin',        label: 'Dashboard' },
    { href: '/admin/users',  label: 'Users' },
    { href: '/admin/events', label: 'Events' },
  ];

  return (
    <div className="flex h-screen bg-neutral-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 bg-neutral-900 border-r border-white/10 flex flex-col">
        <div className="px-4 py-5 border-b border-white/10">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Glimpse Admin</span>
        </div>
        <nav className="flex-1 px-2 py-3 flex flex-col gap-1">
          {navLinks.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-accent/20 text-purple-300 font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-2 py-3 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            ← Back to App
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
