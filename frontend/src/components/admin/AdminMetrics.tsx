import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Database,
  AlertTriangle,
  Clock,
  Cpu,
  HardDrive,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { adminApi, AdminMetricsResponse } from '@/core/api/admin';

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`}
    />
  );
}

export function AdminMetrics() {
  const [data, setData] = useState<AdminMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminApi.getMetrics();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading metrics...
        </CardContent>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">{error}</CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { uptime, http, db, errors, events, system } = data;

  // Top routes by request count for chart
  const topRoutes = http.routes.slice(0, 10).map((r) => ({
    route: r.route.length > 30 ? r.route.slice(0, 27) + '...' : r.route,
    requests: r.total,
    avgMs: r.avgMs,
    p95Ms: r.p95Ms,
  }));

  const memPercent = system.memoryMb.heapTotal > 0
    ? Math.round((system.memoryMb.heapUsed / system.memoryMb.heapTotal) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Server Metrics</h2>
        <Button variant="outline" size="sm" onClick={fetchMetrics} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Clock className="h-3.5 w-3.5" />
              Uptime
            </div>
            <div className="text-lg font-semibold">{formatUptime(uptime.seconds)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Activity className="h-3.5 w-3.5" />
              Requests
            </div>
            <div className="text-lg font-semibold">{http.totalRequests.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Database className="h-3.5 w-3.5" />
              DB Queries
            </div>
            <div className="text-lg font-semibold">{db.totalQueries.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Errors
            </div>
            <div className="text-lg font-semibold">
              <StatusDot ok={errors.total === 0} />{' '}
              {errors.total}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <HardDrive className="h-3.5 w-3.5" />
              Memory
            </div>
            <div className="text-lg font-semibold">
              {system.memoryMb.heapUsed}MB
              <span className="text-xs font-normal text-muted-foreground ml-1">({memPercent}%)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Zap className="h-3.5 w-3.5" />
              Events
            </div>
            <div className="text-lg font-semibold">{events.published.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top routes by request count */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Routes (by requests)</CardTitle>
          </CardHeader>
          <CardContent>
            {topRoutes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No requests yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topRoutes} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="route" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="requests" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Route latency (p95) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Route Latency p95 (ms)</CardTitle>
          </CardHeader>
          <CardContent>
            {topRoutes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No requests yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topRoutes} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="ms" />
                  <YAxis type="category" dataKey="route" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="p95Ms" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* DB & System detail cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Database performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <div>
                <span className="text-muted-foreground">Total Queries</span>
                <p className="font-medium">{db.totalQueries.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Errors</span>
                <p className="font-medium">{db.errors}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Avg Latency</span>
                <p className="font-medium">{db.avgMs}ms</p>
              </div>
              <div>
                <span className="text-muted-foreground">p50</span>
                <p className="font-medium">{db.p50Ms}ms</p>
              </div>
              <div>
                <span className="text-muted-foreground">p95</span>
                <p className="font-medium">{db.p95Ms}ms</p>
              </div>
              <div>
                <span className="text-muted-foreground">p99 / Max</span>
                <p className="font-medium">{db.p99Ms}ms / {db.maxMs}ms</p>
              </div>
            </div>

            {db.slowQueries.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Recent Slow Queries</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {db.slowQueries.map((sq, i) => (
                    <div key={i} className="bg-muted rounded-md p-2 text-xs">
                      <div className="flex justify-between mb-1">
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          {sq.durationMs}ms
                        </Badge>
                        <span className="text-muted-foreground">
                          {new Date(sq.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <code className="block truncate">{sq.sql}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              System Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <div>
                <span className="text-muted-foreground">Node.js</span>
                <p className="font-medium">{system.nodeVersion}</p>
              </div>
              <div>
                <span className="text-muted-foreground">PID</span>
                <p className="font-medium">{system.pid}</p>
              </div>
              <div>
                <span className="text-muted-foreground">RSS Memory</span>
                <p className="font-medium">{system.memoryMb.rss}MB</p>
              </div>
              <div>
                <span className="text-muted-foreground">Heap Used / Total</span>
                <p className="font-medium">
                  {system.memoryMb.heapUsed}MB / {system.memoryMb.heapTotal}MB
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">External</span>
                <p className="font-medium">{system.memoryMb.external}MB</p>
              </div>
              <div>
                <span className="text-muted-foreground">Started</span>
                <p className="font-medium">{new Date(uptime.startedAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Error breakdown */}
            {Object.keys(errors.byCode).length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Errors by Code</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(errors.byCode)
                    .sort(([, a], [, b]) => b - a)
                    .map(([code, count]) => (
                      <Badge key={code} variant="outline" className="text-xs">
                        {code}: {count}
                      </Badge>
                    ))}
                </div>
              </div>
            )}

            {/* Events */}
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Event Bus</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Published</span>
                  <p className="font-medium">{events.published}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Processed</span>
                  <p className="font-medium">{events.processed}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Failed</span>
                  <p className="font-medium text-red-500">{events.failed}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Routes table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">All Routes</CardTitle>
        </CardHeader>
        <CardContent>
          {http.routes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No routes tracked yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Route</th>
                    <th className="py-2 pr-4 font-medium text-right">Requests</th>
                    <th className="py-2 pr-4 font-medium text-right">Avg</th>
                    <th className="py-2 pr-4 font-medium text-right">p50</th>
                    <th className="py-2 pr-4 font-medium text-right">p95</th>
                    <th className="py-2 pr-4 font-medium text-right">p99</th>
                    <th className="py-2 font-medium text-right">Max</th>
                  </tr>
                </thead>
                <tbody>
                  {http.routes.map((r) => (
                    <tr key={r.route} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{r.route}</td>
                      <td className="py-2 pr-4 text-right">{r.total}</td>
                      <td className="py-2 pr-4 text-right">{r.avgMs}ms</td>
                      <td className="py-2 pr-4 text-right">{r.p50Ms}ms</td>
                      <td className="py-2 pr-4 text-right">{r.p95Ms}ms</td>
                      <td className="py-2 pr-4 text-right">{r.p99Ms}ms</td>
                      <td className="py-2 text-right">{r.maxMs}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
