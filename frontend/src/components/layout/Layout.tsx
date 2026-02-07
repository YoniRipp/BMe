import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { VoiceAgentButton } from '../voice/VoiceAgentButton';

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="max-w-screen-xl mx-auto px-4 py-6 pb-24">
        <Outlet />
      </main>
      <BottomNav />
      <VoiceAgentButton />
    </div>
  );
}
