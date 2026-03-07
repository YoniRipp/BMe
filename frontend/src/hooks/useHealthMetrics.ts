/**
 * Hook for fetching health metrics (steps, heart rate, calories burned).
 */
import { useQuery } from '@tanstack/react-query';
import { healthApi, type HealthMetric } from '@/core/api/health';
import { toLocalDateString } from '@/lib/dateRanges';

const HEALTH_METRICS_KEYS = {
  today: ['healthMetrics', 'today'] as const,
  range: (start: string, end: string) => ['healthMetrics', start, end] as const,
};

export function useHealthMetrics(options?: { startDate?: string; endDate?: string; enabled?: boolean }) {
  const today = toLocalDateString(new Date());
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
