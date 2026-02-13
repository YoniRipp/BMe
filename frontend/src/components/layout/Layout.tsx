import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { VoiceAgentButton } from '../voice/VoiceAgentButton';

const SIDEBAR_STORAGE_KEY = 'beme-sidebar-open';

function getStoredSidebarOpen(): boolean {
  try {
    const v = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return v === null ? true : v === 'true';
  } catch {
    return true;
  }
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(getStoredSidebarOpen);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarOpen));
    } catch {
      // ignore
    }
  }, [sidebarOpen]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <div className="flex flex-col min-h-screen">
        <TopBar sidebarOpen={sidebarOpen} onSidebarToggle={toggleSidebar} />
        <main className="flex-1 max-w-screen-xl w-full mx-auto px-4 py-6 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <VoiceAgentButton />
    </div>
  );
}
