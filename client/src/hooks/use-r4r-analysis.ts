import { useQuery } from "@tanstack/react-query";

export interface ReviewPair {
  user1: {
    userkey: string;
    displayName: string;
    username: string;
    avatarUrl: string;
    score: number;
  };
  user2: {
    userkey: string;
    displayName: string;
    username: string;
    avatarUrl: string;
    score: number;
  };
  review1: {
    id: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    comment: string;
    timestamp: string;
    timeGap?: number;
  };
  review2: {
    id: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    comment: string;
    timestamp: string;
  };
  isReciprocal: boolean;
  isQuickReciprocal: boolean;
  suspiciousScore: number;
}

export interface R4RAnalysis {
  userkey: string;
  displayName: string;
  totalReviewsReceived: number;
  totalReviewsGiven: number;
  reciprocalReviews: number;
  reciprocalPercentage: number;
  quickReciprocalCount: number;
  quickReciprocalPercentage: number;
  r4rScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  reviewPairs: ReviewPair[];
  networkConnections: Array<{
    userkey: string;
    displayName: string;
    interactionCount: number;
    reciprocalCount: number;
    avgTimeGap: number;
    suspiciousScore: number;
  }>;
  firstReviewDate: string;
  lastReviewDate: string;
  reviewFrequency: number;
  avgTimeBetweenReviews: number;
  patternAnalysis: {
    hasTimePatterns: boolean;
    hasContentPatterns: boolean;
    hasSuspiciousGroups: boolean;
    suspiciousGroups?: Array<{
      users: string[];
      interactionCount: number;
      avgTimeGap: number;
    }>;
  };
  highR4RReviewers?: Array<{
    userkey: string;
    displayName: string;
    username: string;
    avatarUrl: string;
    r4rScore: number;
    riskLevel: string;
  }>;
  scoreBreakdown?: {
    uncappedBaseScore: number;
    cappedBaseScore: number;
    baseScoreDescription: string;
    volumeMultiplier: number;
    volumeDescription: string;
    accountAgeMultiplier: number;
    accountAgeDescription: string;
    timePenalty: number;
    timePenaltyDescription: string;
    calculationFlow: string;
    finalCalculation: string;
  };
}

// Fast summary hook for dashboard use
export function useR4RSummary(userkey: string | undefined) {
  return useQuery({
    queryKey: ["/api/r4r-summary", userkey],
    queryFn: async () => {
      if (!userkey) return null;
      
      const response = await fetch(`/api/r4r-summary/${encodeURIComponent(userkey)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch R4R summary');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'R4R summary failed');
      }
      
      return result.data;
    },
    enabled: !!userkey,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false,
  });
}

export function useR4RAnalysis(userkey: string | undefined) {
  return useQuery({
    queryKey: ["/api/r4r-analysis", userkey],
    queryFn: async () => {
      if (!userkey) return null;
      
      const response = await fetch(`/api/r4r-analysis/${encodeURIComponent(userkey)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch R4R analysis');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'R4R analysis failed');
      }
      
      return result.data as R4RAnalysis;
    },
    enabled: !!userkey,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false, // Don't auto-refetch since analysis is computationally expensive
  });
}

export function useR4RNetworkAnalysis(userkeys: string[]) {
  return useQuery({
    queryKey: ["/api/r4r-network-analysis", userkeys],
    queryFn: async () => {
      if (userkeys.length === 0) return null;
      
      const response = await fetch(`/api/r4r-network-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userkeys }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch R4R network analysis');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'R4R network analysis failed');
      }
      
      return result.data;
    },
    enabled: userkeys.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: false, // Don't auto-refetch since analysis is very computationally expensive
  });
}