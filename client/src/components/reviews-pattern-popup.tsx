import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  ArrowLeftRight,
  Clock,
  Heart,
  ThumbsDown,
  AlertTriangle,
  TrendingUp,
  X
} from "lucide-react";

interface ReviewsPatternPopupProps {
  analysis: any;
  trigger?: React.ReactNode;
  currentUser?: {
    displayName?: string;
    username?: string;
    avatarUrl?: string;
  };
}

export function ReviewsPatternPopup({ analysis, trigger, currentUser }: ReviewsPatternPopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!analysis) return null;

  const defaultTrigger = (
    <Button 
      variant="outline" 
      size="sm" 
      className="w-full h-7 px-2 text-xs font-medium backdrop-blur-md bg-white/8 border border-white/15 text-white/80 hover:bg-white/15 hover:border-white/25 cursor-pointer transition-all duration-200"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(true);
      }}
    >
      <MessageSquare className="h-3 w-3 mr-1" />
      View Reviews Pattern
    </Button>
  );

  const formatDate = (timestamp: string | number) => {
    try {
      let date: Date;
      
      if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else if (typeof timestamp === 'number') {
        date = timestamp > 1000000000000 ? new Date(timestamp) : new Date(timestamp * 1000);
      } else {
        return 'Unknown';
      }

      if (isNaN(date.getTime())) {
        return 'Unknown';
      }

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h`;
      if (diffHours < 168) return `${Math.floor(diffHours / 24)}d`;
      if (diffHours < 720) return `${Math.floor(diffHours / 168)}w`;
      
      return `${Math.floor(diffHours / 720)}mo`;
    } catch (error) {
      return 'Unknown';
    }
  };

  const formatTimeGap = (minutes: number) => {
    if (minutes === 0 || isNaN(minutes)) return 'instantly';
    if (minutes < 1) return '<1min';
    if (minutes < 60) return `${Math.round(minutes)}min`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
    return `${Math.round(minutes / 1440)}d`;
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'bg-red-500/20 border-red-400/40 text-red-300';
    if (score >= 40) return 'bg-orange-500/20 border-orange-400/40 text-orange-300';
    return 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 70) return 'High Risk';
    if (score >= 40) return 'Medium Risk';
    return 'Low Risk';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden p-0 border-0 bg-transparent [&>button]:hidden">
        <DialogTitle className="sr-only">Review Patterns Analysis</DialogTitle>
        {/* Compact Glassmorphism Container */}
        <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-xl overflow-hidden">
          
          {/* Mobile Optimized Header - Fixed Close Button Layout */}
          <div className="flex justify-between items-start p-4 border-b border-white/10">
            {/* Left Content with Proper Spacing */}
            <div className="flex-1 pr-8">
              {/* Title Row with Risk Badge */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📝</span>
                </div>
                <span className="text-base font-semibold text-white/95">Review Patterns</span>
                <div className="bg-orange-600 px-3 py-1 rounded-full text-sm font-medium text-white">
                  {analysis.r4rScore?.toFixed(0) || 0}% Risk
                </div>
              </div>
              
              {/* Summary Text Below */}
              <div className="text-gray-400 text-sm">
                <span className="text-cyan-300 font-bold">{analysis.allReviews?.length || 0}</span> total reviews
                {analysis.reciprocalReviews > 0 && (
                  <span> • <span className="text-amber-300 font-bold">{analysis.reciprocalReviews}</span> reciprocal</span>
                )}
                {analysis.quickReciprocalCount > 0 && (
                  <span> • <span className="text-orange-300 font-bold">{analysis.quickReciprocalCount}</span> quick</span>
                )}
              </div>
            </div>
            
            {/* Close Button - Properly Positioned */}
            <button 
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-gray-700/50 flex items-center justify-center transition-colors duration-200 flex-shrink-0"
              style={{ minHeight: '44px', minWidth: '44px' }}
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-white stroke-2" />
            </button>
          </div>

          {/* Compact Content */}
          <div className="relative p-4">

            {/* Compact Reviews Display */}
            <div className="space-y-2 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {analysis.allReviews && analysis.allReviews.length > 0 ? (
                analysis.allReviews.map((reviewItem: any, index: number) => {
                  
                  return (
                    <div key={index} className="py-3 border-b border-white/10 last:border-b-0 hover:bg-white/5 rounded-lg px-2 -mx-2 transition-all duration-200 hover:scale-[1.01]">
                      
                      {/* Perfect Mobile Layout */}
                      <div className="flex items-center justify-between w-full gap-3">
                        {/* Left Side - Username + Avatar */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Avatar className="w-6 h-6 border border-white/20 flex-shrink-0">
                            {reviewItem.type === 'received' ? (
                              // Other user gave review to current user
                              <>
                                <AvatarImage 
                                  src={reviewItem.otherUser?.avatarUrl || reviewItem.otherUser?.avatar || reviewItem.otherUser?.image} 
                                  alt={reviewItem.otherUser?.displayName || 'User avatar'}
                                />
                                <AvatarFallback className="bg-emerald-400/20 dark:bg-emerald-500/20 text-emerald-900 dark:text-white text-xs">
                                  {(reviewItem.otherUser?.displayName || reviewItem.otherUser?.username || 'A')[0].toUpperCase()}
                                </AvatarFallback>
                              </>
                            ) : (
                              // Current user gave review to other user
                              <>
                                <AvatarImage 
                                  src={currentUser?.avatarUrl} 
                                  alt="Your avatar"
                                />
                                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400 text-white text-xs font-bold">
                                  You
                                </AvatarFallback>
                              </>
                            )}
                          </Avatar>
                          <span className={`text-sm font-medium truncate max-w-[80px] sm:max-w-[120px] ${
                            reviewItem.type === 'given' 
                              ? 'text-blue-300'
                              : 'text-white/90'
                          }`}>
                            {reviewItem.type === 'received' 
                              ? (reviewItem.otherUser?.displayName || reviewItem.otherUser?.username || 'Anonymous')
                              : 'You'
                            }
                          </span>
                        </div>
                        
                        {/* Center - Arrow + Review Types */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Show sentiment based on review direction */}
                          {reviewItem.type === 'received' ? (
                            // For received reviews: other user → current user
                            <>
                              <span className={`text-sm font-semibold ${
                                reviewItem.review?.sentiment === 'positive' ? 'text-emerald-400' : 'text-red-400'
                              }`}>
                                {reviewItem.review?.sentiment === 'positive' ? 'positive' : 'negative'}
                              </span>
                              
                              {reviewItem.isReciprocal ? (
                                <span className="text-emerald-400 text-sm font-bold px-1">⟷</span>
                              ) : (
                                <span className="text-white/80 text-sm font-bold px-1">→</span>
                              )}
                              
                              {/* Reciprocal review sentiment (your response) */}
                              {reviewItem.reciprocalReview && (
                                <span className={`text-sm font-semibold ${
                                  reviewItem.reciprocalReview?.sentiment === 'positive' ? 'text-emerald-400' : 'text-red-400'
                                }`}>
                                  {reviewItem.reciprocalReview?.sentiment === 'positive' ? 'positive' : 'negative'}
                                </span>
                              )}
                            </>
                          ) : (
                            // For given reviews: current user → other user
                            <>
                              <span className={`text-sm font-semibold ${
                                reviewItem.review?.sentiment === 'positive' ? 'text-emerald-400' : 'text-red-400'
                              }`}>
                                {reviewItem.review?.sentiment === 'positive' ? 'positive' : 'negative'}
                              </span>
                              
                              <span className="text-white/80 text-sm font-bold px-1">→</span>
                            </>
                          )}
                        </div>
                        
                        {/* Right Side - You Badge */}
                        <div className="flex-shrink-0">
                          <span className={`text-sm font-medium px-2 py-1 rounded ${
                            reviewItem.type === 'received' 
                              ? 'text-blue-300 bg-blue-500/20 text-xs font-bold'
                              : 'text-white/90 truncate max-w-[80px] sm:max-w-[120px]'
                          }`}>
                            {reviewItem.type === 'received' 
                              ? 'You'
                              : (reviewItem.otherUser?.displayName || reviewItem.otherUser?.username || 'Anonymous')
                            }
                          </span>
                        </div>
                      </div>

                      {/* Compact Timing information for reciprocal reviews */}
                      {reviewItem.isReciprocal && reviewItem.reciprocalReview && (
                        <div className="mt-2 text-center">
                          <div className="flex items-center justify-center">
                            <span className={`text-sm font-medium px-2 py-1 rounded-md ${
                              reviewItem.reciprocalReview.timeGap && reviewItem.reciprocalReview.timeGap <= 30
                                ? 'text-red-200 bg-red-500/20'
                                : 'text-blue-200 bg-blue-500/20'
                            }`}>
                              📅 {reviewItem.reciprocalReview.timeGap && reviewItem.reciprocalReview.timeGap <= 30 ? 'Quick' : 'Back'} in {formatTimeGap(reviewItem.reciprocalReview.timeGap || 0)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6">
                  <span className="text-2xl">📝</span>
                  <div className="text-sm text-gray-300 mt-2">No reviews found</div>
                </div>
              )}
            </div>

            {/* Enhanced Coordinated Activity Warning */}
            {analysis.r4rScore > 30 && (
              <div className="mt-4 pt-4 border-t border-white/10 text-center">
                <div className={`p-4 rounded-xl border-2 shadow-lg ${
                  analysis.r4rScore >= 70 ? 'bg-red-900/30 border-red-400/60 shadow-red-500/25 animate-pulse' :
                  analysis.r4rScore >= 40 ? 'bg-red-900/30 border-orange-400/60 shadow-orange-500/25 animate-pulse' :
                  'bg-yellow-900/20 border-yellow-400/40 shadow-yellow-500/15'
                }`}>
                  <div className={`text-lg font-black ${
                    analysis.r4rScore >= 70 ? 'text-red-200' :
                    analysis.r4rScore >= 40 ? 'text-orange-200' :
                    'text-yellow-200'
                  }`}>
                    ⚠️ {analysis.r4rScore >= 70 ? 'COORDINATED ACTIVITY DETECTED' :
                     analysis.r4rScore >= 40 ? 'COORDINATED ACTIVITY WARNING' :
                     'MUTUAL REVIEW ACTIVITY'}
                  </div>
                  <div className="text-sm text-white/70 mt-1">
                    {analysis.r4rScore >= 70 ? 'Strong indicators of review farming behavior' :
                     analysis.r4rScore >= 40 ? 'Elevated mutual review activity detected' :
                     'Moderate mutual review patterns observed'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}