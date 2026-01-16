import { useState } from 'react';
import { Workout } from '@/types/workout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
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
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval } from 'date-fns';

interface WorkoutFrequencyChartProps {
  workouts: Workout[];
  weeks?: number;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export function WorkoutFrequencyChart({ workouts, weeks = 12 }: WorkoutFrequencyChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  // Prepare bar chart data (weekly frequency)
  const now = new Date();
  const barData = Array.from({ length: weeks }, (_, i) => {
    const weekStart = startOfWeek(new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000));
    const weekEnd = endOfWeek(weekStart);
    const weekWorkouts = workouts.filter(w => {
      const date = w.date instanceof Date ? w.date : new Date(w.date);
      return isWithinInterval(date, { start: weekStart, end: weekEnd });
    });
    return {
      week: format(weekStart, 'MMM dd'),
      count: weekWorkouts.length,
    };
  }).reverse();

  // Prepare pie chart data (workout type distribution)
  const typeCounts = new Map<string, number>();
  workouts.forEach(w => {
    typeCounts.set(w.type, (typeCounts.get(w.type) || 0) + 1);
  });

  const pieData = Array.from(typeCounts.entries()).map(([name, value], idx) => ({
    name,
    value,
    color: COLORS[idx % COLORS.length],
  }));

  if (workouts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workout Frequency</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No workouts to display
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Workout Frequency</CardTitle>
          <Tabs value={chartType} onValueChange={(v) => setChartType(v as 'bar' | 'pie')}>
            <TabsList>
              <TabsTrigger value="bar">Frequency</TabsTrigger>
              <TabsTrigger value="pie">Types</TabsTrigger>
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
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          ) : (
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
