import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, ExternalLink, Shield, TrendingUp, Award } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
// ScorePulse moved to search results only
import { useUserProfile, useTrustScore, useUserStats, useEnhancedProfile } from "@/hooks/use-ethos-api";
import { getTrustLevelBadgeColor } from "@/lib/ethos-client";
import { formatNumber, formatWeeklyGain } from "@/lib/number-utils";

export function TrustScoreDisplay() {
  const { user } = useUserProfile();
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get real-time trust score and user statistics
  const { data: scoreData } = useTrustScore(
    user?.userkeys?.[0] || '', 
    !!user
  );
  
  const { data: statsData } = useUserStats(user?.userkeys?.[0]);
  const { data: enhancedData } = useEnhancedProfile(user?.userkeys?.[0]);

  const score = (scoreData as any)?.success ? (scoreData as any).data?.score || user?.score || 0 : user?.score || 0;
  const level = (scoreData as any)?.success ? (scoreData as any).data?.level || 'Unknown' : 'Unknown';
  
  // Use real stats if available, otherwise fallback to user stats
  const realStats = (statsData as any)?.success ? (statsData as any).data : user?.stats;
  
  // Use enhanced profile for XP and social data
  const enhancedProfile = (enhancedData as any)?.success ? (enhancedData as any).data : null;
  
  // FAST STATUS DETECTION - Use immediate API response
  
  // Get real XP metrics from enhanced profile or fallback to user data
  const xpTotal = enhancedProfile?.xpTotal || user?.xpTotal || 0;
  const xpStreakDays = enhancedProfile?.xpStreakDays || user?.xpStreakDays || 0;
  const leaderboardPosition = enhancedProfile?.leaderboardPosition || (user as any)?.leaderboardPosition;
  const weeklyXpGain = enhancedProfile?.weeklyXpGain || null;
  
  // Check if enhanced profile has loaded successfully
  const hasEnhancedData = !!(enhancedData as any)?.success;
  
  // STATUS SYSTEM - Based on API Response
  function getStatusInfo() {
    if (!user) return { status: 'unknown', color: '#6b7280', text: 'Unknown' };
    
    // Use enhanced profile data for most accurate status
    const enhancedProfile = (enhancedData as any)?.success ? (enhancedData as any).data : null;
    const actualStatus = enhancedProfile?.status || user.status;
    const actualProfileId = enhancedProfile?.profileId ?? user.profileId;
    
    // Simple status logic based on API data - treat profileId 0 or null as no profile
    const hasNoProfile = !actualProfileId || actualProfileId === 0;
    
    if (hasNoProfile && actualStatus === 'INACTIVE') {
      return { status: 'needs_invite', color: '#ef4444', text: 'Needs Invite' };
    }
    if (hasNoProfile && (actualStatus === null || actualStatus === 'UNINITIALIZED')) {
      return { status: 'needs_invite', color: '#ef4444', text: 'Needs Invite' };
    }
    if (actualStatus === 'ACTIVE') {
      return { status: 'active', color: '#10b981', text: 'Active' };
    }
    if (actualStatus === 'INACTIVE') {
      return { status: 'inactive', color: '#eab308', text: 'Inactive' };
    }
    if (actualStatus === 'UNINITIALIZED') {
      return { status: 'uninitialized', color: '#9333ea', text: 'Uninitialized' };
    }
    
    return { status: 'unknown', color: '#6b7280', text: 'Unknown' };
  }
  
  const statusInfo = getStatusInfo();
  
  // Force re-render when enhanced profile status changes
  useEffect(() => {
    // Status is now loaded immediately from V2 API response - no logging needed
  }, [enhancedProfile?.status]);
  // STATUS COLORS - Based on status response
  const statusColors: { [key: string]: { ring: string; bg: string; text: string } } = {
    active: { ring: '#10b981', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
    inactive: { ring: '#eab308', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300' },
    needs_invite: { ring: '#ef4444', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
    uninitialized: { ring: '#9333ea', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
    unknown: { ring: '#6b7280', bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-300' }
  };

  // Smooth score animation with loading effect
  useEffect(() => {
    if (score > 0) {
      setIsLoading(true);
      const duration = 1500; // Moderate animation duration
      const startTime = Date.now();
      const startScore = 0;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth ease-out animation
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setAnimatedScore(Math.round(startScore + (score - startScore) * easeOut));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsLoading(false);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [score]);

  if (!user) return null;

  const totalReviews = realStats?.review?.received?.positive + 
                      realStats?.review?.received?.neutral + 
                      realStats?.review?.received?.negative || 0;

  return (
    <div className="glass-profile-section animate-slide-up" style={{ animationDelay: '0.1s' }}>
      {/* Glass Trust Score Card */}
      <div className="liquid-glass relative">
        {/* Floating orbs for trust score display */}
        <div className="absolute top-4 right-5 w-5 h-5 bg-gradient-to-r from-orange-400/30 to-red-400/20 rounded-full floating-orb floating-orb-1"></div>
        <div className="absolute bottom-5 left-4 w-6 h-6 bg-gradient-to-r from-cyan-400/25 to-sky-400/15 rounded-full floating-orb floating-orb-2"></div>
        <div className="absolute top-1/2 left-2 w-3 h-3 bg-gradient-to-r from-lime-400/30 to-green-400/20 rounded-full floating-orb floating-orb-3"></div>
        
        <div className="relative z-10">
          {/* Glass Profile Header */}
          <div className="glass-profile-header">
            <div className="glass-avatar-container">
              {/* STATUS RING - Based on API Response */}
              <div className="glass-status-ring" 
                   style={{ 
                     background: `linear-gradient(45deg, ${statusColors[statusInfo.status]?.ring || statusColors.unknown.ring}, ${statusColors[statusInfo.status]?.ring || statusColors.unknown.ring}80)`
                   }}></div>
              <img 
                src={user.avatarUrl || '/placeholder-avatar.png'} 
                alt={user.displayName}
                className="glass-profile-avatar"
              />
              {/* STATUS BADGE - Based on API Response */}
              <div className="glass-status-badge">
                {statusInfo.status === 'active' ? '🔥' : 
                 statusInfo.status === 'inactive' ? '💤' : 
                 statusInfo.status === 'needs_invite' ? '🛸' : 
                 statusInfo.status === 'uninitialized' ? '⚙️' : '❓'}
              </div>
            </div>
            
            <div className="flex-1">
              <h2 className="glass-profile-name">
                {user.displayName}
              </h2>
              <div className="glass-profile-details">
                <span className="glass-username">
                  @{user.username || 'username'}
                </span>
                {(user as any).primaryName && (
                  <div className="glass-primary-badge">
                    {(user as any).primaryName}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Glass Score Display Section */}
          <div className="glass-score-section">
            <div className="glass-score-details">
              <h4 className="glass-score-label">Trust Score</h4>
              <div className="glass-score-content">
                <span className="glass-score-number">
                  {animatedScore}
                </span>
                {/* STATUS SYSTEM - Based on API Response */}
                <div className="glass-status-indicator">
                  ● {statusInfo.text}
                </div>
              </div>
            </div>
            
            {/* Animated Progress Ring */}
            <div className="relative">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                {/* Background Circle */}
                <circle
                  cx="40"
                  cy="40"
                  r="30"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  className="text-gray-200 dark:text-gray-700"
                />
                {/* Progress Circle */}
                <circle
                  cx="40"
                  cy="40"
                  r="30"
                  stroke={statusColors[statusInfo.status]?.ring || statusColors.unknown.ring}
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 30}
                  strokeDashoffset={2 * Math.PI * 30 - (Math.min(animatedScore, 3000) / 3000) * (2 * Math.PI * 30)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  style={{
                    filter: `drop-shadow(0 0 8px ${statusColors[statusInfo.status]?.ring || statusColors.unknown.ring}40)`
                  }}
                />
              </svg>
              {/* Center Percentage */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-muted-foreground">
                  {Math.round((Math.min(animatedScore, 3000) / 3000) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Metrics Row */}
          {realStats && (
            <div className="flex justify-between items-center mb-4 p-3" style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'var(--glass-blur)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px'
            }}>
              <div className="flex flex-col items-center space-y-1 flex-1">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-medium text-muted-foreground">RANK</span>
                </div>
                {!enhancedProfile && !leaderboardPosition ? (
                  <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-5 w-12 rounded"></div>
                ) : (
                  <span className="text-lg font-bold text-foreground">#{leaderboardPosition || 'N/A'}</span>
                )}
              </div>
              
              <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
              
              <div className="flex flex-col items-center space-y-1 flex-1">
                <div className="flex items-center space-x-1">
                  <Award className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-medium text-muted-foreground">XP</span>
                </div>
                {!enhancedProfile && !xpTotal ? (
                  <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-5 w-16 rounded"></div>
                ) : (
                  <span className="text-lg font-bold text-foreground">{formatNumber(xpTotal)}</span>
                )}
                {weeklyXpGain && weeklyXpGain > 0 && (
                  <span className="text-xs font-medium text-green-500 animate-pulse">
                    {formatWeeklyGain(weeklyXpGain)} XP
                  </span>
                )}
              </div>
              
              <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
              
              <div className="flex flex-col items-center space-y-1 flex-1">
                <div className="flex items-center space-x-1">
                  <span className="text-sm">🔥</span>
                  <span className="text-xs font-medium text-muted-foreground">STREAK</span>
                </div>
                {!enhancedProfile && !xpStreakDays ? (
                  <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-5 w-8 rounded"></div>
                ) : (
                  <span className="text-lg font-bold text-foreground">{xpStreakDays}d</span>
                )}
              </div>
            </div>
          )}
          


          {user.description && (
            <div className="mt-4 p-3 bg-white/60 dark:bg-gray-800/40 rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {user.description}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Score Pulse removed - now only in search results */}
    </div>
  );
}