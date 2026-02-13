import { useState, memo, useMemo } from 'react';
import { Transaction } from '@/types/transaction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  eachMonthOfInterval,
  isWithinInterval,
} from 'date-fns';
import { WEEK_SUNDAY } from '@/lib/dateRanges';

type ConvertToDisplay = (amount: number, currency: string) => number;

interface MonthlyChartProps {
  transactions: Transaction[];
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  convertToDisplay?: ConvertToDisplay;
}

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#f59e0b'];

const noConvert: ConvertToDisplay = (amount) => amount;

export const MonthlyChart = memo(function MonthlyChart({
  transactions,
  period = 'monthly',
  convertToDisplay = noConvert,
}: MonthlyChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const now = new Date();
  const conv = (t: Transaction) => convertToDisplay(t.amount, t.currency ?? 'USD');

  const { data, title, emptyMessage } = useMemo(() => {
    let chartData: { date: string; Income: number; Expenses: number }[] = [];
    let chartTitle = 'Overview';
    let chartEmptyMessage = 'No transactions';

    if (period === 'daily') {
      const dayStart = startOfDay(now);
      const dayEnd = endOfDay(now);
      const dayTransactions = transactions.filter((t) =>
        isWithinInterval(new Date(t.date), { start: dayStart, end: dayEnd })
      );
      if (dayTransactions.length > 0) {
        const income = dayTransactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + conv(t), 0);
        const expenses = dayTransactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + conv(t), 0);
        chartData = [{ date: format(now, 'dd/MM/yy'), Income: income, Expenses: expenses }];
      }
      chartTitle = 'Daily Overview';
      chartEmptyMessage = 'No transactions today';
    } else if (period === 'weekly') {
      const weekStart = startOfWeek(now, WEEK_SUNDAY);
      const weekEnd = endOfWeek(now, WEEK_SUNDAY);
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
      chartData = days
        .map((day) => {
          const dayTransactions = transactions.filter((t) => {
            const tDate = new Date(t.date);
            return format(tDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
          });
          const income = dayTransactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + conv(t), 0);
          const expenses = dayTransactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + conv(t), 0);
          return { date: format(day, 'dd/MM'), Income: income, Expenses: expenses };
        })
        .filter((d) => d.Income > 0 || d.Expenses > 0);
      chartTitle = 'Weekly Overview';
      chartEmptyMessage = 'No transactions this week';
    } else if (period === 'monthly') {
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
      chartData = days
        .map((day) => {
          const dayTransactions = transactions.filter((t) => {
            const tDate = new Date(t.date);
            return format(tDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
          });
          const income = dayTransactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + conv(t), 0);
          const expenses = dayTransactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + conv(t), 0);
          return { date: format(day, 'dd/MM'), Income: income, Expenses: expenses };
        })
        .filter((d) => d.Income > 0 || d.Expenses > 0);
      chartTitle = 'Monthly Overview';
      chartEmptyMessage = 'No transactions this month';
    } else if (period === 'yearly') {
      const yearStart = startOfYear(now);
      const yearEnd = endOfYear(now);
      const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
      chartData = months
        .map((month) => {
          const monthTransactions = transactions.filter((t) => {
            const tDate = new Date(t.date);
            return format(tDate, 'yyyy-MM') === format(month, 'yyyy-MM');
          });
          const income = monthTransactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + conv(t), 0);
          const expenses = monthTransactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + conv(t), 0);
          return { date: format(month, 'MMM'), Income: income, Expenses: expenses };
        })
        .filter((d) => d.Income > 0 || d.Expenses > 0);
      chartTitle = 'Yearly Overview';
      chartEmptyMessage = 'No transactions this year';
    }
    return { data: chartData, title: chartTitle, emptyMessage: chartEmptyMessage };
  }, [transactions, period, convertToDisplay]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  const pieData = [
    { name: 'Income', value: data.reduce((sum, d) => sum + d.Income, 0), color: COLORS[0] },
    { name: 'Expenses', value: data.reduce((sum, d) => sum + d.Expenses, 0), color: COLORS[1] },
  ].filter((item) => item.value > 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Tabs value={chartType} onValueChange={(v) => setChartType(v as 'bar' | 'line' | 'pie')}>
            <TabsList>
              <TabsTrigger value="bar">Bar</TabsTrigger>
              <TabsTrigger value="line">Line</TabsTrigger>
              <TabsTrigger value="pie">Pie</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'pie' ? (
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={50}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          ) : chartType === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Income" fill="#10b981" />
              <Bar dataKey="Expenses" fill="#ef4444" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});
