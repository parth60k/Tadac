'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  CalendarDays,
  Timer,
  MessageSquare,
  BookOpen,
  FolderKanban,
  BarChart2,
  Gift,
  NotebookPen,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '@/lib/theme';

const NAV_ITEMS = [
  { href: '/',           label: 'Home',      icon: Home },
  { href: '/planner',   label: 'Planner',   icon: CalendarDays },
  { href: '/focus',     label: 'Focus',     icon: Timer },
  { href: '/interview', label: 'Interview', icon: MessageSquare },
  { href: '/revision',  label: 'Revision',  icon: BookOpen },
  { href: '/projects',  label: 'Projects',  icon: FolderKanban },
  { href: '/progress',  label: 'Progress',  icon: BarChart2 },
  { href: '/rewards',   label: 'Rewards',   icon: Gift },
  { href: '/journal',   label: 'Journal',   icon: NotebookPen },
  { href: '/settings',  label: 'Settings',  icon: Settings },
];

// Mobile: show only the first 5 + settings
const MOBILE_NAV = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[2],
  NAV_ITEMS[4],
  NAV_ITEMS[9],
];

export function Sidebar() {
  const pathname = usePathname();
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <nav className="sidebar" aria-label="Main navigation">
      {/* Brand */}
      <div className="brand-logo">TADAC</div>

      {/* Nav items */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`nav-item${isActive ? ' active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="nav-icon" strokeWidth={1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Theme toggle at bottom */}
      <button
        onClick={toggleTheme}
        className="nav-item btn-ghost"
        style={{ marginTop: 8, width: '100%', justifyContent: 'flex-start', border: 'none', cursor: 'pointer', background: 'transparent' }}
        aria-label={`Switch to ${resolvedTheme === 'day' ? 'night' : 'day'} theme`}
        id="theme-toggle-sidebar"
      >
        {resolvedTheme === 'day'
          ? <Moon className="nav-icon" strokeWidth={1.8} />
          : <Sun  className="nav-icon" strokeWidth={1.8} />
        }
        <span>{resolvedTheme === 'day' ? 'Night mode' : 'Day mode'}</span>
      </button>
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`bottom-nav-item${isActive ? ' active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
      <button
        onClick={toggleTheme}
        className="bottom-nav-item"
        style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}
        aria-label="Toggle theme"
        id="theme-toggle-mobile"
      >
        {resolvedTheme === 'day'
          ? <Moon size={20} strokeWidth={1.8} />
          : <Sun  size={20} strokeWidth={1.8} />
        }
        <span>Theme</span>
      </button>
    </nav>
  );
}
