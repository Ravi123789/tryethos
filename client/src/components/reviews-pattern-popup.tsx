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
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden p-0 border-0 bg-transparent">
        <DialogTitle className="sr-only">Review Patterns Analysis</DialogTitle>
        {/* Compact Glassmorphism Container */}
        <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-xl overflow-hidden">
          
          {/* Compact Header */}
          <div className="relative p-4 pb-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📝</span>
                </div>
                <span className="text-base font-semibold text-white/95">Review Patterns</span>
              </div>
              
              <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold backdrop-blur-sm border ${getRiskColor(analysis.r4rScore || 0)}`}>
                {analysis.r4rScore?.toFixed(0) || 0}% {getRiskLabel(analysis.r4rScore || 0)}
              </div>
            </div>
          </div>

          {/* Compact Content */}
          <div className="relative p-4">
            {/* Compact Summary */}
            <div className="mb-4 text-center">
              <div className="text-sm text-white/85 font-medium">
                <span className="text-cyan-300 font-bold text-lg">{analysis.allReviews?.length || 0}</span> total reviews
                {analysis.reciprocalReviews > 0 && (
                  <span className="text-amber-300"> • <span className="font-bold">{analysis.reciprocalReviews}</span> reciprocal</span>
                )}
                {analysis.quickReciprocalCount > 0 && (
                  <span className="text-orange-300"> • <span className="font-bold">{analysis.quickReciprocalCount}</span> quick</span>
                )}
              </div>
            </div>

            {/* Compact Reviews Display */}
            <div className="space-y-2 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {analysis.allReviews && analysis.allReviews.length > 0 ? (
                analysis.allReviews.map((reviewItem: any, index: number) => {
                  
                  return (
                    <div key={index} className="py-3 border-b border-white/10 last:border-b-0 hover:bg-white/5 transition-colors duration-200">
                      
                      {/* Compact Review Layout */}
                      <div className="flex items-center justify-between gap-3">
                        {/* Left User - Shows who gave the review */}
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
                          <span className={`text-sm font-medium ${
                            reviewItem.type === 'given' 
                              ? 'text-blue-300 bg-blue-500/20 px-2 py-1 rounded text-xs font-bold'
                              : 'text-white/90'
                          }`}>
                            {reviewItem.type === 'received' 
                              ? (reviewItem.otherUser?.displayName || reviewItem.otherUser?.username || 'Anonymous')
                              : 'You'
                            }
                          </span>
                        </div>
                        
                        {/* Simple Center Section */}
                        <div className="flex items-center gap-2 flex-shrink-0">
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
                                <span className="text-orange-300 text-xl font-bold px-1">⇄</span>
                              ) : (
                                <span className="text-white/80 text-xl font-bold px-1">→</span>
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
                              
                              <span className="text-white/80 text-xl font-bold">→</span>
                            </>
                          )}
                        </div>
                        
                        {/* Right User - Shows who received the review */}
                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                          <span className={`text-sm text-right font-medium max-w-[100px] overflow-hidden whitespace-nowrap text-ellipsis ${
                            reviewItem.type === 'received' 
                              ? 'text-blue-300 bg-blue-500/20 px-2 py-1 rounded text-xs font-bold'
                              : 'text-white/90'
                          }`}>
                            {reviewItem.type === 'received' 
                              ? 'You'
                              : (reviewItem.otherUser?.displayName || reviewItem.otherUser?.username || 'Anonymous')
                            }
                          </span>
                          <Avatar className="w-6 h-6 border border-white/20 flex-shrink-0">
                            {reviewItem.type === 'received' ? (
                              // Current user received the review
                              <>
                                <AvatarImage 
                                  src={currentUser?.avatarUrl} 
                                  alt="Your avatar"
                                />
                                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400 text-white text-xs font-bold">
                                  You
                                </AvatarFallback>
                              </>
                            ) : (
                              // Other user received the review
                              <>
                                <AvatarImage 
                                  src={reviewItem.otherUser?.avatarUrl || reviewItem.otherUser?.avatar || reviewItem.otherUser?.image} 
                                  alt={reviewItem.otherUser?.displayName || 'User avatar'}
                                />
                                <AvatarFallback className="bg-emerald-500/20 text-white text-xs">
                                  {(reviewItem.otherUser?.displayName || reviewItem.otherUser?.username || 'A')[0].toUpperCase()}
                                </AvatarFallback>
                              </>
                            )}
                          </Avatar>
                        </div>
                      </div>

                      {/* Compact Timing information for reciprocal reviews */}
                      {reviewItem.isReciprocal && reviewItem.reciprocalReview && (
                        <div className="mt-2 text-center">
                          <span className={`text-sm font-medium ${
                            reviewItem.reciprocalReview.timeGap && reviewItem.reciprocalReview.timeGap <= 30
                              ? 'text-red-300'
                              : 'text-blue-300'
                          }`}>
                            {reviewItem.reciprocalReview.timeGap && reviewItem.reciprocalReview.timeGap <= 30 ? '🚨 Quick' : '↩️ Back'} in {formatTimeGap(reviewItem.reciprocalReview.timeGap || 0)}
                          </span>
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

            {/* Simple Bottom Analysis */}
            {analysis.r4rScore > 30 && (
              <div className="mt-4 pt-3 border-t border-white/10 text-center">
                <div className={`text-sm font-semibold ${
                  analysis.r4rScore >= 70 ? 'text-red-400' :
                  analysis.r4rScore >= 40 ? 'text-orange-400' :
                  'text-yellow-400'
                }`}>
                  {analysis.r4rScore >= 70 ? '🚨 Review farming detected' :
                   analysis.r4rScore >= 40 ? '⚠️ Coordinated review activity' :
                   '📊 Mutual review activity'}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}