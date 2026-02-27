import { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { VoiceAgentButton } from '../voice/VoiceAgentButton';

const SIDEBAR_COOKIE_NAME = 'sidebar_state';

function getSidebarDefaultOpen(): boolean {
  if (typeof document === 'undefined') return true;
  const match = document.cookie.match(new RegExp(`(?:^|; )${SIDEBAR_COOKIE_NAME}=([^;]*)`));
  const value = match?.[1];
  if (value === 'true') return true;
  if (value === 'false') return false;
  return true;
}

export function Layout() {
  const defaultOpen = useMemo(() => getSidebarDefaultOpen(), []);
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarRail />
      <SidebarInset>
        <TopBar />
        <main className="flex-1 max-w-screen-xl w-full mx-auto px-4 py-6">
          <Outlet />
        </main>
      </SidebarInset>
      <VoiceAgentButton />
    </SidebarProvider>
  );
}
