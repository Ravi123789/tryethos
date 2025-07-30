import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Clock, Users, Eye, ChevronRight, Shield, AlertCircle, CheckCircle, TrendingUp, Calendar, Activity } from "lucide-react";
import { useUserProfile } from "@/hooks/use-ethos-api";
import { useR4RAnalysis } from "@/hooks/use-r4r-analysis";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

export function TrustInsights() {
  const { user } = useUserProfile();
  const { data: r4rAnalysis, isLoading, error } = useR4RAnalysis(user?.userkeys?.[0]);
  const [showDetailedView, setShowDetailedView] = useState(false);

  if (!user) return null;

  if (isLoading) {
    return (
      <section className="mb-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">R4R Analysis</h3>
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                <Activity className="h-3 w-3 mr-1 animate-spin" />
                Analyzing...
              </Badge>
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded animate-pulse"></div>
              <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (error || !r4rAnalysis) {
    return (
      <section className="mb-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">R4R Analysis</h3>
              <Badge variant="outline" className="text-red-600 border-red-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                Analysis Failed
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Unable to perform R4R analysis. This could be due to insufficient review data or API limitations.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'Moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'High': return 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800';
      case 'Critical': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'Low': return <CheckCircle className="h-4 w-4" />;
      case 'Moderate': return <AlertCircle className="h-4 w-4" />;
      case 'High': return <AlertTriangle className="h-4 w-4" />;
      case 'Critical': return <Shield className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  if (!showDetailedView) {
    return (
      <section className="mb-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">R4R Analysis</h3>
              <Badge variant="outline" className={getRiskLevelColor(r4rAnalysis.riskLevel)}>
                {getRiskIcon(r4rAnalysis.riskLevel)}
                {r4rAnalysis.riskLevel} Risk
              </Badge>
            </div>
            
            {/* R4R Score */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-2xl font-bold">{r4rAnalysis.r4rScore}%</div>
                  <div className="text-sm text-muted-foreground">R4R Score</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-blue-600 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {r4rAnalysis.reciprocalPercentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Reciprocal Reviews</div>
                </div>
              </div>
              <Progress value={r4rAnalysis.r4rScore} className="h-2" />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-xl font-bold">{r4rAnalysis.reciprocalReviews}</div>
                <div className="text-xs text-muted-foreground">Reciprocal Pairs</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-xl font-bold">{r4rAnalysis.quickReciprocalCount}</div>
                <div className="text-xs text-muted-foreground">Quick Reciprocals</div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  First Review
                </span>
                <span className="font-medium">
                  {formatDistanceToNow(new Date(r4rAnalysis.firstReviewDate), { addSuffix: true })}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center">
                  <Activity className="h-3 w-3 mr-1" />
                  Review Frequency
                </span>
                <span className="font-medium">{r4rAnalysis.reviewFrequency}/week</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  Network Size
                </span>
                <span className="font-medium">{r4rAnalysis.networkConnections.length} connections</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowDetailedView(true)}
            >
              View Detailed Analysis
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mb-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
      <div className="space-y-4">
        {/* Main R4R Score Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                R4R Analysis Report
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowDetailedView(false)}
              >
                Collapse
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Risk Assessment */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="text-2xl font-bold">{r4rAnalysis.r4rScore}%</div>
                <div className="text-sm text-muted-foreground">Overall R4R Score</div>
              </div>
              <Badge className={getRiskLevelColor(r4rAnalysis.riskLevel)}>
                {getRiskIcon(r4rAnalysis.riskLevel)}
                {r4rAnalysis.riskLevel} Risk
              </Badge>
            </div>

            {/* Review Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{r4rAnalysis.totalReviewsReceived}</div>
                <div className="text-xs text-muted-foreground">Reviews Received</div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{r4rAnalysis.totalReviewsGiven}</div>
                <div className="text-xs text-muted-foreground">Reviews Given</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{r4rAnalysis.reciprocalReviews}</div>
                <div className="text-xs text-muted-foreground">Reciprocal Pairs</div>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{r4rAnalysis.quickReciprocalCount}</div>
                <div className="text-xs text-muted-foreground">Quick Reciprocals</div>
              </div>
            </div>


          </CardContent>
        </Card>

        {/* Top Network Connections */}
        {r4rAnalysis.networkConnections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Top Network Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {r4rAnalysis.networkConnections.slice(0, 5).map((connection, index) => (
                  <div key={connection.userkey} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{connection.displayName}</div>
                      <div className="text-sm text-muted-foreground">
                        {connection.reciprocalCount} reciprocal reviews
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant="outline" 
                        className={connection.suspiciousScore > 50 ? 'text-red-600 border-red-300' : 'text-green-600 border-green-300'}
                      >
                        {connection.suspiciousScore.toFixed(0)}% risk
                      </Badge>
                      {connection.avgTimeGap < 30 && (
                        <div className="text-xs text-orange-600 mt-1 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Avg: {connection.avgTimeGap.toFixed(0)}min
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Reciprocal Pairs */}
        {r4rAnalysis.reviewPairs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Reciprocal Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {r4rAnalysis.reviewPairs.slice(0, 3).map((pair, index) => (
                  <div key={`${pair.review1.id}-${pair.review2.id}`} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{pair.user2.displayName}</div>
                      <div className="flex items-center space-x-2">
                        {pair.isQuickReciprocal && (
                          <Badge variant="destructive" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Quick ({pair.review1.timeGap?.toFixed(0)}min)
                          </Badge>
                        )}
                        <Badge 
                          variant="outline"
                          className={pair.suspiciousScore > 50 ? 'text-red-600 border-red-300' : 'text-yellow-600 border-yellow-300'}
                        >
                          {pair.suspiciousScore}% suspicious
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="p-2 bg-muted/50 rounded">
                        <div className="text-xs text-muted-foreground mb-1">Received Review</div>
                        <div className="capitalize">{pair.review1.sentiment}</div>
                        {pair.review1.comment && (
                          <div className="text-xs mt-1 text-muted-foreground">
                            "{pair.review1.comment.slice(0, 50)}..."
                          </div>
                        )}
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <div className="text-xs text-muted-foreground mb-1">Given Review</div>
                        <div className="capitalize">{pair.review2.sentiment}</div>
                        {pair.review2.comment && (
                          <div className="text-xs mt-1 text-muted-foreground">
                            "{pair.review2.comment.slice(0, 50)}..."
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}

// Also export as R4RAnalytics for backward compatibility
export { TrustInsights as R4RAnalytics };
