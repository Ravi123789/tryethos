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
      
      {/* Fixed R4R Score Card with Proper Grid Layout */}
      <div className={`mb-4 p-4 rounded-xl border-2 shadow-lg ${
        r4rAnalysis.r4rScore >= 75 ? 'bg-gradient-to-r from-red-500/25 to-red-600/25 border-red-400/50 shadow-red-500/20' :
        r4rAnalysis.r4rScore >= 50 ? 'bg-gradient-to-r from-orange-500/25 to-yellow-500/25 border-orange-400/50 shadow-orange-500/20' :
        'bg-gradient-to-r from-purple-500/15 to-blue-500/15 border-purple-400/30 shadow-purple-500/10'
      }`}>
        <div className="grid grid-cols-2 gap-4">
          {/* Left Column - R4R Risk Score */}
          <div className="text-center space-y-1">
            <div className={`text-3xl font-bold ${
              r4rAnalysis.r4rScore >= 75 ? 'text-red-200 animate-pulse' :
              r4rAnalysis.r4rScore >= 50 ? 'text-orange-200 animate-pulse' :
              'text-white'
            }`}>
              {r4rAnalysis.r4rScore.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-400">R4R Risk Score</div>
          </div>
          
          {/* Right Column - Reciprocal Rate */}
          <div className="text-center space-y-1">
            <div className={`text-3xl font-bold ${
              r4rAnalysis.reciprocalPercentage >= 75 ? 'text-red-200' :
              r4rAnalysis.reciprocalPercentage >= 50 ? 'text-orange-200' :
              'text-purple-300'
            }`}>
              {r4rAnalysis.reciprocalPercentage.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-400">Reciprocal Rate</div>
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
            displayName: passedUserProfile?.displayName || (userProfile as any)?.displayName || (userStats as any)?.displayName || r4rAnalysis?.displayName,
            username: passedUserProfile?.username || (userProfile as any)?.username || (userStats as any)?.username,
            avatarUrl: passedUserProfile?.avatarUrl || passedUserProfile?.avatar || (userProfile as any)?.avatarUrl || (userStats as any)?.avatarUrl || (userStats as any)?.avatar
          }}
        />
      </div>



      {/* Enhanced Coordinated Activity Warning */}
      {r4rAnalysis.r4rScore >= 50 && (
        <div className={`mb-4 p-4 rounded-xl border-2 shadow-lg ${
          r4rAnalysis.r4rScore >= 75 ? 'bg-red-900/30 border-red-400/60 shadow-red-500/25' :
          'bg-red-900/30 border-orange-400/60 shadow-orange-500/25'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${
              r4rAnalysis.r4rScore >= 75 ? 'bg-red-500/30' : 'bg-orange-500/30'
            }`}>
              <AlertTriangle className={`w-6 h-6 ${
                r4rAnalysis.r4rScore >= 75 ? 'text-red-200' : 'text-orange-200'
              }`} />
            </div>
            <div className="flex-1">
              <div className={`text-base font-bold ${
                r4rAnalysis.r4rScore >= 75 ? 'text-red-200' : 'text-orange-200'
              }`}>
                ⚠️ {r4rAnalysis.r4rScore >= 75 ? 'High Risk: Coordinated Review Activity Detected' : 'Warning: Suspicious Review Patterns'}
              </div>
              <div className="text-sm text-white/70 mt-1">
                {r4rAnalysis.r4rScore >= 75 
                  ? 'Strong indicators of reputation farming behavior' 
                  : 'Elevated mutual review activity detected'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* High R4R Rate Reviewers (Enhanced) */}
      {r4rAnalysis.highR4RReviewers && r4rAnalysis.highR4RReviewers.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-white">High R4R Rate Reviewers (≥70%)</span>
            <span className="bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded-full font-medium">
              {r4rAnalysis.highR4RReviewers.length}
            </span>
          </div>
          {(showAllHighRisk ? r4rAnalysis.highR4RReviewers : r4rAnalysis.highR4RReviewers.slice(0, 3)).map((reviewer, index) => (
            <div key={reviewer.userkey} className="flex items-center justify-between py-3 px-4 rounded-xl bg-red-900/20 border border-red-400/30 mb-2 hover:bg-red-900/30 transition-all duration-200 shadow-lg shadow-red-500/10">
              <div className="text-sm text-white/90 truncate max-w-[120px] font-medium">
                {reviewer.displayName || 'Unknown User'}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-red-200 bg-red-500/20 px-3 py-1 rounded-lg">
                  {reviewer.r4rScore.toFixed(0)}%
                </span>
                <span className="text-sm font-bold text-red-100 bg-red-600/40 px-3 py-1 rounded-full border border-red-400/50">
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
              className="flex items-center gap-1 text-sm text-white/50 hover:text-white/80 cursor-pointer w-full justify-center mt-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              {showAllHighRisk ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  +{r4rAnalysis.highR4RReviewers.length - 3} more high risk
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Enhanced Top Connections Preview */}
      {r4rAnalysis.networkConnections.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="text-sm font-semibold text-white mb-3">Top Network Connections</div>
          {(showAllConnections ? r4rAnalysis.networkConnections : r4rAnalysis.networkConnections.slice(0, 2)).map((connection, index) => (
            <div key={connection.userkey} className={`flex items-center justify-between py-3 px-4 rounded-xl border mb-2 transition-all duration-200 shadow-md ${
              connection.suspiciousScore >= 70 ? 'bg-red-900/15 border-red-400/30 hover:bg-red-900/25 shadow-red-500/10' :
              connection.suspiciousScore >= 40 ? 'bg-orange-900/15 border-orange-400/30 hover:bg-orange-900/25 shadow-orange-500/10' :
              'bg-yellow-900/15 border-yellow-400/30 hover:bg-yellow-900/25 shadow-yellow-500/10'
            }`}>
              <div className="text-sm text-white/90 truncate max-w-[140px] font-medium">
                {connection.displayName || 'Unknown User'}
              </div>
              <div className={`text-base font-black px-3 py-1 rounded-lg ${
                connection.suspiciousScore >= 70 ? 'text-red-200 bg-red-500/20' :
                connection.suspiciousScore >= 40 ? 'text-orange-200 bg-orange-500/20' :
                'text-yellow-200 bg-yellow-500/20'
              }`}>
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
              className="flex items-center gap-1 text-sm text-white/50 hover:text-white/80 cursor-pointer w-full justify-center mt-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              {showAllConnections ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
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