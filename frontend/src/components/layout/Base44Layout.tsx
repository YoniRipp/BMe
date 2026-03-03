import { useState, useEffect, useMemo, Fragment } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
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
  Plus,
  Utensils,
  LogOut,
} from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useTransactions } from '@/hooks/useTransactions';
import { useExchangeRates } from '@/features/money/useExchangeRates';
import { HeaderBalance } from './HeaderBalance';
import { VoiceAgentButton } from '../voice/VoiceAgentButton';
import { OnboardingTour } from '../onboarding/OnboardingTour';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';

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

/** Bottom nav: first 5 sidebar items (Dashboard, Money, Body, Energy, Schedule) + center quick-add */
const BOTTOM_NAV_ITEMS = 5;

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/groups/') && pathname.length > 8) return 'Groups';
  return ROUTE_TO_TITLE[pathname] ?? (pathname.slice(1) || 'Dashboard');
}

export function Base44Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const { user } = useApp();

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };
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
                <h1 className="text-xl font-bold tracking-tight text-charcoal">BeMe</h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">Life Balance</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 px-3 py-2">
            <p className="px-3 mb-2 text-[10px] uppercase tracking-[0.15em] text-stone font-semibold">Navigate</p>
            <div className="space-y-0.5">
              {sidebarNav.map((item) => {
                const isActive = pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    data-onboarding={item.path === '/' ? 'home' : item.path.slice(1)}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                      ${isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-stone hover:bg-cream-warm/60 hover:text-charcoal'
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

          <div className="p-4 mx-3 mb-3 rounded-2xl bg-gradient-to-br from-cream-warm to-mist/50 border border-border">
            <p className="text-xs font-medium text-stone">Your wellness journey</p>
            <p className="text-[10px] text-stone/70 mt-0.5">Every step counts</p>
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
                className="lg:hidden p-2 rounded-xl hover:bg-cream-warm transition-colors"
                aria-label="Toggle menu"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <h2 className="text-lg font-semibold text-charcoal">{pageTitle}</h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 text-[15px] font-semibold text-stone hover:text-charcoal rounded-xl transition-colors min-h-[40px]"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4 shrink-0" strokeWidth={2.25} />
                Log out
              </button>
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
          {sidebarNav.slice(0, BOTTOM_NAV_ITEMS).map((item, idx) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;

            const navLink = (
              <Link
                key={item.path}
                to={item.path}
                data-onboarding={item.path === '/' ? 'home' : item.path.slice(1)}
                className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all
                  ${isActive ? 'text-primary' : 'text-stone'}`}
              >
                <div className={`p-1 rounded-lg ${isActive ? 'bg-primary/15' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );

            if (idx === Math.floor(BOTTOM_NAV_ITEMS / 2)) {
              return (
                <Fragment key="quick-add-group">
                  <Sheet open={quickAddOpen} onOpenChange={setQuickAddOpen}>
                    <SheetTrigger asChild>
                      <button
                        type="button"
                        className="flex flex-col items-center -mt-5"
                        aria-label="Quick add"
                      >
                        <div className="p-3 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                          <Plus className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-medium mt-0.5 text-primary">Add</span>
                      </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="rounded-t-2xl">
                      <SheetHeader>
                        <SheetTitle>Quick Add</SheetTitle>
                      </SheetHeader>
                      <div className="grid grid-cols-4 gap-3 py-4">
                        <Link
                          to="/energy"
                          onClick={() => setQuickAddOpen(false)}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors"
                        >
                          <div className="p-2.5 rounded-full bg-green-100 dark:bg-green-900">
                            <Utensils className="w-5 h-5 text-green-600" />
                          </div>
                          <span className="text-xs font-medium">Food</span>
                        </Link>
                        <Link
                          to="/money"
                          onClick={() => setQuickAddOpen(false)}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors"
                        >
                          <div className="p-2.5 rounded-full bg-blue-100 dark:bg-blue-900">
                            <Wallet className="w-5 h-5 text-blue-600" />
                          </div>
                          <span className="text-xs font-medium">Expense</span>
                        </Link>
                        <Link
                          to="/body"
                          onClick={() => setQuickAddOpen(false)}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors"
                        >
                          <div className="p-2.5 rounded-full bg-orange-100 dark:bg-orange-900">
                            <Dumbbell className="w-5 h-5 text-orange-600" />
                          </div>
                          <span className="text-xs font-medium">Workout</span>
                        </Link>
                        <Link
                          to="/schedule"
                          onClick={() => setQuickAddOpen(false)}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors"
                        >
                          <div className="p-2.5 rounded-full bg-purple-100 dark:bg-purple-900">
                            <Calendar className="w-5 h-5 text-purple-600" />
                          </div>
                          <span className="text-xs font-medium">Schedule</span>
                        </Link>
                      </div>
                    </SheetContent>
                  </Sheet>
                  {navLink}
                </Fragment>
              );
            }

            return navLink;
          })}
        </div>
      </nav>

      <VoiceAgentButton />
      <OnboardingTour />
    </div>
  );
}
