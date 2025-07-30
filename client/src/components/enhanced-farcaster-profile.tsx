import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Share2, Crown, Award, Zap, Shield, AlertTriangle, TrendingUp, Users, MessageSquare, Star, Calendar, Activity, BarChart3, Network, Clock, ArrowDownLeft, ArrowUpRight, X, Coins, Heart } from "lucide-react";
import { SiX, SiDiscord, SiFarcaster, SiTelegram } from "react-icons/si";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatNumber, formatXP, formatWeeklyGain, formatCurrency } from "@/lib/number-utils";
// Theme provider removed - dark mode only

interface EnhancedFarcasterProfileProps {
  user: any;
  onBackToSearch: () => void;
}

// Enhanced Ethos tier system with levels
const getTierInfo = (score: number) => {
  if (score >= 2400) return { 
    icon: Crown, 
    tier: 'Revered',
    shortTier: 'REV',
    level: getEthosLevel(score),
    colors: {
      bg: 'from-purple-500/20 to-violet-500/20',
      border: 'border-purple-400/30',
      text: 'text-purple-300',
      glow: 'shadow-purple-500/20'
    }
  };
  if (score >= 2000) return { 
    icon: Crown, 
    tier: 'Exemplary',
    shortTier: 'EXC',
    level: getEthosLevel(score),
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
    level: getEthosLevel(score),
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
    level: getEthosLevel(score),
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
    level: getEthosLevel(score),
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
    level: getEthosLevel(score),
    colors: {
      bg: 'from-gray-500/20 to-slate-500/20',
      border: 'border-gray-400/30',
      text: 'text-gray-300',
      glow: 'shadow-gray-500/20'
    }
  };
};

// Get Ethos level from score (matches ethos-farcaster repository)
function getEthosLevel(score: number): string {
  if (score >= 2400) return "revered";
  if (score >= 2000) return "exemplary";
  if (score >= 1600) return "reputable";
  if (score >= 1200) return "neutral";
  if (score >= 800) return "questionable";
  return "untrusted";
}

// Get level color for UI
function getLevelColor(score: number): string {
  if (score >= 2400) return "purple";
  if (score >= 2000) return "green";
  if (score >= 1600) return "blue";
  if (score >= 1200) return "yellow";
  if (score >= 800) return "orange";
  return "red";
}

// Extract FID from userkeys
function extractFarcasterFid(userkeys: string[]): string | null {
  const farcasterKey = userkeys.find(key => key.startsWith('service:farcaster:'));
  return farcasterKey ? farcasterKey.split(':')[2] : null;
}

// Format vouch amounts from Wei to ETH
function formatVouchAmount(amountWei: string | number): string {
  const wei = typeof amountWei === 'string' ? amountWei : amountWei.toString();
  const eth = parseFloat(wei) / 1e18;
  if (eth === 0) return '0 ETH';
  if (eth < 0.001) return '<0.001 ETH';
  return `${eth.toFixed(3)} ETH`;
}

