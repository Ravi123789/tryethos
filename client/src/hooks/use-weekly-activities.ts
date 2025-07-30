import { useQuery } from '@tanstack/react-query';

interface WeeklyActivity {
  id: string;
  type: string;
  createdAt: string;
  scoreChange?: number;
  xpGain?: number;
  description?: string;
}

interface WeeklyActivitySummary {
  streakDays: number;
  scoreChange: number;
  xpGain: number;
  totalChanges: number;
  activeDays: number;
}

interface WeeklyActivitiesResponse {
  success: boolean;
  data: {
    activities: WeeklyActivity[];
    summary: WeeklyActivitySummary | null;
  };
}

export function useWeeklyActivities(userkey: string | undefined) {
  return useQuery<WeeklyActivitiesResponse>({
    queryKey: ['weekly-activities', userkey],
    queryFn: async () => {
      if (!userkey) throw new Error('No userkey provided');
      
      const response = await fetch(`/api/weekly-activities/${encodeURIComponent(userkey)}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    },
    enabled: !!userkey,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    refetchOnWindowFocus: false,
  });
}