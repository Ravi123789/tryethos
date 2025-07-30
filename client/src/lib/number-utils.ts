/**
 * Format large numbers with K, M, B abbreviations
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

/**
 * Format XP values with appropriate suffixes
 */
export function formatXP(xp: number): string {
  return formatNumber(xp) + ' XP';
}

/**
 * Format currency values with $ prefix
 */
export function formatCurrency(amount: number): string {
  return '$' + formatNumber(amount);
}

/**
 * Format ETH amounts with appropriate precision
 */
export function formatETH(eth: number): string {
  if (eth >= 1) {
    return eth.toFixed(2) + ' ETH';
  }
  if (eth >= 0.001) {
    return eth.toFixed(3) + ' ETH';
  }
  if (eth >= 0.000001) {
    return (eth * 1000).toFixed(1) + 'K wei';
  }
  return eth.toExponential(2) + ' ETH';
}

/**
 * Format weekly gains with + prefix and appropriate formatting
 */
export function formatWeeklyGain(gain: number): string {
  return '+' + formatNumber(gain);
}

/**
 * Format time gaps with appropriate units (minutes, hours, days)
 */
export function formatTimeGap(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 1440)}d`;
}