export function EnhancedFarcasterProfile({ user, onBackToSearch }: EnhancedFarcasterProfileProps) {
  const [enhancedData, setEnhancedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const tierInfo = getTierInfo(user.score);
  const TierIcon = tierInfo.icon;
  const fid = extractFarcasterFid(user.userkeys || []);

  useEffect(() => {
    if (fid) {
      // Fetch enhanced profile data using FID
      fetch(`/api/farcaster-fid/${fid}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setEnhancedData(data.data);
          }
          setLoading(false);
        })
        .catch(error => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [fid]);

  const profileData = enhancedData || user;
  const stats = profileData.stats || { review: { received: { negative: 0, neutral: 0, positive: 0 } }, vouch: { given: { amountWeiTotal: "0", count: 0 }, received: { amountWeiTotal: "0", count: 0 } } };

  // Calculate review totals
  const totalReviews = stats.review.received.negative + stats.review.received.neutral + stats.review.received.positive;
  const positiveRatio = totalReviews > 0 ? (stats.review.received.positive / totalReviews) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-gray-950 dark:via-blue-950 dark:to-gray-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToSearch}
            className="text-slate-300 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>
          
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <SiFarcaster className="h-4 w-4" />
            Enhanced Farcaster Profile
            {fid && <Badge variant="outline">FID: {fid}</Badge>}
          </div>
        </div>

        {/* Main Profile Card */}
        <Card className={`mb-8 bg-gradient-to-r ${tierInfo.colors.bg} ${tierInfo.colors.border} backdrop-blur-xl border shadow-2xl ${tierInfo.colors.glow}`}>
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Profile Info */}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                <Avatar className="h-24 w-24 mb-4 ring-4 ring-white/20">
                  <AvatarImage src={profileData.avatarUrl} alt={profileData.displayName} />
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                    {profileData.displayName?.charAt(0) || profileData.username?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                    {profileData.displayName || profileData.username}
                    <TierIcon className={`h-6 w-6 ${tierInfo.colors.text}`} />
                  </h1>
                  
                  <div className="flex flex-col gap-1">
                    <Badge className={`${tierInfo.colors.bg} ${tierInfo.colors.text} ${tierInfo.colors.border} font-semibold px-3 py-1`}>
                      {tierInfo.tier} ({tierInfo.level})
                    </Badge>
                    
                    <p className="text-slate-300 text-sm">@{profileData.username}</p>
                    
                    {profileData.description && (
                      <p className="text-slate-400 text-sm max-w-md">
                        {profileData.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Score & Stats Grid */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Ethos Score */}
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-white mb-1">
                    {formatNumber(profileData.score)}
                  </div>
                  <div className="text-sm text-slate-300">Ethos Score</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Level {tierInfo.level}
                  </div>
                </div>

                {/* XP Stats */}
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-300 mb-1">
                    {formatXP(profileData.xpTotal || 0)}
                  </div>
                  <div className="text-sm text-slate-300">Total XP</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {profileData.xpStreakDays || 0} day streak
                  </div>
                </div>

                {/* Reviews */}
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-300 mb-1">
                    {stats.review.received.positive}
                  </div>
                  <div className="text-sm text-slate-300">Positive Reviews</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {totalReviews} total ({positiveRatio.toFixed(0)}% positive)
                  </div>
                </div>

                {/* Vouches Received */}
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-300 mb-1">
                    {stats.vouch.received.count}
                  </div>
                  <div className="text-sm text-slate-300">Vouches Received</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {formatVouchAmount(stats.vouch.received.amountWeiTotal)}
                  </div>
                </div>

                {/* Vouches Given */}
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-amber-300 mb-1">
                    {stats.vouch.given.count}
                  </div>
                  <div className="text-sm text-slate-300">Vouches Given</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {formatVouchAmount(stats.vouch.given.amountWeiTotal)}
                  </div>
                </div>

                {/* Status */}
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-lg font-bold text-emerald-300 mb-1">
                    {profileData.status || 'ACTIVE'}
                  </div>
                  <div className="text-sm text-slate-300">Account Status</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Profile #{profileData.profileId}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6 pt-6 border-t border-white/10">
              {profileData.links?.profile && (
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => window.open(profileData.links.profile, '_blank')}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Ethos
                </Button>
              )}
              
              {profileData.links?.scoreBreakdown && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(profileData.links.scoreBreakdown, '_blank')}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Score Breakdown
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Review Breakdown */}
          <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Review Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-green-300 flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Positive
                  </span>
                  <span className="text-white font-medium">{stats.review.received.positive}</span>
                </div>
                <Progress 
                  value={totalReviews > 0 ? (stats.review.received.positive / totalReviews) * 100 : 0} 
                  className="h-2 bg-white/10"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-yellow-300 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Neutral
                  </span>
                  <span className="text-white font-medium">{stats.review.received.neutral}</span>
                </div>
                <Progress 
                  value={totalReviews > 0 ? (stats.review.received.neutral / totalReviews) * 100 : 0} 
                  className="h-2 bg-white/10" 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-red-300 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Negative
                  </span>
                  <span className="text-white font-medium">{stats.review.received.negative}</span>
                </div>
                <Progress 
                  value={totalReviews > 0 ? (stats.review.received.negative / totalReviews) * 100 : 0} 
                  className="h-2 bg-white/10" 
                />
              </div>
            </CardContent>
          </Card>

          {/* Connected Accounts */}
          <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Network className="h-5 w-5" />
                Connected Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profileData.userkeys?.map((userkey: string, index: number) => {
                const [service, platform, id] = userkey.split(':');
                let icon = Network;
                let label = platform;
                let color = 'text-slate-300';

                if (platform === 'x.com') {
                  icon = SiX as any;
                  label = 'X (Twitter)';
                  color = 'text-blue-400';
                } else if (platform === 'farcaster') {
                  icon = SiFarcaster as any;
                  label = 'Farcaster';
                  color = 'text-purple-400';
                } else if (platform === 'discord') {
                  icon = SiDiscord as any;
                  label = 'Discord';
                  color = 'text-indigo-400';
                } else if (platform === 'telegram') {
                  icon = SiTelegram as any;
                  label = 'Telegram';
                  color = 'text-cyan-400';
                } else if (userkey.startsWith('address:')) {
                  icon = Coins;
                  label = 'Wallet';
                  color = 'text-emerald-400';
                }

                const IconComponent = icon;

                return (
                  <div key={index} className="flex items-center gap-3 p-2 rounded bg-white/5">
                    <IconComponent className={`h-4 w-4 ${color}`} />
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{label}</div>
                      <div className="text-slate-400 text-xs truncate">
                        {userkey.startsWith('address:') ? userkey.split(':')[1] : id}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {loading && fid && (
          <div className="text-center py-8">
            <div className="text-slate-400">Loading enhanced profile data...</div>
          </div>
        )}
      </div>
    </div>
  );
}