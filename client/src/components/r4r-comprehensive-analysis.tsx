import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  TrendingUp,
  Activity,
  Calendar,
  Target,
  Network,
  Shield
} from "lucide-react";
import { useR4RAnalysis, type R4RAnalysis } from "@/hooks/use-r4r-analysis";
import { R4RRiskDetailsPopup } from "@/components/r4r-risk-details-popup";
import { formatTimeGap } from "@/lib/number-utils";
import { useState } from "react";

interface R4RComprehensiveAnalysisProps {
  userkey: string;
}

export function R4RComprehensiveAnalysis({ userkey }: R4RComprehensiveAnalysisProps) {
  const { data: analysis, isLoading, error } = useR4RAnalysis(userkey);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              R4R Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-muted-foreground">Analyzing review patterns...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            R4R Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : 'Unable to load R4R analysis'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low': return 'text-green-600';
      case 'Moderate': return 'text-yellow-600';
      case 'High': return 'text-orange-600';
      case 'Critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low': return 'default';
      case 'Moderate': return 'secondary';
      case 'High': return 'destructive';
      case 'Critical': return 'destructive';
      default: return 'outline';
    }
  };



  return (
    <div className="space-y-6">
      {/* Risk Overview */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              R4R Risk Assessment
            </div>
            <Badge variant={getRiskBadgeVariant(analysis.riskLevel)} className="text-sm">
              {analysis.riskLevel} Risk
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{analysis.r4rScore.toFixed(1)}%</span>
            <span className={`text-lg font-semibold ${getRiskColor(analysis.riskLevel)}`}>
              {analysis.riskLevel} Risk
            </span>
          </div>
          
          <Progress value={analysis.r4rScore} className="h-3" />
          
          <div className="text-sm text-muted-foreground">
            R4R Score calculated using advanced pattern detection algorithm
          </div>

          {analysis.r4rScore >= 70 && (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-300">
                <div className="flex items-center justify-between">
                  <span>High R4R score indicates potential reputation farming behavior</span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <R4RRiskDetailsPopup analysis={analysis} />
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-lg font-semibold">{analysis.reciprocalReviews}</div>
                <div className="text-xs text-muted-foreground">Reciprocal Reviews</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Target className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="text-lg font-semibold">{analysis.reciprocalPercentage.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Reciprocal Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <div className="text-lg font-semibold">{analysis.quickReciprocalCount}</div>
                <div className="text-xs text-muted-foreground">Quick Reciprocals</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Activity className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-lg font-semibold">{analysis.reviewFrequency.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Reviews/Week</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Review Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Review Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Reviews Received</span>
                <span className="font-semibold">{analysis.totalReviewsReceived}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Reviews Given</span>
                <span className="font-semibold">{analysis.totalReviewsGiven}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Reciprocal Reviews</span>
                <span className="font-semibold text-orange-600">{analysis.reciprocalReviews}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Quick Reciprocals (&lt;30min)</span>
                <span className="font-semibold text-red-600">{analysis.quickReciprocalCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>


      </div>

      {/* High R4R Rate Reviewers (matches ethos-r4r.deno.dev) */}
      {analysis.highR4RReviewers && analysis.highR4RReviewers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                High R4R Rate Reviewers (≥70%)
                <Badge variant="destructive" className="ml-2">
                  {analysis.highR4RReviewers.length}
                </Badge>
              </div>
              <R4RRiskDetailsPopup analysis={analysis} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.highR4RReviewers.map((reviewer: any, index: number) => (
                <div key={reviewer.userkey} className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center text-white text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {reviewer.displayName || 'Unknown User'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {reviewer.riskLevel} Risk Level
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-red-600">
                      {reviewer.r4rScore.toFixed(1)}%
                    </div>
                    <div className="text-xs text-red-500">R4R Score</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Reciprocal Connections */}
      {analysis.networkConnections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top Reciprocal Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.networkConnections.slice(0, 5).map((connection, index) => (
                <div key={connection.userkey} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {connection.displayName || 'Unknown User'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {connection.reciprocalCount} reciprocal, avg {formatTimeGap(connection.avgTimeGap)} gap
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${connection.suspiciousScore > 50 ? 'text-red-600' : 'text-orange-600'}`}>
                      {connection.suspiciousScore.toFixed(0)}% 
                    </div>
                    <div className="text-xs text-muted-foreground">suspicious</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Pairs (Most Suspicious) */}
      {analysis.reviewPairs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Most Suspicious Review Pairs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.reviewPairs.slice(0, 3).map((pair, index) => (
                <div key={`${pair.review1.id}-${pair.review2.id}`} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={pair.isQuickReciprocal ? "destructive" : "secondary"}>
                        {pair.isQuickReciprocal ? "Quick Reciprocal" : "Reciprocal"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {pair.review1.timeGap ? formatTimeGap(pair.review1.timeGap) : 'N/A'} gap
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-red-600">
                      {pair.suspiciousScore.toFixed(0)}% suspicious
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="font-medium">{pair.user2.displayName || 'Unknown'}</div>
                      <div className="text-muted-foreground">→ {analysis.displayName}</div>
                      <div className="text-xs bg-gray-100 dark:bg-gray-800 rounded p-2">
                        "{pair.review1.comment || 'No comment'}"
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium">{analysis.displayName}</div>
                      <div className="text-muted-foreground">→ {pair.user2.displayName || 'Unknown'}</div>
                      <div className="text-xs bg-gray-100 dark:bg-gray-800 rounded p-2">
                        "{pair.review2.comment || 'No comment'}"
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Review Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>First Review</span>
            <span className="font-medium">
              {new Date(analysis.firstReviewDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Last Review</span>
            <span className="font-medium">
              {new Date(analysis.lastReviewDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Review Frequency</span>
            <span className="font-medium">{analysis.reviewFrequency.toFixed(1)} per week</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Avg Time Between Reviews</span>
            <span className="font-medium">{analysis.avgTimeBetweenReviews.toFixed(1)} hours</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}