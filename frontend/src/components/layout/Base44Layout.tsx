import { useState, useEffect, useMemo } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { startOfMonth, endOfMonth, isAfter } from 'date-fns';
import {
  LayoutDashboard,
  Wallet,
  Dumbbell,
  Zap,
  Calendar,
  Target,
  Menu,
  X,
  Leaf,
  ChevronRight,
  Sun,
  TrendingUp,
  Settings,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useApp } from '@/context/AppContext';
import { useTransactions } from '@/hooks/useTransactions';
import { useExchangeRates } from '@/features/money/useExchangeRates';
import { HeaderBalance } from './HeaderBalance';
import { VoiceAgentButton } from '../voice/VoiceAgentButton';

const ROUTE_TO_TITLE: Record<string, string> = {
  '/': 'Dashboard',
  '/schedule': 'Schedule',
  '/money': 'Money',
  '/body': 'Body',
  '/energy': 'Energy',
  '/goals': 'Goals',
  '/insights': 'Insights',
  '/settings': 'Settings',
  '/groups': 'Groups',
  '/admin': 'Admin',
};

const SIDEBAR_NAV_BASE = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Money', path: '/money', icon: Wallet },
  { name: 'Body', path: '/body', icon: Dumbbell },
  { name: 'Energy', path: '/energy', icon: Zap },
  { name: 'Schedule', path: '/schedule', icon: Calendar },
  { name: 'Goals', path: '/goals', icon: Target },
  { name: 'Insights', path: '/insights', icon: TrendingUp },
  { name: 'Settings', path: '/settings', icon: Settings },
  { name: 'Groups', path: '/groups', icon: Users },
];

function getSidebarNav(isAdmin: boolean) {
  if (!isAdmin) return SIDEBAR_NAV_BASE;
  return [...SIDEBAR_NAV_BASE, { name: 'Admin', path: '/admin', icon: ShieldCheck }];
}

/** Base44-style: first 6 items only (Dashboard, Money, Body, Energy, Schedule, Goals) */
const BOTTOM_NAV_ITEMS = 6;

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/groups/') && pathname.length > 8) return 'Groups';
  return ROUTE_TO_TITLE[pathname] ?? (pathname.slice(1) || 'Dashboard');
}

export function Base44Layout() {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useApp();
  const { settings } = useSettings();
  const { transactions, transactionsLoading } = useTransactions();
  const sidebarNav = useMemo(() => getSidebarNav(user?.role === 'admin'), [user?.role]);
  const displayCurrency = settings.currency;
  const fromCurrencies = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.currency ?? 'USD'))),
    [transactions]
  );
  const { convertToDisplay } = useExchangeRates(displayCurrency, fromCurrencies);

  const { balance, income, expenses } = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    const monthly = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return isAfter(tDate, monthStart) && isAfter(monthEnd, tDate);
    });
    const monthlyIncome = monthly
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + convertToDisplay(t.amount, t.currency ?? 'USD'), 0);
    const monthlyExpenses = monthly
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + convertToDisplay(t.amount, t.currency ?? 'USD'), 0);
    return {
      balance: monthlyIncome - monthlyExpenses,
      income: monthlyIncome,
      expenses: monthlyExpenses,
    };
  }, [transactions, convertToDisplay]);

  const pageTitle = getPageTitle(pathname);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          aria-hidden
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-card border-r border-border z-50
          transform transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 pb-4">
            <Link
              to="/"
              className="flex items-center gap-3"
              aria-label="BeMe home"
            >
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-md">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">BeMe</h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">Life Balance</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 px-3 py-2">
            <p className="px-3 mb-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Navigate</p>
            <div className="space-y-0.5">
              {sidebarNav.map((item) => {
                const isActive = pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                      ${isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg transition-all duration-200
                        ${isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-transparent group-hover:bg-primary/10'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{item.name}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="p-4 mx-3 mb-3 rounded-2xl bg-gradient-to-br from-secondary to-muted/50 border border-border">
            <p className="text-xs font-medium text-muted-foreground">Your wellness journey</p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">Every step counts</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-72 min-h-screen">
        <header
          className={`sticky top-0 z-30 transition-all duration-300
            ${scrolled ? 'bg-card/80 backdrop-blur-xl shadow-sm border-b border-border' : 'bg-transparent'}`}
        >
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 min-h-[4rem]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen((o) => !o)}
                className="lg:hidden p-2 rounded-xl hover:bg-accent transition-colors"
                aria-label="Toggle menu"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <h2 className="text-lg font-semibold text-foreground">{pageTitle}</h2>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
                <Sun className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{dateStr}</span>
              </div>
              <HeaderBalance
                balance={balance}
                income={income}
                expenses={expenses}
                currency={settings.currency}
                balanceDisplayLayout={settings.balanceDisplayLayout}
                loading={transactionsLoading}
              />
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 pb-24 lg:pb-8 pt-2 animate-fade-up">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border z-30 lg:hidden"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around px-2 py-1">
          {sidebarNav.slice(0, BOTTOM_NAV_ITEMS).map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all
                  ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <div className={`p-1 rounded-lg ${isActive ? 'bg-primary/15' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <VoiceAgentButton />
    </div>
  );
}
