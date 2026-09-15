import type { Metadata } from 'next';
import { Inter, Press_Start_2P } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/lib/theme';
import { FocusProvider } from '@/lib/focus-context';
import AppShell from '@/components/layout/AppShell';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const pressStart2P = Press_Start_2P({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-pixel',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Tadac — Personal Productivity & Learning',
    template: '%s | Tadac',
  },
  description:
    'Tadac is your all-in-one productivity and learning companion: plan your day, focus deeper, practice interview questions, master revision, and track real progress — all in a beautiful, distraction-free environment.',
  keywords: ['productivity', 'focus timer', 'pomodoro', 'spaced repetition', 'study', 'planner'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${pressStart2P.variable}`}>
      <body>
        <ThemeProvider>
          <FocusProvider xpPerSession={30}>
            <AppShell>
              {children}
            </AppShell>
          </FocusProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
