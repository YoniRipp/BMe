import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
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
import { DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { TrendBadge } from '@/components/shared/TrendBadge';
import { InsightsSectionCarousel } from './InsightsSectionCarousel';
import type { TrendData, SpendingInsight } from '@/lib/analytics';

interface FinancialInsightsSectionProps {
  spendingTrend: Array<{ month: string; income: number; expenses: number }>;
  spendingTrendData: TrendData;
  categoryPieData: Array<{ name: string; value: number; color: string }>;
  spendingInsights: SpendingInsight;
  displayCurrency: string;
}

export function FinancialInsightsSection({
  spendingTrend,
  spendingTrendData,
  categoryPieData,
  spendingInsights,
  displayCurrency,
}: FinancialInsightsSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-green-600" />
        Financial Insights
      </h2>
      <InsightsSectionCarousel
        aria-label="Financial insights"
        slides={[
          {
            title: 'Spending Trend',
            content: (
              <Card>
                <CardHeader>
                  <CardTitle>Spending Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <TrendBadge changePercent={spendingTrendData.changePercent} label="vs last month" />
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
            ),
          },
          {
            title: 'Category Breakdown',
            content: (
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
                        outerRadius={80}
                        innerRadius={40}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ),
          },
          {
            title: 'Top Expenses',
            content: (
              <Card>
                <CardHeader>
                  <CardTitle>Top Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {spendingInsights.topCategories.map((cat, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm">{cat.category}</span>
                        <span className="font-semibold">{formatCurrency(cat.amount, displayCurrency)}</span>
                      </div>
                    ))}
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
