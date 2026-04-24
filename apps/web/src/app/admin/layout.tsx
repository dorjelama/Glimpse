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
    { href: '/admin',        label: 'Dashboard', icon: '◈' },
    { href: '/admin/users',  label: 'Users',     icon: '◎' },
    { href: '/admin/events', label: 'Events',    icon: '◇' },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'linear-gradient(160deg,#fdf6e8 0%,#f5e6cc 100%)' }}>

      {/* Sidebar */}
      <aside
        className="w-52 flex-shrink-0 flex flex-col"
        style={{ backgroundColor: '#B85C37', borderRight: '2px solid #9e4e2f' }}
      >
        {/* Brand */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(158,78,47,0.6)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(246,235,221,0.5)' }}>
            Glimpse
          </p>
          <p className="text-sm font-bold" style={{ fontFamily: 'Georgia, serif', color: '#F6EBDD' }}>
            Admin Studio
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navLinks.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all"
                style={active
                  ? { backgroundColor: 'rgba(246,235,221,0.18)', color: '#F6EBDD', fontWeight: 600 }
                  : { color: 'rgba(246,235,221,0.6)' }
                }
              >
                <span className="text-base leading-none">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Back */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(158,78,47,0.6)' }}>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
            style={{ color: 'rgba(246,235,221,0.45)' }}
          >
            ← Back to App
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
