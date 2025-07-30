import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HandHeart, TrendingUp, Users, Coins } from "lucide-react";
import { useUserProfile, useUserStats } from "@/hooks/use-ethos-api";

interface VouchDetail {
  voucher: string;
  vouchee: string;
  amount: string;
  amountEth: string;
  timestamp: string;
  comment?: string;
  platform?: string;
  voucherInfo?: {
    displayName?: string;
    username?: string;
    userkey: string;
    profileId?: number;
    score?: number;
  };
  voucheeInfo?: {
    displayName?: string;
    username?: string;
    userkey: string;
    profileId?: number;
    score?: number;
  };
}

interface UserVouchIntelligenceProps {
  className?: string;
  user?: any; // Accept user as prop
}

export function UserVouchIntel({ className = "", user: propUser }: UserVouchIntelligenceProps) {
  const { user: contextUser } = useUserProfile();
  const user = propUser || contextUser; // Use prop user if provided, otherwise context user
  const { data: userStats } = useUserStats(user?.userkeys?.[0]);
  const [vouchDetails, setVouchDetails] = useState<{
    received: VouchDetail[];
    given: VouchDetail[];
    loading: boolean;
    ethUsdRate?: number;
  }>({
    received: [],
    given: [],
    loading: true,
  });
  const [showGiven, setShowGiven] = useState(false);

  useEffect(() => {
    if (user?.userkeys?.[0]) {
      fetchUserVouches();
    }
  }, [user]);

  const fetchUserVouches = async () => {
    if (!user?.userkeys?.[0]) return;

    setVouchDetails(prev => ({ ...prev, loading: true }));

    try {
      const response = await fetch(`/api/user-vouch-activities/${encodeURIComponent(user.userkeys[0])}`);
      const data = await response.json();

      if (data.success) {
        setVouchDetails({
          received: data.data.received || [],
          given: data.data.given || [],
          loading: false,
          ethUsdRate: data.data.ethUsdRate || 3400,
        });
      } else {

        setVouchDetails({
          received: [],
          given: [],
          loading: false,
          ethUsdRate: 3400,
        });
      }
    } catch (error) {

      setVouchDetails({
        received: [],
        given: [],
        loading: false,
        ethUsdRate: 3400,
      });
    }
  };

  const formatAmount = (weiAmount: string | number) => {
    const amount = typeof weiAmount === 'string' ? weiAmount : weiAmount.toString();
    if (!amount || amount === '0') return '0.000';
    const eth = parseFloat(amount) / 1e18;
    return eth < 0.001 ? '<0.001' : eth.toFixed(3);
  };

  const formatTimestamp = (timestamp: string | number) => {
    let date: Date;
    if (typeof timestamp === 'string') {
      if (timestamp.includes('T')) {
        date = new Date(timestamp);
      } else {
        date = new Date(parseInt(timestamp) * 1000);
      }
    } else {
      date = new Date(timestamp * 1000);
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="text-center py-4">
          <HandHeart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <div className="text-sm text-muted-foreground">
            Search for a user first to view their vouch intel
          </div>
        </div>
      </div>
    );
  }

  const receivedStats = (userStats as any)?.data?.vouch?.received || user?.stats?.vouch?.received;
  const givenStats = (userStats as any)?.data?.vouch?.given || user?.stats?.vouch?.given;

  return (
    <div className={`space-y-4 animate-slide-up miniapp-optimized ${className}`} style={{ animationDelay: '0.6s' }}>
      {/* Ultra Modern Header with Floating Effect */}
      <div className="relative">
        {/* Floating orb animation background */}
        <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl opacity-70 animate-pulse"></div>
        
        <div className="relative flex items-center justify-between p-4 backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-2xl border border-white/20 dark:border-white/15 shadow-2xl shadow-black/25 dark:shadow-black/80">
          <div className="flex items-center space-x-3">
            <div className="relative p-2 bg-gradient-to-br from-pink-500/20 to-purple-600/20 rounded-xl backdrop-blur-sm">
              <HandHeart className="h-5 w-5 text-pink-400 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-pink-400 to-rose-500 rounded-full animate-ping"></div>
            </div>
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Vouch Intel
              </h3>
              <p className="text-xs text-white/60 dark:text-gray-400">Trust Network Analysis</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50"></div>
            <span className="text-xs font-medium text-white/80 dark:text-gray-300">Live Data</span>
          </div>
        </div>
      </div>

      {/* Redesigned Summary Cards with Premium Glassmorphism */}
      <div className="relative">
        {/* Multi-layer background animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-blue-600/10 to-purple-600/10 rounded-3xl blur-xl animate-pulse"></div>
        <div className="absolute inset-1 bg-gradient-to-br from-cyan-400/5 via-transparent to-pink-400/5 rounded-2xl"></div>
        
        <div className="relative p-5 bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl">
          <div className="grid grid-cols-2 gap-6">
            {/* Received Section */}
            <div className="text-center space-y-3">
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-xl backdrop-blur-sm border border-emerald-400/20">
                  <div className="text-2xl font-bold text-emerald-300 dark:text-emerald-400">
                    {receivedStats?.count || 0}
                  </div>
                  <div className="text-xs font-semibold text-emerald-400/80 dark:text-emerald-300/80 uppercase tracking-wider">
                    💚 Received
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-1">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-white dark:text-gray-200">
                    {receivedStats?.amountWeiTotal ? formatAmount(receivedStats.amountWeiTotal) : '0.000'} ETH
                  </span>
                </div>
                {vouchDetails.ethUsdRate && receivedStats?.amountWeiTotal && (
                  <div className="text-xs text-emerald-400 dark:text-emerald-300 font-medium">
                    ${(parseFloat(formatAmount(receivedStats.amountWeiTotal).replace('<', '')) * vouchDetails.ethUsdRate).toFixed(2)} USD
                  </div>
                )}
              </div>
            </div>
            
            {/* Vertical Divider */}
            <div className="relative">
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-16 w-px bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>
              
              {/* Given Section */}
              <div className="text-center space-y-3 pl-6">
                <div className="relative">
                  <div className="p-3 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-xl backdrop-blur-sm border border-blue-400/20">
                    <div className="text-2xl font-bold text-blue-300 dark:text-blue-400">
                      {givenStats?.count || 0}
                    </div>
                    <div className="text-xs font-semibold text-blue-400/80 dark:text-blue-300/80 uppercase tracking-wider">
                      🤝 Given
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-1">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold text-white dark:text-gray-200">
                      {givenStats?.amountWeiTotal ? formatAmount(givenStats.amountWeiTotal) : '0.000'} ETH
                    </span>
                  </div>
                  {vouchDetails.ethUsdRate && givenStats?.amountWeiTotal && (
                    <div className="text-xs text-blue-400 dark:text-blue-300 font-medium">
                      ${(parseFloat(formatAmount(givenStats.amountWeiTotal).replace('<', '')) * vouchDetails.ethUsdRate).toFixed(2)} USD
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ultra Modern Toggle with Floating Pills */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 rounded-2xl blur-lg"></div>
        
        <div className="relative flex items-center justify-center p-2 bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGiven(false)}
            className={`h-10 px-4 text-sm rounded-xl transition-all duration-500 font-medium ${
              !showGiven 
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-xl shadow-emerald-500/25 scale-105 border border-emerald-400/30' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            💚 Received ({receivedStats?.count || 0})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGiven(true)}
            className={`h-10 px-4 text-sm rounded-xl transition-all duration-500 font-medium ${
              showGiven 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/25 scale-105 border border-blue-400/30' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            🤝 Given ({givenStats?.count || 0})
          </Button>
        </div>
      </div>

      {/* Premium Vouch Details with Enhanced Glassmorphism */}
      <div className="relative">
        {vouchDetails.loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <div className="w-8 h-8 border-3 border-pink-500/30 border-t-pink-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-8 h-8 border-3 border-transparent border-b-purple-500 rounded-full animate-spin animate-reverse"></div>
            </div>
            <span className="ml-3 text-sm text-white/80 dark:text-gray-300 font-medium">Loading vouches...</span>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-400/50 scrollbar-track-transparent">
            {(showGiven ? vouchDetails.given : vouchDetails.received).length === 0 ? (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-400/10 to-gray-600/10 rounded-3xl blur-xl"></div>
                <div className="relative text-center py-8 space-y-4 bg-white/5 dark:bg-black/10 backdrop-blur-lg rounded-2xl border border-white/10">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-300/20 to-gray-500/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <HandHeart className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white/80 dark:text-gray-300 mb-2">
                      {showGiven ? 'No vouches given yet' : 'No vouches received yet'}
                    </div>
                    <div className="text-xs text-white/60 dark:text-gray-500">
                      {showGiven ? 'Start vouching for others to build your giving history' : 'Build your reputation to start receiving vouches'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              (showGiven ? vouchDetails.given : vouchDetails.received).map((vouch, index) => {
                const userInfo = showGiven ? vouch.voucheeInfo : vouch.voucherInfo;
                const displayName = userInfo?.displayName || userInfo?.username || 'Anonymous';
                const userScore = userInfo?.score;
                const ethAmount = parseFloat(vouch.amountEth);
                const usdAmount = vouchDetails.ethUsdRate ? ethAmount * vouchDetails.ethUsdRate : null;
                
                return (
                  <div 
                    key={index} 
                    className="group relative"
                  >
                    {/* Animated background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="relative p-5 backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-2xl border border-white/20 dark:border-white/15 hover:border-white/25 dark:hover:border-white/20 transition-all duration-300 shadow-2xl shadow-black/25 dark:shadow-black/80 hover:shadow-2xl hover:scale-[1.02]">
                      {/* Header with enhanced styling */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${showGiven ? 'bg-blue-400 shadow-lg shadow-blue-400/50' : 'bg-emerald-400 shadow-lg shadow-emerald-400/50'} animate-pulse`}></div>
                          <div className="flex-1">
                            <div className="text-sm font-bold text-white dark:text-gray-100 mb-1">
                              {showGiven ? '🎯 Vouched:' : '✨ From:'} {displayName}
                            </div>
                            {userScore && (
                              <div className="flex items-center space-x-1">
                                <div className="text-xs bg-gradient-to-r from-purple-400/20 to-pink-400/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-400/20">
                                  Trust Score: {userScore}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Enhanced Amount Display */}
                        <div className="text-right">
                          <div className="flex items-center space-x-2 p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl backdrop-blur-sm border border-amber-400/20">
                            <Coins className="w-4 h-4 text-amber-300" />
                            <span className="text-sm font-bold text-amber-200">🪙 {ethAmount.toFixed(3)}</span>
                          </div>
                          {usdAmount && (
                            <div className="text-xs text-white/60 dark:text-gray-400 mt-1">
                              ${usdAmount.toFixed(2)} USD
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Bottom section with enhanced styling */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="text-xs text-white/60 dark:text-gray-400 bg-white/10 px-2 py-1 rounded-lg">
                            📅 {formatTimestamp(vouch.timestamp)}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {vouch.platform && (
                            <div className="px-3 py-1 bg-gradient-to-r from-gray-500/20 to-gray-600/20 rounded-lg text-xs font-medium text-white border border-gray-400/20 backdrop-blur-sm">
                              {vouch.platform === 'x.com' ? '𝕏 Twitter' : vouch.platform}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Enhanced Comment Section */}
                      {vouch.comment && vouch.comment.trim() && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <div className="p-3 bg-white/5 dark:bg-black/10 rounded-xl border border-white/10 backdrop-blur-sm">
                            <div className="text-xs text-white/80 dark:text-gray-300 leading-relaxed">
                              💭 "{vouch.comment.length > 120 ? vouch.comment.slice(0, 120) + '...' : vouch.comment}"
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Enhanced Trust Insights */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-xl"></div>
        <div className="relative p-5 bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl">
          {receivedStats?.count && givenStats?.count ? (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h4 className="text-sm font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
                  🎯 Trust Analytics
                </h4>
                <p className="text-xs text-white/60 dark:text-gray-400">Advanced network insights</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl backdrop-blur-sm border border-purple-400/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-500"></div>
                      <span className="text-xs font-medium text-white/90">Trust Ratio</span>
                    </div>
                  </div>
                  <div className="mt-2 text-lg font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                    {Math.round((receivedStats.count / (givenStats.count + receivedStats.count)) * 100)}%
                  </div>
                  <div className="text-xs text-white/60">received</div>
                </div>
                
                <div className="p-3 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-xl backdrop-blur-sm border border-orange-400/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-400 to-yellow-500"></div>
                      <span className="text-xs font-medium text-white/90">Avg Amount</span>
                    </div>
                  </div>
                  <div className="mt-2 text-lg font-bold bg-gradient-to-r from-orange-300 to-yellow-300 bg-clip-text text-transparent">
                    {formatAmount(((parseFloat((receivedStats.amountWeiTotal || 0).toString()) + parseFloat((givenStats.amountWeiTotal || 0).toString())) / (receivedStats.count + givenStats.count)).toString())}
                  </div>
                  <div className="text-xs text-white/60">ETH per vouch</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="w-12 h-12 mx-auto bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-3">
                <HandHeart className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-sm font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                🚀 Building Trust Network
              </div>
              <div className="text-xs text-white/60 dark:text-gray-400">
                Start vouching to unlock advanced analytics
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}