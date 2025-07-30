export interface EthosUser {
  id: number;
  profileId: number;
  displayName: string;
  username: string;
  avatarUrl: string;
  description: string;
  score: number;
  status: string;
  userkeys: string[];
  xpTotal: number;
  xpStreakDays: number;
  links: {
    profile: string;
    scoreBreakdown: string;
  };
  stats: {
    review: {
      received: {
        negative: number;
        neutral: number;
        positive: number;
      };
    };
    vouch: {
      given: {
        amountWeiTotal: number;
        count: number;
      };
      received: {
        amountWeiTotal: number;
        count: number;
      };
    };
  };
}

export interface TrustScore {
  score: number;
  level: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function searchUser(query: string, searchType?: string): Promise<ApiResponse<EthosUser>> {
  const response = await fetch('/api/search-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, searchType }),
  });

  return response.json();
}

export async function searchUserByFarcaster(farcasterUsername: string): Promise<ApiResponse<EthosUser>> {
  const response = await fetch('/api/search-user-farcaster', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ farcasterUsername }),
  });

  return response.json();
}

export async function getTrustScore(userkey: string): Promise<ApiResponse<TrustScore>> {
  const response = await fetch(`/api/trust-score/${encodeURIComponent(userkey)}`);
  return response.json();
}

export async function getTrustScores(userkeys: string[]): Promise<ApiResponse<Record<string, TrustScore>>> {
  const response = await fetch('/api/trust-scores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userkeys }),
  });

  return response.json();
}

export async function getScoreStatus(userkey: string): Promise<ApiResponse<{
  status: string;
  isQueued: boolean;
  isCalculating: boolean;
  isPending: boolean;
}>> {
  const response = await fetch(`/api/score-status/${encodeURIComponent(userkey)}`);
  return response.json();
}

export async function getReviewCount(author: string, subject: string): Promise<ApiResponse<number>> {
  const params = new URLSearchParams({ author, subject });
  const response = await fetch(`/api/review-count?${params}`);
  return response.json();
}

export async function generateShareContent(userkey: string, platform: 'farcaster' | 'twitter' | 'telegram' = 'farcaster'): Promise<ApiResponse<{
  content: string;
  score: number;
  level: string;
  platform: string;
}>> {
  const response = await fetch('/api/generate-share-content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userkey, platform }),
  });

  return response.json();
}

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getTrustLevelColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'highly trusted':
    case 'trusted':
      return 'text-green-600';
    case 'neutral':
      return 'text-yellow-600';
    case 'untrusted':
    case 'low trust':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

export function getTrustLevelBadgeColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'highly trusted':
    case 'trusted':
      return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    case 'neutral':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'untrusted':
    case 'low trust':
      return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  }
}
