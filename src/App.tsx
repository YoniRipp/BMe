import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { ToastProvider } from './components/shared/ToastProvider';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
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
  const { settings } = useSettings();

  // Apply theme on mount and when settings change
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

    // Listen to system theme changes if theme is 'system'
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
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

        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
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
    </BrowserRouter>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider />
      <AuthProvider>
        <AppProvider>
          <TransactionProvider>
            <WorkoutProvider>
              <EnergyProvider>
                <ScheduleProvider>
                  <GroupProvider>
                    <GoalsProvider>
                      <NotificationProvider>
                        <AppContent />
                      </NotificationProvider>
                    </GoalsProvider>
                  </GroupProvider>
                </ScheduleProvider>
              </EnergyProvider>
            </WorkoutProvider>
          </TransactionProvider>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
