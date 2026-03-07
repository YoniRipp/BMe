/**
 * Hook for fetching health metrics (steps, heart rate, calories burned).
 */
import { useQuery } from '@tanstack/react-query';
import { healthApi, type HealthMetric } from '../core/api/health';

const HEALTH_METRICS_KEYS = {
  range: (start: string, end: string) => ['healthMetrics', start, end] as const,
};

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useHealthMetrics(options?: { startDate?: string; endDate?: string; enabled?: boolean }) {
  const today = todayString();
  const startDate = options?.startDate ?? today;
  const endDate = options?.endDate ?? today;

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: HEALTH_METRICS_KEYS.range(startDate, endDate),
    queryFn: () => healthApi.getMetrics({ startDate, endDate }),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled !== false,
  });

  const metrics = data?.data ?? [];

  const getMetricValue = (type: string): number | null => {
    const metric = metrics.find((m: HealthMetric) => m.metricType === type);
    return metric ? metric.value : null;
  };

  return {
    metrics,
    metricsLoading: isLoading,
    metricsError: error,
    steps: getMetricValue('steps'),
    heartRateAvg: getMetricValue('heart_rate_avg'),
    heartRateResting: getMetricValue('heart_rate_resting'),
    activeCalories: getMetricValue('active_calories'),
  };
}
