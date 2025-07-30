import { Network, Shield, AlertTriangle, CheckCircle, Clock, Users, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { useR4RAnalysis } from "@/hooks/use-r4r-analysis";
import { ReviewsPatternPopup } from "./reviews-pattern-popup";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface R4RDataSectionProps {
  userkey: string | undefined;
  userProfile?: {
    displayName?: string;
    username?: string;
    avatarUrl?: string;
    avatar?: string;
  };
}

export function R4RDataSection({ userkey, userProfile: passedUserProfile }: R4RDataSectionProps) {
  const { data: r4rAnalysis, isLoading, error } = useR4RAnalysis(userkey);
  const [showAllHighRisk, setShowAllHighRisk] = useState(false);
  const [showAllConnections, setShowAllConnections] = useState(false);

  // Get current user profile for avatar display in popup
  const { data: userProfile } = useQuery({
    queryKey: ['/api/enhanced-profile', userkey],
    enabled: !!userkey,
  });

  // Also try getting user stats as fallback for avatar
  const { data: userStats } = useQuery({
    queryKey: ['/api/user-stats', userkey],
    enabled: !!userkey,
  });

  if (isLoading) {
    return (
      <div className="backdrop-blur-md bg-white/8 border border-white/15 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Network className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-white/70 font-medium">R4R Analysis</span>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
          <span className="ml-3 text-white/70">Analyzing review patterns...</span>
        </div>
      </div>
    );
  }

  if (error || !r4rAnalysis) {
    return (
      <div className="backdrop-blur-md bg-white/8 border border-white/15 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Network className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-white/70 font-medium">R4R Analysis</span>
        </div>
        <div className="text-center py-4">
          <AlertTriangle className="w-8 h-8 text-orange-400 mx-auto mb-2" />
          <div className="text-sm text-white/50">Analysis unavailable</div>
          <div className="text-xs text-white/30 mt-1">Insufficient review data</div>
        </div>
      </div>
    );
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low': return 'text-green-300';
      case 'Moderate': return 'text-yellow-300';
      case 'High': return 'text-orange-300';
      case 'Critical': return 'text-red-300';
      default: return 'text-gray-300';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low': return <CheckCircle className="w-4 h-4" />;
      case 'Moderate': return <Clock className="w-4 h-4" />;
      case 'High': return <AlertTriangle className="w-4 h-4" />;
      case 'Critical': return <Shield className="w-4 h-4" />;
      default: return <Network className="w-4 h-4" />;
    }
  };

  return (
    <div className="backdrop-blur-md bg-white/8 border border-white/15 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-white/70 font-medium">R4R Analysis</span>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 ${getRiskColor(r4rAnalysis.riskLevel)}`}>
          {getRiskIcon(r4rAnalysis.riskLevel)}
          <span className="text-xs font-medium">{r4rAnalysis.riskLevel}</span>
        </div>
      </div>
      
      {/* R4R Score */}
      <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-400/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-white">{r4rAnalysis.r4rScore.toFixed(1)}%</div>
            <div className="text-xs text-white/60">R4R Risk Score</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-purple-300 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              {r4rAnalysis.reciprocalPercentage.toFixed(1)}%
            </div>
            <div className="text-xs text-white/60">Reciprocal Rate</div>
          </div>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="text-xl font-bold text-blue-300">{r4rAnalysis.reciprocalReviews}</div>
          <div className="text-xs text-white/60">Reciprocal Pairs</div>
        </div>
        
        <div className="text-center p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="text-xl font-bold text-orange-300">{r4rAnalysis.quickReciprocalCount}</div>
          <div className="text-xs text-white/60">Quick Reciprocals</div>
        </div>
      </div>

      {/* Review Stats */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Reviews Received</span>
          <span className="text-white font-medium">{r4rAnalysis.totalReviewsReceived}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Reviews Given</span>
          <span className="text-white font-medium">{r4rAnalysis.totalReviewsGiven}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Network Connections</span>
          <span className="text-white font-medium">{r4rAnalysis.networkConnections.length}</span>
        </div>
      </div>

      {/* Reviews Pattern Analysis Button */}
      <div className="mb-4">
        <ReviewsPatternPopup 
          analysis={r4rAnalysis} 
          currentUser={{
            displayName: passedUserProfile?.displayName || userProfile?.displayName || userStats?.displayName || r4rAnalysis?.displayName,
            username: passedUserProfile?.username || userProfile?.username || userStats?.username,
            avatarUrl: passedUserProfile?.avatarUrl || passedUserProfile?.avatar || userProfile?.avatarUrl || userStats?.avatarUrl || userStats?.avatar
          }}
        />
      </div>



      {/* High R4R Rate Reviewers (matches ethos-r4r.deno.dev) */}
      {r4rAnalysis.highR4RReviewers && r4rAnalysis.highR4RReviewers.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span className="text-xs text-white/50">High R4R Rate Reviewers (≥70%)</span>
            <span className="bg-red-500/20 text-red-300 text-xs px-1.5 py-0.5 rounded-full">
              {r4rAnalysis.highR4RReviewers.length}
            </span>
          </div>
          {(showAllHighRisk ? r4rAnalysis.highR4RReviewers : r4rAnalysis.highR4RReviewers.slice(0, 3)).map((reviewer, index) => (
            <div key={reviewer.userkey} className="flex items-center justify-between py-1.5 px-2 rounded bg-red-500/5 border border-red-400/10 mb-1">
              <div className="text-xs text-white/70 truncate max-w-[100px]">
                {reviewer.displayName || 'Unknown User'}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-red-300">
                  {reviewer.r4rScore.toFixed(0)}%
                </span>
                <span className="text-xs text-red-400">
                  {reviewer.riskLevel}
                </span>
              </div>
            </div>
          ))}
          {r4rAnalysis.highR4RReviewers.length > 3 && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAllHighRisk(!showAllHighRisk);
              }}
              className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 cursor-pointer w-full justify-center mt-1 py-1 rounded transition-colors"
            >
              {showAllHighRisk ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  +{r4rAnalysis.highR4RReviewers.length - 3} more high risk
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Top Connections Preview */}
      {r4rAnalysis.networkConnections.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="text-xs text-white/50 mb-2">Top Network Connections</div>
          {(showAllConnections ? r4rAnalysis.networkConnections : r4rAnalysis.networkConnections.slice(0, 2)).map((connection, index) => (
            <div key={connection.userkey} className="flex items-center justify-between py-1">
              <div className="text-xs text-white/70 truncate max-w-[120px]">
                {connection.displayName || 'Unknown User'}
              </div>
              <div className="text-xs text-orange-300">
                {connection.suspiciousScore.toFixed(0)}% risk
              </div>
            </div>
          ))}
          {r4rAnalysis.networkConnections.length > 2 && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAllConnections(!showAllConnections);
              }}
              className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 cursor-pointer w-full justify-center mt-1 py-1 rounded transition-colors"
            >
              {showAllConnections ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  +{r4rAnalysis.networkConnections.length - 2} more connections
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}