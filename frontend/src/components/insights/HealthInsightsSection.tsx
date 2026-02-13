import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap } from 'lucide-react';
import { InsightsSectionCarousel } from './InsightsSectionCarousel';
import type { HealthInsight } from '@/lib/analytics';

interface HealthInsightsSectionProps {
  calorieTrend: Array<{ date: string; calories: number }>;
  healthInsights: HealthInsight;
}

export function HealthInsightsSection({ calorieTrend, healthInsights }: HealthInsightsSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Zap className="w-5 h-5 text-purple-600" />
        Health Insights
      </h2>
      <InsightsSectionCarousel
        aria-label="Health insights"
        slides={[
          {
            title: 'Calorie Trend',
            content: (
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
            ),
          },
          {
            title: 'Health Stats',
            content: (
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
            ),
          },
        ]}
      />
    </div>
  );
}
