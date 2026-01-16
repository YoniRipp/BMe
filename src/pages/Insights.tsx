import { useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useEnergy } from '@/hooks/useEnergy';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getSpendingInsights,
  getFitnessInsights,
  getHealthInsights,
  getSpendingTrendData,
  getWorkoutFrequencyData,
  getCalorieTrendData,
  calculateTrends,
} from '@/lib/analytics';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, DollarSign, Dumbbell, Zap, ArrowUp, ArrowDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

export function Insights() {
  const { transactions } = useTransactions();
  const { workouts } = useWorkouts();
  const { foodEntries, checkIns } = useEnergy();

  const spendingInsights = useMemo(
    () => getSpendingInsights(transactions),
    [transactions]
  );

  const fitnessInsights = useMemo(
    () => getFitnessInsights(workouts),
    [workouts]
  );

  const healthInsights = useMemo(
    () => getHealthInsights(foodEntries, checkIns),
    [foodEntries, checkIns]
  );

  const spendingTrend = useMemo(
    () => getSpendingTrendData(transactions, 12),
    [transactions]
  );

  const workoutFrequency = useMemo(
    () => getWorkoutFrequencyData(workouts, 12),
    [workouts]
  );

  const calorieTrend = useMemo(
    () => getCalorieTrendData(foodEntries, 30),
    [foodEntries]
  );

  const spendingTrendData = useMemo(() => {
    return calculateTrends(
      transactions.filter(t => t.type === 'expense'),
      (t) => t.amount,
      'month'
    );
  }, [transactions]);

  const workoutTrendData = useMemo(() => {
    return calculateTrends(
      workouts,
      () => 1,
      'week'
    );
  }, [workouts]);

  const categoryPieData = spendingInsights.topCategories.map((cat, idx) => ({
    name: cat.category,
    value: cat.amount,
    color: COLORS[idx % COLORS.length],
  }));

  const workoutTypePieData = useMemo(() => {
    const typeCounts = new Map<string, number>();
    workouts.forEach(w => {
      typeCounts.set(w.type, (typeCounts.get(w.type) || 0) + 1);
    });

    return Array.from(typeCounts.entries()).map(([name, value], idx) => ({
      name,
      value,
      color: COLORS[idx % COLORS.length],
    }));
  }, [workouts]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insights"
        subtitle="Analytics and trends"
        icon={TrendingUp}
        iconColor="text-purple-600"
      />

      {/* Financial Insights */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Financial Insights
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Spending Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-bold">
                  {spendingTrendData.changePercent >= 0 ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <ArrowUp className="w-5 h-5" />
                      {Math.abs(spendingTrendData.changePercent).toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <ArrowDown className="w-5 h-5" />
                      {Math.abs(spendingTrendData.changePercent).toFixed(1)}%
                    </span>
                  )}
                </span>
                <span className="text-sm text-muted-foreground">vs last month</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={spendingTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#10b981" name="Income" />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Expenses" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {spendingInsights.topCategories.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm">{cat.category}</span>
                    <span className="font-semibold">{formatCurrency(cat.amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fitness Insights */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-blue-600" />
          Fitness Insights
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Workout Frequency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-bold">
                  {workoutTrendData.changePercent >= 0 ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <ArrowUp className="w-5 h-5" />
                      {Math.abs(workoutTrendData.changePercent).toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <ArrowDown className="w-5 h-5" />
                      {Math.abs(workoutTrendData.changePercent).toFixed(1)}%
                    </span>
                  )}
                </span>
                <span className="text-sm text-muted-foreground">vs last week</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={workoutFrequency}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workout Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={workoutTypePieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {workoutTypePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fitness Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Workouts per Week</p>
                  <p className="text-2xl font-bold">{fitnessInsights.workoutFrequency}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Duration</p>
                  <p className="text-2xl font-bold">{fitnessInsights.averageDuration} min</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Most Common Type</p>
                  <p className="text-lg font-semibold capitalize">{fitnessInsights.mostCommonType}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Health Insights */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-600" />
          Health Insights
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Calorie Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={calorieTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="calories" stroke="#8b5cf6" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Health Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Average Daily Calories</p>
                  <p className="text-2xl font-bold">{healthInsights.averageDailyCalories.toFixed(0)} cal</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Sleep</p>
                  <p className="text-2xl font-bold">{healthInsights.averageSleepHours.toFixed(1)}h</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sleep Consistency</p>
                  <p className="text-lg font-semibold">{healthInsights.sleepConsistency.toFixed(1)}h std dev</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Macros</p>
                  <p className="text-sm">
                    P: {healthInsights.averageMacros.protein}g | 
                    C: {healthInsights.averageMacros.carbs}g | 
                    F: {healthInsights.averageMacros.fats}g
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
