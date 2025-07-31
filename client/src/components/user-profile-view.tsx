import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Share2, Crown, Award, Zap, Shield, AlertTriangle, TrendingUp, Users, MessageSquare, Star, Calendar, Activity, BarChart3, Network, Clock, ArrowDownLeft, ArrowUpRight, ArrowUp, ArrowDown, X } from "lucide-react";
import { SiX, SiDiscord, SiFarcaster, SiTelegram } from "react-icons/si";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useTrustScore, useUserStats, useEnhancedProfile, useVouchActivities } from "@/hooks/use-ethos-api";
import { useR4RAnalysis } from "@/hooks/use-r4r-analysis";
import { useDashboardReviews } from "@/hooks/use-dashboard-reviews";
import { useAttestations, type SocialAttestation } from "@/hooks/use-attestations";
import { useWeeklyActivities } from "@/hooks/use-weekly-activities";
import { R4RDataSection } from "./r4r-data-section";
import { NextRankProgress } from "./next-rank-progress";


import { FarcasterShareButton } from "./farcaster-share-button";
import { formatNumber, formatXP, formatWeeklyGain, formatCurrency } from "@/lib/number-utils";
// Theme provider removed - dark mode only


interface UserProfileViewProps {
  user: any;
  onBackToSearch: () => void;
  onUserSearch?: (userData: any) => void;
  searchMode?: 'global' | 'farcaster';
}

// Official Ethos Protocol tier system (0-2800 range)
const getTierInfo = (score: number) => {
  if (score >= 2000) return { 
    icon: Crown, 
    tier: 'Exemplary',
    shortTier: 'EXC',
    colors: {
      bg: 'from-purple-500/20 to-violet-500/20',
      border: 'border-purple-400/30',
      text: 'text-purple-300',
      glow: 'shadow-purple-500/20'
    }
  };
  if (score >= 1600) return { 
    icon: Award, 
    tier: 'Reputable',
    shortTier: 'REP',
    colors: {
      bg: 'from-emerald-500/20 to-teal-500/20',
      border: 'border-emerald-400/30',
      text: 'text-emerald-300',
      glow: 'shadow-emerald-500/20'
    }
  };
  if (score >= 1200) return { 
    icon: Zap, 
    tier: 'Neutral',
    shortTier: 'NEU',
    colors: {
      bg: 'from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-400/30',
      text: 'text-blue-300',
      glow: 'shadow-blue-500/20'
    }
  };
  if (score >= 800) return { 
    icon: AlertTriangle, 
    tier: 'Questionable',
    shortTier: 'QUE',
    colors: {
      bg: 'from-amber-500/20 to-orange-500/20',
      border: 'border-amber-400/30',
      text: 'text-amber-300',
      glow: 'shadow-amber-500/20'
    }
  };
  return { 
    icon: Shield, 
    tier: 'Untrusted',
    shortTier: 'UNT',
    colors: {
      bg: 'from-gray-500/20 to-slate-500/20',
      border: 'border-gray-400/30',
      text: 'text-gray-400',
      glow: 'shadow-gray-500/20'
    }
  };
};

// Platform info functionality removed as requested by user

