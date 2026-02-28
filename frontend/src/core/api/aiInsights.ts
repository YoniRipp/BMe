import { request } from './client';

export interface AiInsights {
  summary: string;
  highlights: string[];
  suggestions: string[];
  score: number;
}

export interface TodayRecommendations {
  workout: string;
  budget: string;
  nutrition: string;
  focus: string;
}

export interface DailyStat {
  date: string;
  total_calories: string;
  total_income: string;
  total_expenses: string;
  workout_count: number;
  sleep_hours: string | null;
}

export interface SearchResult {
  recordType: string;
  recordId: string;
  contentText: string;
  similarity: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
}

export const aiInsightsApi = {
  getInsights: (): Promise<AiInsights> =>
    request('/api/insights'),

  getTodayRecommendations: (): Promise<TodayRecommendations> =>
    request('/api/insights/today'),

  getStats: (days = 30): Promise<{ days: number; stats: DailyStat[] }> =>
    request(`/api/insights/stats?days=${days}`),

  search: (q: string, types?: string[]): Promise<SearchResponse> =>
    request('/api/search', {
      method: 'POST',
      body: { q, types: types ?? [], limit: 10 },
    }),
};
