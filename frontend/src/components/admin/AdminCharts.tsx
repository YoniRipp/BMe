import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAdminStats } from '@/hooks/useAdminStats';
import { VOICE_HEAVY_THRESHOLD } from './constants';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function AdminCharts() {
  const { data, isLoading } = useAdminStats();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
              Loading...
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const userGrowthData = data.userGrowth.map((d) => ({
    date: formatDate(d.date),
    signups: d.count,
  }));

  const voiceData = data.dailyVoiceCalls.map((d) => ({
    date: formatDate(d.date),
    calls: d.calls,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">User Growth (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="signups" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Daily Voice API Calls (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={voiceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="calls" fill="#8b5cf6" />
              <ReferenceLine
                y={VOICE_HEAVY_THRESHOLD}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={{ value: 'Heavy use', position: 'right', fill: '#ef4444', fontSize: 11 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
