import { useQuery } from "@tanstack/react-query";

export interface DashboardReviewsData {
  totalReviews: number;
  positiveReviews: number;
  neutralReviews: number;
  negativeReviews: number;
  positivePercentage: number;
}

export function useDashboardReviews(userkey: string | undefined) {
  return useQuery({
    queryKey: ['/api/dashboard-reviews', userkey],
    enabled: !!userkey,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}