export function UserProfileView({ user, onBackToSearch, onUserSearch, searchMode = 'global' }: UserProfileViewProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [activeView, setActiveView] = useState<'overview' | 'activity' | 'network'>('overview');
  const [showVouchModal, setShowVouchModal] = useState<{ type: 'received' | 'given' | null }>({ type: null });
  
  // Dark mode only - no theme toggle needed
  
  // Get real-time data
  const { data: scoreData } = useTrustScore(user?.userkeys?.[0] || '', !!user);
  const { data: statsData } = useUserStats(user?.userkeys?.[0]);
  const { data: enhancedData, isLoading: isEnhancedQueryLoading } = useEnhancedProfile(user?.userkeys?.[0]);
  const { data: attestationsData } = useAttestations(user?.userkeys?.[0] || '');
  const { data: vouchData } = useVouchActivities(user?.userkeys?.[0] || '');
  // Dashboard reviews using proper Ethos API v2 Activities
  const { data: dashboardReviewsData, isLoading: isDashboardReviewsLoading } = useDashboardReviews(user?.userkeys?.[0]);
  // R4R analysis only for detailed popup
  const { data: r4rData } = useR4RAnalysis(user?.userkeys?.[0]);
  // Weekly activities with score changes
  const { data: weeklyActivitiesData, isLoading: isWeeklyActivitiesLoading } = useWeeklyActivities(user?.userkeys?.[0]);

  const score = (scoreData as any)?.success ? (scoreData as any).data?.score || user?.score || 0 : user?.score || 0;
  const realStats = (statsData as any)?.success ? (statsData as any).data : user?.stats;
  const enhancedProfile = (enhancedData as any)?.success ? (enhancedData as any).data : null;
  const socialConnections = (attestationsData as any)?.success ? (attestationsData as any).data : null;
  
  // Loading states for different data types
  const isStatsLoading = !statsData;
  const isEnhancedLoading = isEnhancedQueryLoading;
  const isAttestationsLoading = !attestationsData;
  
  const tierInfo = getTierInfo(score);
  const IconComponent = tierInfo.icon;
  
  // Platform info removed as requested
  
  // Check if user is not on Ethos Protocol
  const isNotOnEthos = enhancedData && !(enhancedData as any)?.success;
  
  // XP and ranking data - use enhanced profile data as primary source, strict null checking
  const xpTotal = enhancedProfile?.xpTotal || 0;
  const xpStreakDays = enhancedProfile?.xpStreakDays || null; // Strict null - only show if enhanced profile has data
  const leaderboardPosition = enhancedProfile?.leaderboardPosition ?? null;
  const weeklyXpGain = enhancedProfile?.weeklyXpGain || 0;

  // Status-based ring colors for profile avatar (dark mode only)
  const getStatusRingColor = (status: string, profileId: any) => {
    // Users without profileId (including profileId 0) and null/INACTIVE status need red rings  
    const hasNoProfile = !profileId || profileId === 0;
    if (hasNoProfile && (status === null || status === 'INACTIVE' || status === 'UNINITIALIZED')) {
      return 'ring-2 ring-red-400/60 shadow-lg shadow-red-400/20';
    }
    
    switch (status) {
      case 'ACTIVE':
        return 'ring-2 ring-emerald-400/60 shadow-lg shadow-emerald-400/20';
      case 'INACTIVE':
        return 'ring-2 ring-yellow-400/60 shadow-lg shadow-yellow-400/20';
      case 'UNINITIALIZED':
        return 'ring-2 ring-red-400/60 shadow-lg shadow-red-400/20';
      default:
        return 'ring-2 ring-gray-500/40 shadow-lg shadow-gray-500/20';
    }
  };
  
  // Simple state for score animation
  const [showRankPopup, setShowRankPopup] = useState(false);

  // Stats - vouches from stats API, reviews only from R4R analysis
  const vouchesReceived = realStats?.vouch?.received?.count || 0;
  const vouchesGiven = realStats?.vouch?.given?.count || 0;
  
  // Dashboard reviews - use proper Ethos API v2 Activities data
  const dashboardReviews = (dashboardReviewsData as any)?.success ? (dashboardReviewsData as any).data : null;
  const totalReviews = dashboardReviews?.totalReviews || 0;
  const positivePercentage = dashboardReviews?.positivePercentage || 0;

  // Simple score animation on load
  useEffect(() => {
    if (score > 0 && animatedScore === 0) {
      const duration = 1000;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setAnimatedScore(Math.round(score * easeOut));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    } else if (score > 0 && animatedScore !== score) {
      setAnimatedScore(score);
    }
  }, [score]);

  const handleViewOnEthos = () => {
    if (user?.userkeys?.[0]) {
      // Use the displayName or username to construct the Ethos profile URL
      const username = user.displayName?.toLowerCase().replace(/\s+/g, '') || user.username || 'user';
      const profileUrl = `https://app.ethos.network/profile/x/${username}`;
      window.open(profileUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced ambient background - hidden in dark mode for clean appearance */}
      <div className="absolute inset-0 pointer-events-none dark:hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/15 to-cyan-400/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute top-60 right-16 w-28 h-28 bg-gradient-to-br from-purple-400/15 to-pink-400/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-20 w-36 h-36 bg-gradient-to-br from-emerald-400/12 to-teal-400/8 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>

      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6">
        {/* Header with Back button */}
        <div className="mb-6 flex items-center justify-between">
          {/* Left side - Back button */}
          <button
            onClick={onBackToSearch}
            className="clay-button flex items-center gap-2 px-4 py-3 text-sm group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Search</span>
          </button>
          
          {/* Right side - Farcaster indicator */}
          <div className="flex items-center gap-3">
            {/* Search via Farcaster indicator - only show if search mode is farcaster */}
            {searchMode === 'farcaster' && (
              <div className="clay-card-inset flex items-center gap-2 px-4 py-2 border-[#8a63d2]/30 text-[#8a63d2] text-xs font-medium">
                <SiFarcaster className="w-3 h-3" />
                <span>Search via Farcaster</span>
                {/* Show FID if available */}
                {user.fid && (
                  <>
                    <span className="text-[#8a63d2]/60">•</span>
                    <span className="text-[#8a63d2]/80">FID {user.fid}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Clay Profile Card */}
        <div className="clay-card overflow-hidden">
          <div className="relative p-6">
            {/* Header Section - More compact */}
            <div className="flex items-center gap-4 mb-6">
              {/* Avatar with status-colored ring and tier badge */}
              <div className="relative flex-shrink-0">
                <Avatar className={`h-16 w-16 ring-offset-2 ring-offset-transparent ${getStatusRingColor(enhancedProfile?.status || user?.status || 'UNKNOWN', enhancedProfile?.profileId ?? user?.profileId)}`}>
                  <AvatarImage 
                    src={user.avatarUrl && !user.avatarUrl.includes('default_profile') ? user.avatarUrl : undefined} 
                    alt={user.displayName}
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-white/20 to-white/10 text-white text-lg font-bold">
                    {user.displayName?.charAt(0) || user.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                {/* Simple tier badge */}
                <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br ${tierInfo.colors.bg} border-2 ${tierInfo.colors.border} flex items-center justify-center shadow-lg`}>
                  <IconComponent className={`h-4 w-4 ${tierInfo.colors.text}`} />
                </div>
              </div>

              {/* User Info - More compact */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-2xl font-bold text-white truncate">
                        {user.displayName}
                      </h1>
                      {/* Enhanced Flex Button Positioning */}
                      <div className="flex-shrink-0">
                        <FarcasterShareButton 
                          user={user}
                          compact={true}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white/60 text-sm">@{user.username}</p>
                      
                      {/* Joined Date - from Twitter attestation */}
                      {(() => {
                        const attestationData = attestationsData as any;
                        if (!attestationData?.success || !attestationData.data) {
                          return null;
                        }
                        
                        const twitterAttestation = attestationData.data.find((att: any) => att.service === 'x.com');
                        
                        if (twitterAttestation?.createdAt) {
                          const joinedDate = new Date(twitterAttestation.createdAt * 1000);
                          const now = new Date();
                          const daysDiff = Math.floor((now.getTime() - joinedDate.getTime()) / (1000 * 60 * 60 * 24));
                          
                          return (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/20 border border-blue-400/30 text-xs text-blue-200 font-medium">
                              <Calendar className="w-3 h-3" />
                              <span>Joined {daysDiff} days ago</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      {/* STATUS SYSTEM - Based on Enhanced Profile API Response */}
                  {(() => {
                    // Show loading state while enhanced profile data loads
                    if (isEnhancedLoading) {
                      return (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 border border-white/20 loading-glow">
                          <div className="w-3 h-3 rounded-full loading-shimmer loading-pulse-soft"></div>
                          <div className="loading-shimmer loading-pulse-soft h-3 w-12 rounded"></div>
                        </div>
                      );
                    }

                    // Use enhanced profile data as authoritative source - strict checking
                    const enhancedProfile = (enhancedData as any)?.success ? (enhancedData as any).data : null;
                    
                    // If enhanced profile API returns null data, user doesn't have enhanced profile (like dwr.eth, $1profit.eth)
                    if (!enhancedProfile) {
                      return (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/20 border border-red-400/30">
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                          <span className="text-xs font-medium text-red-300">Needs Invite</span>
                        </div>
                      );
                    }
                    
                    const actualStatus = enhancedProfile.status;
                    const actualProfileId = enhancedProfile.profileId;
                    
                    // Special case: If enhanced profile API failed completely, user is not on Ethos Protocol
                    const enhancedApiFailed = enhancedData && !(enhancedData as any)?.success;
                    if (enhancedApiFailed) {
                      return (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/20 border border-red-400/30">
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                          <span className="text-xs font-medium text-red-300">Not on Ethos</span>
                        </div>
                      );
                    }
                    
                    // Simple status logic based on API data - treat profileId 0 or null as no profile
                    const hasNoProfile = !actualProfileId || actualProfileId === 0;
                    
                    if (hasNoProfile && actualStatus === 'INACTIVE') {
                      return (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/20 border border-red-400/30">
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                          <span className="text-xs font-medium text-red-300">Needs Invite</span>
                        </div>
                      );
                    }
                    if (hasNoProfile && (actualStatus === null || actualStatus === 'UNINITIALIZED')) {
                      return (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/20 border border-red-400/30">
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                          <span className="text-xs font-medium text-red-300">Needs Invite</span>
                        </div>
                      );
                    }
                    if (actualStatus === 'ACTIVE') {
                      return (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/20 border border-green-400/30">
                          <Shield className="w-3 h-3 text-green-400" />
                          <span className="text-xs font-medium text-green-300">Active</span>
                        </div>
                      );
                    }
                    if (actualStatus === 'INACTIVE') {
                      return (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-yellow-500/20 border border-yellow-400/30">
                          <AlertTriangle className="w-3 h-3 text-yellow-400" />
                          <span className="text-xs font-medium text-yellow-300">Inactive</span>
                        </div>
                      );
                    }
                    if (actualStatus === 'UNINITIALIZED') {
                      return (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-purple-500/20 border border-purple-400/30">
                          <Clock className="w-3 h-3 text-purple-400" />
                          <span className="text-xs font-medium text-purple-300">Uninitialized</span>
                        </div>
                      );
                    }
                    // Default fallback
                    return (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-500/20 border border-gray-400/30">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs font-medium text-gray-300">Unknown</span>
                      </div>
                    );
                      })()}
                    </div>
                  </div>
                  

                </div>
              </div>
            </div>

            {/* Trust Score or Not On Ethos Message */}
            {isNotOnEthos ? (
              <div className="text-center mb-8">
                <div className="relative backdrop-blur-xl bg-gradient-to-br from-red-500/20 via-red-400/15 to-red-600/10 border border-red-400/30 rounded-2xl p-8 shadow-2xl">
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-400/40">
                      <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Profile Not Found</h3>
                      <p className="text-red-200/80 text-sm leading-relaxed">
                        This user is not currently on the Ethos Protocol network.
                        <br />
                        They may need an invitation to join the platform.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center mb-8">
                <div className="relative inline-block group">
                  {/* Enhanced Score Card with Better Visual Hierarchy */}
                  <div className={`relative backdrop-blur-2xl bg-gradient-to-br ${tierInfo.colors.bg} border-2 border-white/30 rounded-3xl p-8 mb-4 ${tierInfo.colors.glow} shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl group-hover:border-white/40`}>
                    {/* Floating accent orbs */}
                    <div className="absolute top-4 right-6 w-3 h-3 bg-gradient-to-r from-white/30 to-white/20 rounded-full animate-pulse"></div>
                    <div className="absolute bottom-6 left-8 w-2 h-2 bg-gradient-to-r from-white/25 to-white/15 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                    
                    {/* Enhanced gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-white/5 via-transparent to-white/10 rounded-3xl pointer-events-none"></div>
                    
                    <div className="relative">
                      <div className={`text-6xl font-black bg-gradient-to-br ${tierInfo.colors.text === 'text-blue-300' ? 'from-blue-200 to-cyan-300' : tierInfo.colors.text === 'text-emerald-300' ? 'from-emerald-200 to-teal-300' : tierInfo.colors.text === 'text-purple-300' ? 'from-purple-200 to-violet-300' : tierInfo.colors.text === 'text-amber-300' ? 'from-amber-200 to-orange-300' : 'from-gray-200 to-slate-300'} bg-clip-text text-transparent drop-shadow-2xl`}>
                        {animatedScore}
                      </div>
                      <div className="text-sm font-bold text-white/90 uppercase tracking-[0.2em] mt-2 drop-shadow-lg">
                        Trust Score
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Tier Badge */}
                  <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r ${tierInfo.colors.bg} border-2 ${tierInfo.colors.border} text-white font-bold text-base ${tierInfo.colors.glow} shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl`}>
                    <IconComponent className="w-5 h-5" />
                    <span className="uppercase tracking-wider">{tierInfo.tier}</span>
                  </div>
                </div>
              </div>
            )}








                
                {/* Dynamic Content Based on Active View */}
                {activeView === 'overview' && (
                  <>
                    {(() => {
                  // Determine if user needs invite (same logic as status display)
                  const enhancedProfile = (enhancedData as any)?.success ? (enhancedData as any).data : null;
                  const actualStatus = enhancedProfile?.status || user.status;
                  const actualProfileId = enhancedProfile?.profileId ?? user.profileId;
                  const hasNoProfile = !actualProfileId || actualProfileId === 0;
                  const needsInvite = hasNoProfile && (actualStatus === 'INACTIVE' || actualStatus === null || actualStatus === 'UNINITIALIZED');

                  return (
                    <>
                      {/* Stats Grid - Compact 2x2 Layout */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {/* Enhanced Rank Card - Only show for active/established users */}
                        {!needsInvite && (
                          <div className="backdrop-blur-xl bg-gradient-to-br from-orange-500/15 to-yellow-500/10 border border-orange-400/20 rounded-2xl p-5 hover:bg-gradient-to-br hover:from-orange-500/20 hover:to-yellow-500/15 hover:border-orange-400/30 transition-all duration-500 shadow-xl shadow-orange-400/20 hover:shadow-orange-400/30 group">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-orange-500/20 rounded-xl">
                                <TrendingUp className="w-5 h-5 text-orange-400" />
                              </div>
                              <span className="text-sm text-white/80 font-semibold uppercase tracking-wide">Global Rank</span>
                            </div>
                            <div className="text-3xl font-black text-white group-hover:scale-105 transition-transform duration-300">
                              {isEnhancedLoading ? (
                                <div className="loading-shimmer loading-pulse-soft h-8 w-20 rounded-lg loading-glow bg-gradient-to-r from-orange-300/20 to-yellow-300/20"></div>
                              ) : (
                                `#${leaderboardPosition || 'N/A'}`
                              )}
                            </div>
                          </div>
                        )}

                        {/* For users who need invite, show invitation prompt instead of rank */}
                        {needsInvite && (
                          <div className="backdrop-blur-md bg-red-500/10 rounded-xl p-4 hover:bg-red-500/15 transition-all duration-300 shadow-lg shadow-red-400/20 hover:shadow-red-400/30">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-4 h-4 text-red-400" />
                              <span className="text-xs text-red-300 font-medium uppercase tracking-wide">Status</span>
                            </div>
                            <div className="text-sm font-bold text-red-300">
                              Needs Invitation
                            </div>
                          </div>
                        )}

                  {/* XP */}
                  <div className="backdrop-blur-md bg-gray-900/15 rounded-xl p-4 hover:bg-gray-900/20 transition-all duration-300 shadow-lg shadow-yellow-400/20 hover:shadow-yellow-400/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs text-white/60 font-medium uppercase tracking-wide">XP</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {isEnhancedLoading ? (
                        <div className="loading-shimmer loading-pulse-soft h-7 w-24 rounded loading-glow"></div>
                      ) : (
                        formatNumber(xpTotal)
                      )}
                    </div>
                  </div>

                  {/* Vouches with USD Amount */}
                  <div className="backdrop-blur-md bg-gray-900/15 rounded-xl p-4 hover:bg-gray-900/20 transition-all duration-300 shadow-lg shadow-emerald-400/20 hover:shadow-emerald-400/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-white/60 font-medium uppercase tracking-wide">Vouches</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {isStatsLoading ? (
                        <div className="loading-shimmer loading-pulse-soft h-7 w-10 rounded loading-glow"></div>
                      ) : (
                        vouchesReceived
                      )}
                    </div>
                    <div className="text-xs text-white/50">
                      {isStatsLoading ? (
                        <div className="loading-shimmer loading-pulse-soft h-3 w-12 rounded loading-glow"></div>
                      ) : (
                        <>
                          received • {(() => {
                            const receivedVouchAmount = parseFloat(realStats?.vouch?.received?.amountWeiTotal || '0') / 1e18;
                            const usdAmount = receivedVouchAmount * 3870; // ETH price approximation
                            return usdAmount > 0 ? `$${usdAmount.toFixed(0)}` : '$0';
                          })()}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Reviews with Loading Animation */}
                  <div className="backdrop-blur-md bg-gray-900/15 rounded-xl p-4 hover:bg-gray-900/20 transition-all duration-300 shadow-lg shadow-blue-400/20 hover:shadow-blue-400/30">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-white/60 font-medium uppercase tracking-wide">Reviews</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {isDashboardReviewsLoading ? (
                        <div className="loading-shimmer loading-pulse-soft h-7 w-10 rounded loading-glow"></div>
                      ) : (
                        totalReviews
                      )}
                    </div>
                    <div className="text-xs text-white/50">
                      {isDashboardReviewsLoading ? (
                        <div className="loading-shimmer loading-pulse-soft h-3 w-16 rounded loading-glow"></div>
                      ) : (
                        `total • ${positivePercentage}% positive`
                      )}
                    </div>
                  </div>
                </div>
                    </>
                  );
                })()}

                {/* Enhanced Weekly Activity Section with Score Changes - Only for established users */}
                {(() => {
                  // Check if user needs invite (same logic as above)
                  const enhancedProfile = (enhancedData as any)?.success ? (enhancedData as any).data : null;
                  const actualStatus = enhancedProfile?.status || user.status;
                  const actualProfileId = enhancedProfile?.profileId ?? user.profileId;
                  const hasNoProfile = !actualProfileId || actualProfileId === 0;
                  const needsInvite = hasNoProfile && (actualStatus === 'INACTIVE' || actualStatus === null || actualStatus === 'UNINITIALIZED');

                  // Don't show weekly activity for users who need invites
                  if (needsInvite) {
                    return null;
                  }

                  return isWeeklyActivitiesLoading ? (
                    // Modern loading state with glassmorphism
                  <div className="relative backdrop-blur-xl bg-gradient-to-br from-gray-900/20 via-gray-800/15 to-gray-700/10 rounded-2xl p-5 mb-6 overflow-hidden shadow-lg shadow-cyan-400/20">
                    {/* Subtle floating orb */}
                    <div className="absolute top-3 right-4 w-2 h-2 bg-gradient-to-r from-cyan-400/40 to-blue-400/30 rounded-full animate-pulse"></div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/15 border border-cyan-400/30">
                        <Activity className="w-4 h-4 text-cyan-400" />
                      </div>
                      <span className="text-sm text-white font-medium">Weekly Momentum</span>
                    </div>
                    
                    <div className="w-full min-h-[70px] px-2 py-3 overflow-hidden">
                      <div className="grid grid-cols-3 gap-1 items-center">
                        {/* Streak Days */}
                        <div className="flex flex-col items-center text-center px-1">
                          <div className="loading-shimmer loading-pulse-soft h-5 w-10 rounded-lg mb-2 loading-glow bg-gradient-to-r from-white/10 to-white/5"></div>
                          <div className="text-xs text-white/60 font-medium">🔥 Streak</div>
                        </div>
                        
                        {/* Score Change */}
                        <div className="flex flex-col items-center text-center px-1">
                          <div className="space-y-1">
                            <div className="loading-shimmer loading-pulse-soft h-4 w-12 rounded-lg loading-glow bg-gradient-to-r from-white/10 to-white/5"></div>
                            <div className="loading-shimmer loading-pulse-soft h-3 w-8 rounded-lg loading-glow bg-gradient-to-r from-white/10 to-white/5 mx-auto"></div>
                          </div>
                          <div className="text-xs text-white/60 font-medium mt-2">📈 Score</div>
                        </div>
                        
                        {/* XP Gained */}
                        <div className="flex flex-col items-center text-center px-1">
                          <div className="loading-shimmer loading-pulse-soft h-5 w-12 rounded-lg mb-2 loading-glow bg-gradient-to-r from-white/10 to-white/5"></div>
                          <div className="text-xs text-white/60 font-medium">⚡ XP</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (() => {
                  const weeklyData = (weeklyActivitiesData as any)?.success ? (weeklyActivitiesData as any).data : null;
                  const summary = weeklyData?.summary;
                  
                  // Only show activity if we have valid enhanced profile data
                  const hasEnhancedData = (xpStreakDays !== null && xpStreakDays > 0) || weeklyXpGain > 0;
                  
                  if (hasEnhancedData) {
                    // Use only enhanced profile data - no fallbacks, strict null checking
                    const displayStreakDays = xpStreakDays !== null ? xpStreakDays : 0;
                    const displayXpGain = weeklyXpGain || 0;
                    
                    return (
                      <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/12 via-white/8 to-white/5 border border-white/20 rounded-2xl p-5 mb-6 overflow-hidden hover:from-white/15 hover:via-white/10 hover:to-white/7 transition-all duration-500 group">
                        {/* Floating orbs */}
                        <div className="absolute top-3 right-4 w-2 h-2 bg-gradient-to-r from-cyan-400/40 to-blue-400/30 rounded-full animate-pulse"></div>
                        <div className="absolute bottom-4 left-6 w-1.5 h-1.5 bg-gradient-to-r from-emerald-400/40 to-teal-400/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                        
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <div className="relative">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/15 border border-cyan-400/30 shadow-lg">
                              <Activity className="w-4 h-4 text-cyan-400" />
                            </div>
                            <span className="text-sm text-white font-semibold">Weekly Momentum</span>
                          </div>
                          
                          <div className="w-full min-h-[70px] px-2 py-3 overflow-hidden">
                            <div className="grid grid-cols-3 gap-1 items-center">
                              {/* Streak Days */}
                              <div className="flex flex-col items-center text-center px-1">
                                <div className="text-base sm:text-lg font-bold text-white whitespace-nowrap">
                                  {displayStreakDays}d
                                </div>
                                <div className="text-xs text-white/60 font-medium">🔥 Streak</div>
                              </div>
                              
                              {/* Score Change */}
                              <div className="flex flex-col items-center text-center px-1">
                                <div className="flex flex-col items-center gap-0.5 text-xs sm:text-sm font-bold">
                                  {summary?.scoreChange > 0 ? (
                                    <>
                                      <div className="flex items-center gap-1">
                                        <ArrowUp className="w-2.5 h-2.5 text-green-400 flex-shrink-0" />
                                        <span className="text-green-400">+{summary.scoreChange}</span>
                                      </div>
                                      <span className="text-[10px] text-white/60">(+{((summary.scoreChange / (user.score || 1)) * 100).toFixed(1)}%)</span>
                                    </>
                                  ) : summary?.scoreChange < 0 ? (
                                    <>
                                      <div className="flex items-center gap-1">
                                        <ArrowDown className="w-2.5 h-2.5 text-red-400 flex-shrink-0" />
                                        <span className="text-red-400">{summary.scoreChange}</span>
                                      </div>
                                      <span className="text-[10px] text-white/60">({Math.abs((summary.scoreChange / (user.score || 1)) * 100).toFixed(1)}%)</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-white">0</span>
                                      <span className="text-[10px] text-white/60">(0.0%)</span>
                                    </>
                                  )}
                                </div>
                                <div className="text-xs text-white/60 font-medium">📈 Score</div>
                              </div>
                              
                              {/* XP Gained */}
                              <div className="flex flex-col items-center text-center px-1">
                                <div className="text-base sm:text-lg font-bold text-white whitespace-nowrap">
                                  {(() => {
                                    const xp = displayXpGain;
                                    if (xp >= 1000) {
                                      return `+${(xp / 1000).toFixed(1)}K`;
                                    }
                                    return `+${xp}`;
                                  })()}
                                </div>
                                <div className="text-xs text-white/60 font-medium">⚡ XP</div>
                              </div>
                            </div>
                          </div>
                          

                        </div>
                      </div>
                    );
                  }
                  
                  // No activity state - more modern
                  return (
                    <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/8 via-white/5 to-white/3 border border-white/15 rounded-2xl p-6 mb-6 text-center overflow-hidden">
                      {/* Subtle pattern */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/3 via-transparent to-white/2 rounded-2xl"></div>
                      
                      <div className="relative flex flex-col items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20">
                          <Clock className="w-6 h-6 text-white/40" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white/60 mb-1">No Recent Activity</div>
                          <div className="text-xs text-white/40">Stay active to build your streak</div>
                        </div>
                      </div>
                    </div>
                  );
                })();
                })()}

                {/* Next Rank Progress - Only for established users */}
                {(() => {
                  // Check if user needs invite (same logic as above)
                  const enhancedProfile = (enhancedData as any)?.success ? (enhancedData as any).data : null;
                  const actualStatus = enhancedProfile?.status || user.status;
                  const actualProfileId = enhancedProfile?.profileId ?? user.profileId;
                  const hasNoProfile = !actualProfileId || actualProfileId === 0;
                  const needsInvite = hasNoProfile && (actualStatus === 'INACTIVE' || actualStatus === null || actualStatus === 'UNINITIALIZED');

                  // Don't show rank progress for users who need invites
                  if (needsInvite) {
                    return null;
                  }

                  return <NextRankProgress currentScore={score} className="mb-6" />;
                })()}

                {/* Connected Accounts Section with Loading */}
                <div className="backdrop-blur-md bg-white/8 border border-white/15 rounded-xl p-5 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Network className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-white/70 font-medium">Connected Accounts</span>
                  </div>
                  
                  {isAttestationsLoading ? (
                    // Loading state for connected accounts
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map((item) => (
                        <div key={item} className="backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-3 loading-glow">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="loading-shimmer loading-pulse-soft w-6 h-6 rounded-md"></div>
                              <div className="loading-shimmer loading-pulse-soft h-3 w-16 rounded"></div>
                            </div>
                            <div className="loading-shimmer loading-pulse-soft w-3 h-3 rounded"></div>
                          </div>
                          <div className="loading-shimmer loading-pulse-soft h-3 w-20 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : socialConnections.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {socialConnections
                        .sort((a: SocialAttestation, b: SocialAttestation) => {
                          const order: Record<string, number> = { 'x.com': 1, 'farcaster': 2, 'telegram': 3, 'discord': 4 };
                          return (order[a.service] || 999) - (order[b.service] || 999);
                        })
                        .map((connection: SocialAttestation, index: number) => {
                        const getPlatformConfig = (service: string) => {
                          switch (service) {
                            case 'x.com':
                              return {
                                icon: <SiX className="w-4 h-4 text-white" />,
                                name: 'X',
                                color: 'text-white',
                                bg: 'bg-black/30'
                              };
                            case 'farcaster':
                              return {
                                icon: <SiFarcaster className="w-4 h-4 text-purple-400" />,
                                name: 'Farcaster',
                                color: 'text-purple-400',
                                bg: 'bg-purple-500/20'
                              };
                            case 'discord':
                              return {
                                icon: <SiDiscord className="w-4 h-4 text-indigo-400" />,
                                name: 'Discord',
                                color: 'text-indigo-400',
                                bg: 'bg-indigo-500/20'
                              };
                            case 'telegram':
                              return {
                                icon: <SiTelegram className="w-4 h-4 text-blue-400" />,
                                name: 'Telegram',
                                color: 'text-blue-400',
                                bg: 'bg-blue-500/20'
                              };
                            default:
                              return {
                                icon: <span className="text-sm">{connection.icon}</span>,
                                name: connection.serviceName || 'Unknown',
                                color: 'text-white/70',
                                bg: 'bg-white/10'
                              };
                          }
                        };
                        
                        const getProfileUrl = (service: string, username: string, account: string) => {
                          switch (service) {
                            case 'x.com':
                              return `https://x.com/${username}`;
                            case 'farcaster':
                              return `https://farcaster.xyz/${username}`;
                            case 'telegram':
                              return `https://t.me/${username}`;
                            case 'discord':
                              return `https://discordapp.com/users/${account}`;
                            default:
                              return null;
                          }
                        };

                        const platformConfig = getPlatformConfig(connection.service);
                        const profileUrl = getProfileUrl(connection.service, connection.username, connection.account);
                        

                        
                        const CardContent = () => (
                          <div className="group backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg p-3 transition-all duration-200 hover:scale-[1.02] h-full">
                            <div className="flex flex-col h-full">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-6 h-6 rounded-md ${platformConfig.bg} border border-white/10 flex items-center justify-center relative flex-shrink-0`}>
                                    {platformConfig.icon}
                                    {connection.verified && (
                                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white/30"></div>
                                    )}
                                  </div>
                                  <span className={`text-xs font-medium ${platformConfig.color}`}>{platformConfig.name}</span>
                                </div>
                                {profileUrl && (
                                  <ExternalLink className="w-3 h-3 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                )}
                              </div>
                              <div className="text-white/70 text-xs leading-relaxed break-words">
                                @{connection.displayName || connection.username}
                              </div>
                            </div>
                          </div>
                        );
                        
                        return profileUrl ? (
                          <a
                            key={index}
                            href={profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <CardContent />
                          </a>
                        ) : (
                          <div key={index}>
                            <CardContent />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // No connected accounts found
                    <div className="text-center py-6">
                      <div className="text-white/40 text-sm">No connected accounts found</div>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeView === 'activity' && (
              <div className="space-y-6 mb-6">
                {/* Compact Vouch Summary */}
                <div className="bg-white/5 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl border border-white/10 dark:border-gray-700/30 p-5">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Vouches Received */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-medium text-white/80">Received</span>
                      </div>
                      <div className="flex items-baseline gap-3">
                        <div className="text-2xl font-bold text-emerald-400">
                          {vouchData?.success ? vouchData.data.received?.length || 0 : vouchesReceived}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                            <span className="text-sm">Ξ</span>
                            <span className="text-sm">
                              {vouchData?.success ? 
                                (vouchData.data.received?.reduce((sum: number, v: any) => sum + parseFloat(v.amountEth || '0'), 0).toFixed(3) || '0.000') :
                                (parseFloat(realStats?.vouch?.received?.amountWeiTotal || '0') / 1e18).toFixed(3)
                              }
                            </span>
                          </div>
                          <div className="text-xs text-white/40 mt-0.5">
                            {formatCurrency(parseFloat(vouchData?.success ? 
                              (vouchData.data.received?.reduce((sum: number, v: any) => sum + parseFloat(v.amountEth || '0'), 0) || 0) :
                              (parseFloat(realStats?.vouch?.received?.amountWeiTotal || '0') / 1e18)) * 3870)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Vouches Given */}
                    <div className="space-y-2 border-l border-white/10 pl-6">
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4 text-red-400" />
                        <span className="text-sm font-medium text-white/80">Given</span>
                      </div>
                      <div className="flex items-baseline gap-3">
                        <div className="text-2xl font-bold text-red-400">
                          {vouchData?.success ? vouchData.data.given?.length || 0 : vouchesGiven}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-red-400 font-semibold">
                            <span className="text-sm">Ξ</span>
                            <span className="text-sm">
                              {vouchData?.success ? 
                                (vouchData.data.given?.reduce((sum: number, v: any) => sum + parseFloat(v.amountEth || '0'), 0).toFixed(3) || '0.000') :
                                (parseFloat(realStats?.vouch?.given?.amountWeiTotal || '0') / 1e18).toFixed(3)
                              }
                            </span>
                          </div>
                          <div className="text-xs text-white/40 mt-0.5">
                            {formatCurrency(parseFloat(vouchData?.success ? 
                              (vouchData.data.given?.reduce((sum: number, v: any) => sum + parseFloat(v.amountEth || '0'), 0) || 0) :
                              (parseFloat(realStats?.vouch?.given?.amountWeiTotal || '0') / 1e18)) * 3870)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Vouches Received */}
                {vouchData?.success && vouchData.data.received?.length > 0 && (
                  <div className="bg-gray-900/15 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl p-4 shadow-lg shadow-emerald-400/10 mb-6">
                    {/* Enhanced Header with Divider */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <ArrowDownLeft className="w-6 h-6 text-emerald-400" />
                        <div>
                          <h3 className="text-lg font-bold text-white">Recent Vouches Received</h3>
                          <span className="px-2 py-0.5 bg-emerald-500/20 rounded-full text-xs font-medium text-emerald-300">
                            {vouchData.data.received.length} total
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowVouchModal({ type: 'received' })}
                        className="px-3 py-2 text-sm font-medium text-emerald-300 hover:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30 rounded-lg transition-all duration-200"
                      >
                        View All →
                      </button>
                    </div>
                    
                    {/* Divider Line */}
                    <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent mb-4"></div>
                    
                    {/* Compact Vouches List */}
                    <div className="space-y-2">
                      {vouchData.data.received.slice(0, 3).map((vouch: any, index: number) => {
                        const getDisplayName = () => {
                          if (vouch.voucherInfo?.displayName) {
                            return vouch.voucherInfo.displayName;
                          }
                          if (vouch.voucher && vouch.voucher.startsWith('address:')) {
                            const addr = vouch.voucher.split(':')[1];
                            return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : 'Anonymous';
                          }
                          return 'Anonymous';
                        };

                        const displayName = getDisplayName();
                        const hasScore = vouch.voucherInfo?.score;
                        const ethAmount = parseFloat(vouch.amountEth || '0.010');

                        return (
                          <div key={vouch.id || index} className="flex items-center justify-between p-4 bg-white/3 dark:bg-gray-700/20 rounded-lg hover:bg-gray-700/20 transition-all duration-200 group">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-white truncate">
                                    {displayName}
                                  </span>
                                  {hasScore && (
                                    <span className="text-xs text-emerald-400 font-medium">
                                      {vouch.voucherInfo.score}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-white/50">
                                  {vouch.timestamp ? new Date(vouch.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent'}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-1 text-emerald-400 font-bold text-base">
                                <span className="text-sm">≡</span>
                                <span>{ethAmount.toFixed(3)}</span>
                              </div>
                              <div className="text-xs text-white/40">
                                {formatCurrency(ethAmount * 3870)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Show comment for first vouch if available */}
                    {vouchData.data.received[0]?.comment && (
                      <div className="mt-3 p-2 bg-white/3 dark:bg-gray-700/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <span className="text-sm">💭</span>
                          <p className="text-xs text-white/70 italic">
                            "{vouchData.data.received[0].comment.length > 80 ? vouchData.data.received[0].comment.slice(0, 80) + '...' : vouchData.data.received[0].comment}"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Recent Vouches Given */}
                {vouchData?.success && vouchData.data.given?.length > 0 && (
                  <div className="bg-gray-900/15 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl p-4 shadow-lg shadow-emerald-400/10 mb-6">
                    {/* Enhanced Header with Divider */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <ArrowUpRight className="w-6 h-6 text-red-400" />
                        <div>
                          <h3 className="text-lg font-bold text-white">Recent Vouches Given</h3>
                          <span className="px-2 py-0.5 bg-red-500/20 rounded-full text-xs font-medium text-red-300">
                            {vouchData.data.given.length} total
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowVouchModal({ type: 'given' })}
                        className="px-3 py-2 text-sm font-medium text-red-300 hover:text-red-200 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-lg transition-all duration-200"
                      >
                        View All →
                      </button>
                    </div>
                    
                    {/* Divider Line */}
                    <div className="h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent mb-4"></div>
                    
                    {/* Compact Vouches List */}
                    <div className="space-y-2">
                      {vouchData.data.given.slice(0, 3).map((vouch: any, index: number) => {
                        const getDisplayName = () => {
                          if (vouch.voucheeInfo?.displayName) {
                            return vouch.voucheeInfo.displayName;
                          }
                          if (vouch.vouchee && vouch.vouchee.startsWith('address:')) {
                            const addr = vouch.vouchee.split(':')[1];
                            return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : 'Anonymous';
                          }
                          return 'Anonymous';
                        };

                        const displayName = getDisplayName();
                        const hasScore = vouch.voucheeInfo?.score;
                        const ethAmount = parseFloat(vouch.amountEth || '0.010');

                        return (
                          <div key={vouch.id || index} className="flex items-center justify-between p-4 bg-white/3 dark:bg-gray-700/20 rounded-lg hover:bg-gray-700/20 transition-all duration-200 group">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <ArrowUpRight className="w-4 h-4 text-red-400" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-white truncate">
                                    {displayName}
                                  </span>
                                  {hasScore && (
                                    <span className="text-xs text-red-400 font-medium">
                                      {vouch.voucheeInfo.score}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-white/50">
                                  {vouch.timestamp ? new Date(vouch.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent'}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-1 text-red-400 font-bold text-base">
                                <span className="text-sm">≡</span>
                                <span>{ethAmount.toFixed(3)}</span>
                              </div>
                              <div className="text-xs text-white/40">
                                {formatCurrency(ethAmount * 3870)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Show comment for first vouch if available */}
                    {vouchData.data.given[0]?.comment && (
                      <div className="mt-3 p-2 bg-white/3 dark:bg-gray-700/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <span className="text-sm">💭</span>
                          <p className="text-xs text-white/70 italic">
                            "{vouchData.data.given[0].comment.length > 80 ? vouchData.data.given[0].comment.slice(0, 80) + '...' : vouchData.data.given[0].comment}"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Loading State */}
                {!vouchData && (
                  <div className="backdrop-blur-md bg-gray-900/15 rounded-xl p-5 shadow-lg shadow-gray-400/10">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span className="ml-2 text-white/70">Loading vouch data...</span>
                    </div>
                  </div>
                )}

                {/* No Data State */}
                {vouchData?.success && (!vouchData.data.received?.length && !vouchData.data.given?.length) && (
                  <div className="backdrop-blur-md bg-gray-900/15 rounded-xl p-5 text-center shadow-lg shadow-gray-400/10">
                    <Clock className="w-8 h-8 text-white/30 mx-auto mb-2" />
                    <div className="text-sm text-white/50">No vouch activity found yet</div>
                  </div>
                )}
              </div>
            )}

            {activeView === 'network' && (
              <>
                {/* R4R Analysis */}
                <R4RDataSection 
                  userkey={user?.userkeys?.[0]} 
                  userProfile={{
                    displayName: user?.displayName,
                    username: user?.username,
                    avatarUrl: user?.avatarUrl || user?.avatar
                  }}
                />
              </>
            )}

            {/* View on Ethos button - only show in Overview */}
            {activeView === 'overview' && (
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleViewOnEthos}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl backdrop-blur-md bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 text-white text-sm font-medium hover:from-blue-500/30 hover:to-cyan-500/30 transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-xl"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View on Ethos</span>
                </button>
                
                <button 
                  onClick={() => {
                    const baseUrl = window.location.origin;
                    const userkey = user?.userkeys?.[0] || '';
                    const frameUrl = `${baseUrl}/farcaster/frame/${encodeURIComponent(userkey)}`;
                    const score = user?.score || 0;
                    
                    const getScoreLevel = (score: number): string => {
                      if (score >= 2000) return 'Exemplary';
                      if (score >= 1600) return 'Reputable';
                      if (score >= 1200) return 'Neutral';
                      if (score >= 800) return 'Questionable';
                      return 'Untrusted';
                    };
                    
                    const castText = `✨ Flexing my trust reputation on @ethos-protocol! 

🏆 Trust Score: ${score} | ${getScoreLevel(score)} Tier
🔥 Building credibility in Web3, one interaction at a time

Check out your trust score using this frame built by @cookedzera.eth 👇

${frameUrl}`;

                    const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}&embeds[]=${encodeURIComponent(frameUrl)}`;
                    window.open(warpcastUrl, '_blank');
                  }}
                  className="px-3 py-2 rounded-lg backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-all duration-300 hover:scale-105"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Vouches Modal */}
      {showVouchModal.type && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          {/* Background floating orbs for ambiance */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
          
          <div className="relative bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-3xl rounded-2xl border border-white/20 shadow-2xl shadow-black/40 w-full max-w-md max-h-[85vh] overflow-hidden">
            {/* Floating header orbs */}
            <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute -top-4 -left-8 w-8 h-8 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
            
            {/* Premium Modal Header */}
            <div className="relative bg-gradient-to-r from-white/5 via-white/10 to-white/5 backdrop-blur-xl border-b border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl backdrop-blur-sm border ${
                    showVouchModal.type === 'received' 
                      ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300' 
                      : 'bg-red-500/10 border-red-400/30 text-red-300'
                  }`}>
                    {showVouchModal.type === 'received' ? (
                      <ArrowDownLeft className="w-6 h-6" />
                    ) : (
                      <ArrowUpRight className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                      All Vouches {showVouchModal.type === 'received' ? 'Received' : 'Given'}
                    </h2>
                    <p className="text-white/60 mt-1 flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        showVouchModal.type === 'received' 
                          ? 'bg-emerald-500/20 text-emerald-300' 
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                        {showVouchModal.type === 'received' 
                          ? vouchData?.data.received?.length || 0 
                          : vouchData?.data.given?.length || 0} total vouches
                      </span>
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowVouchModal({ type: null })}
                  className="group p-3 hover:bg-white/10 rounded-2xl transition-all duration-300 hover:scale-105 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-7 h-7 text-white/80 group-hover:text-white transition-colors stroke-2" />
                </button>
              </div>
            </div>

            {/* Compact Modal Content with Profile Navigation */}
            <div className="p-4 overflow-y-auto max-h-[calc(85vh-120px)] modal-scroll">
              <div className="space-y-3">
                {(showVouchModal.type === 'received' ? vouchData?.data.received : vouchData?.data.given)?.map((vouch: any, index: number) => {
                  const getDisplayName = () => {
                    const userInfo = showVouchModal.type === 'received' ? vouch.voucherInfo : vouch.voucheeInfo;
                    
                    // First priority: displayName from userInfo
                    if (userInfo?.displayName) return userInfo.displayName;
                    
                    // Second priority: username from userInfo
                    if (userInfo?.username) return `@${userInfo.username}`;
                    
                    // Third priority: name from userInfo
                    if (userInfo?.name) return userInfo.name;
                    
                    // Fallback: format userkey nicely
                    const userkey = showVouchModal.type === 'received' ? vouch.voucher : vouch.vouchee;
                    if (userkey) {
                      if (userkey.startsWith('address:')) {
                        const addr = userkey.split(':')[1];
                        return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : 'Anonymous';
                      } else if (userkey.startsWith('service:x.com:') || userkey.startsWith('service:twitter.com:')) {
                        return 'Twitter User';
                      } else if (userkey.startsWith('service:farcaster:')) {
                        return 'Farcaster User';
                      } else if (userkey.startsWith('profileId:')) {
                        return `Profile ${userkey.split(':')[1]}`;
                      }
                    }
                    return 'Anonymous';
                  };

                  const displayName = getDisplayName();
                  const userInfo = showVouchModal.type === 'received' ? vouch.voucherInfo : vouch.voucheeInfo;
                  const hasScore = userInfo?.score;
                  const ethAmount = parseFloat(vouch.amountEth || '0.010');
                  const targetUserkey = showVouchModal.type === 'received' ? vouch.voucher : vouch.vouchee;

                  // Navigation handler for profile clicks
                  const handleProfileClick = async (e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (!targetUserkey || targetUserkey === user?.userkeys?.[0]) return;
                    
                    try {
                      // Check if we already have user info from the vouch data
                      const existingUserInfo = showVouchModal.type === 'received' ? vouch.voucherInfo : vouch.voucheeInfo;
                      
                      if (existingUserInfo && existingUserInfo.displayName && existingUserInfo.score !== undefined) {
                        // Use the existing user info if we have it
                        const userData = {
                          id: existingUserInfo.profileId || 0,
                          profileId: existingUserInfo.profileId || 0,
                          displayName: existingUserInfo.displayName,
                          username: existingUserInfo.username || '',
                          avatarUrl: existingUserInfo.avatarUrl || '',
                          description: existingUserInfo.description || '',
                          score: existingUserInfo.score,
                          status: "ACTIVE",
                          userkeys: [targetUserkey],
                          xpTotal: 0,
                          xpStreakDays: 0,
                          links: {
                            profile: `https://app.ethos.network/profile/${targetUserkey}`,
                            scoreBreakdown: `https://app.ethos.network/profile/${targetUserkey}/score`
                          },
                          stats: {
                            review: { received: { negative: 0, neutral: 0, positive: 0 } },
                            vouch: { given: { amountWeiTotal: "0", count: 0 }, received: { amountWeiTotal: "0", count: 0 } }
                          }
                        };
                        
                        // Close the modal and navigate immediately
                        setShowVouchModal({ type: null });
                        
                        setTimeout(() => {
                          const newUrl = `/?user=${encodeURIComponent(JSON.stringify(userData))}`;
                          window.history.pushState({}, '', newUrl);
                          
                          if (onUserSearch) {
                            onUserSearch(userData);
                          }
                        }, 100);
                        return;
                      }
                      
                      // Fall back to API search if we don't have enough info
                      const response = await fetch('/api/search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: targetUserkey })
                      });
                      
                      const contentType = response.headers.get('content-type');
                      if (!contentType || !contentType.includes('application/json')) {
                        throw new Error('Invalid response format');
                      }
                      
                      const result = await response.json();
                      
                      if (result.success && result.data) {
                        setShowVouchModal({ type: null });
                        
                        setTimeout(() => {
                          const newUrl = `/?user=${encodeURIComponent(JSON.stringify(result.data))}`;
                          window.history.pushState({}, '', newUrl);
                          
                          if (onUserSearch) {
                            onUserSearch(result.data);
                          }
                        }, 100);
                      }
                    } catch (error) {
                      // Silent error handling
                    }
                  };

                  return (
                    <div key={vouch.id || index} className="group relative">
                      <div className="relative bg-gradient-to-br from-white/8 via-white/4 to-white/8 backdrop-blur-xl rounded-xl border border-white/10 p-4 hover:border-white/20 hover:bg-gray-700/20 transition-all duration-300">
                        <div className="flex items-center justify-between gap-4">
                          {/* Compact User Info */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`p-2 rounded-lg backdrop-blur-sm border flex-shrink-0 ${
                              showVouchModal.type === 'received' 
                                ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300' 
                                : 'bg-red-500/10 border-red-400/30 text-red-300'
                            }`}>
                              {showVouchModal.type === 'received' ? (
                                <ArrowDownLeft className="w-4 h-4" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              {/* Name and Score Row */}
                              <div className="flex items-center gap-2 mb-1">
                                <button
                                  onClick={handleProfileClick}
                                  className="group/name text-base font-bold bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent hover:from-cyan-200 hover:to-blue-200 transition-all duration-300 cursor-pointer flex items-center gap-1.5 truncate"
                                  disabled={!targetUserkey || targetUserkey === user?.userkeys?.[0]}
                                >
                                  <span className="truncate">{displayName}</span>
                                  {targetUserkey && targetUserkey !== user?.userkeys?.[0] && (
                                    <ExternalLink className="w-3 h-3 text-white/50 group-hover/name:text-cyan-300 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0" />
                                  )}
                                </button>
                                
                                {hasScore && (
                                  <span className={`px-2 py-0.5 rounded-lg text-xs font-medium backdrop-blur-sm border flex-shrink-0 ${
                                    userInfo.score >= 2000 
                                      ? 'bg-purple-500/15 border-purple-400/30 text-purple-300' 
                                      : userInfo.score >= 1600 
                                      ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                                      : userInfo.score >= 1200
                                      ? 'bg-blue-500/15 border-blue-400/30 text-blue-300'
                                      : userInfo.score >= 800
                                      ? 'bg-amber-500/15 border-amber-400/30 text-amber-300'
                                      : 'bg-red-500/15 border-red-400/30 text-red-300'
                                  }`}>
                                    {userInfo.score}
                                  </span>
                                )}
                              </div>
                              
                              {/* Date Row */}
                              <div className="text-xs text-white/50">
                                {vouch.timestamp 
                                  ? new Date(vouch.timestamp * 1000).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    }) + ' at ' + new Date(vouch.timestamp * 1000).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : 'Recent'
                                }
                              </div>
                              
                              {/* Comment (if exists) */}
                              {vouch.comment && vouch.comment.trim() && (
                                <div className="mt-2 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-lg border border-white/10 p-2">
                                  <div className="flex items-start gap-2">
                                    <MessageSquare className="w-3 h-3 text-white/60 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-white/80 leading-relaxed">
                                      "{vouch.comment}"
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Compact Amount Display */}
                          <div className="text-right flex-shrink-0">
                            <div className="flex items-center gap-1 font-bold text-lg text-white">
                              <span className="text-sm">Ξ</span>
                              <span>{ethAmount.toFixed(3)}</span>
                            </div>
                            <div className="text-xs text-white/50 mt-0.5">
                              {formatCurrency(ethAmount * 3870)} USD
                            </div>
                            <div className={`text-xs mt-1 px-1.5 py-0.5 rounded-md backdrop-blur-sm ${
                              showVouchModal.type === 'received' 
                                ? 'bg-emerald-500/20 text-emerald-300' 
                                : 'bg-red-500/20 text-red-300'
                            }`}>
                              {showVouchModal.type === 'received' ? 'Received' : 'Given'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}