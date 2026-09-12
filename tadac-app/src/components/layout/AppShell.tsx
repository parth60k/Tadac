'use client';

import { Sidebar, BottomNav } from './Sidebar';
import SceneBackground from './SceneBackground';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <>
      {/* Layer 1: Environment art */}
      <SceneBackground />

      {/* Layer 2: App UI */}
      <div className="app-shell">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Main content area */}
        <main className="main-content" id="main-content" role="main">
          {children}
        </main>
      </div>

      {/* Layer 2b: Mobile bottom nav */}
      <BottomNav />
    </>
  );
}
