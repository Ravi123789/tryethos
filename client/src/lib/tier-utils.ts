export interface TierInfo {
  name: string;
  color: string;
  icon: string;
  range: [number, number];
}

export function getTierInfo(score: number): TierInfo {
  if (score >= 2800) {
    return {
      name: 'Ultra Legend',
      color: '#FFD700', // Gold
      icon: '👑',
      range: [2800, Infinity]
    };
  } else if (score >= 2000) {
    return {
      name: 'Elite',
      color: '#9333EA', // Purple
      icon: '⭐',
      range: [2000, 2799]
    };
  } else if (score >= 1600) {
    return {
      name: 'Champion',
      color: '#10B981', // Emerald
      icon: '🏆',
      range: [1600, 1999]
    };
  } else if (score >= 1200) {
    return {
      name: 'Expert',
      color: '#3B82F6', // Blue
      icon: '🎯',
      range: [1200, 1599]
    };
  } else if (score >= 800) {
    return {
      name: 'Trusted',
      color: '#06B6D4', // Cyan
      icon: '✅',
      range: [800, 1199]
    };
  } else if (score >= 400) {
    return {
      name: 'Emerging',
      color: '#F59E0B', // Amber
      icon: '🌟',
      range: [400, 799]
    };
  } else {
    return {
      name: 'New',
      color: '#6B7280', // Gray
      icon: '🌱',
      range: [0, 399]
    };
  }
}