import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { ToastProvider } from './components/shared/ToastProvider';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { TransactionProvider } from './context/TransactionContext';
import { WorkoutProvider } from './context/WorkoutContext';
import { EnergyProvider } from './context/EnergyContext';
import { ScheduleProvider } from './context/ScheduleContext';
import { GroupProvider } from './context/GroupContext';
import { GoalsProvider } from './context/GoalsContext';
import { NotificationProvider } from './context/NotificationContext';
import { Layout } from './components/layout/Layout';
import { LoadingSpinner } from './components/shared/LoadingSpinner';
import { useSettings } from './hooks/useSettings';

// Lazy load page components
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Money = lazy(() => import('./pages/Money').then(m => ({ default: m.Money })));
const Body = lazy(() => import('./pages/Body').then(m => ({ default: m.Body })));
const Energy = lazy(() => import('./pages/Energy').then(m => ({ default: m.Energy })));
const Groups = lazy(() => import('./pages/Groups').then(m => ({ default: m.Groups })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Insights = lazy(() => import('./pages/Insights').then(m => ({ default: m.Insights })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Signup = lazy(() => import('./pages/Signup').then(m => ({ default: m.Signup })));

function AppContent() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={
          <Suspense fallback={<LoadingSpinner text="Loading..." />}>
            <Login />
          </Suspense>
        } />
        <Route path="/signup" element={
          <Suspense fallback={<LoadingSpinner text="Loading..." />}>
            <Signup />
          </Suspense>
        } />
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}

function ProtectedRoutes() {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppProvider>
      <TransactionProvider>
        <WorkoutProvider>
          <EnergyProvider>
            <ScheduleProvider>
              <GroupProvider>
                <GoalsProvider>
                  <NotificationProvider>
                    <ProtectedAppRoutes />
                  </NotificationProvider>
                </GoalsProvider>
              </GroupProvider>
            </ScheduleProvider>
          </EnergyProvider>
        </WorkoutProvider>
      </TransactionProvider>
    </AppProvider>
  );
}

function ProtectedAppRoutes() {
  const { settings } = useSettings();

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      if (settings.theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
      } else {
        root.classList.toggle('dark', settings.theme === 'dark');
      }
    };
    applyTheme();
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={
          <Suspense fallback={<LoadingSpinner text="Loading dashboard..." />}>
            <Home />
          </Suspense>
        } />
        <Route path="money" element={
          <Suspense fallback={<LoadingSpinner text="Loading money page..." />}>
            <Money />
          </Suspense>
        } />
        <Route path="body" element={
          <Suspense fallback={<LoadingSpinner text="Loading body page..." />}>
            <Body />
          </Suspense>
        } />
        <Route path="energy" element={
          <Suspense fallback={<LoadingSpinner text="Loading energy page..." />}>
            <Energy />
          </Suspense>
        } />
        <Route path="groups" element={
          <Suspense fallback={<LoadingSpinner text="Loading groups page..." />}>
            <Groups />
          </Suspense>
        } />
        <Route path="insights" element={
          <Suspense fallback={<LoadingSpinner text="Loading insights..." />}>
            <Insights />
          </Suspense>
        } />
        <Route path="settings" element={
          <Suspense fallback={<LoadingSpinner text="Loading settings..." />}>
            <Settings />
          </Suspense>
        } />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
