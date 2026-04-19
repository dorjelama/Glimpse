'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import UserMenu from '@/components/UserMenu';
import { useAuthStore } from '@/lib/authStore';

const NAV = [
  {
    href: '/dashboard',
    label: 'Events',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    matchExact: true,
  },
];

const SETTINGS_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-violet-950 via-[#1a1230] to-indigo-950 overflow-hidden">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col border-r border-white/10 bg-black/20">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-white/10 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex-shrink-0"
            style={{ backgroundImage: 'url("/App Icon and Favicon Dark.png")', backgroundSize: '180%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
          />
          <div className="leading-tight min-w-0">
            <div className="text-sm font-semibold text-white" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.02em' }}>Glimpse</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-widest truncate">by Elegant Decorations</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV.map(({ href, label, icon, matchExact }) => {
            const active = matchExact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-accent/20 text-purple-300'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={active ? 'text-purple-400' : 'text-gray-500'}>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Settings + User at bottom */}
        <div className="px-3 py-3 border-t border-white/10 flex flex-col gap-1">
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              pathname === '/settings'
                ? 'bg-accent/20 text-purple-300'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
          <div className="px-1 py-1">
            <UserMenu compact />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex-shrink-0"
              style={{ backgroundImage: 'url("/App Icon and Favicon Dark.png")', backgroundSize: '180%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
            />
            <span className="text-base font-semibold text-white" style={{ fontFamily: 'Georgia, serif' }}>Glimpse</span>
          </div>
          <UserMenu compact />
        </div>

        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 flex border-t border-white/10 bg-[#1a1230]/95 backdrop-blur-md z-40">
        {NAV.map(({ href, label, icon, matchExact }) => {
          const active = matchExact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                active ? 'text-purple-300' : 'text-gray-500'
              }`}
            >
              <span className={active ? 'text-purple-400' : 'text-gray-500'}>{icon}</span>
              {label}
            </Link>
          );
        })}
        <Link
          href="/settings"
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
            pathname === '/settings' ? 'text-purple-300' : 'text-gray-500'
          }`}
        >
          <span className={pathname === '/settings' ? 'text-purple-400' : 'text-gray-500'}>{SETTINGS_ICON}</span>
          Settings
        </Link>
      </nav>
    </div>
  );
}
