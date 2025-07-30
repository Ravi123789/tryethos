import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Calculator,
  Users,
  Target,
  Eye,
  Info,
  X
} from "lucide-react";

interface R4RRiskDetailsPopupProps {
  analysis: any;
  trigger?: React.ReactNode;
}

export function R4RRiskDetailsPopup({ analysis, trigger }: R4RRiskDetailsPopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'Moderate': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'High': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const defaultTrigger = (
    <Button 
      variant="outline" 
      size="sm" 
      className="h-9 px-4 text-sm font-semibold border-2 border-red-400/30 text-red-300 hover:bg-red-500/10 hover:border-red-400/50 dark:border-red-600/40 dark:text-red-400 dark:hover:bg-red-500/20 transition-all duration-300 rounded-lg shadow-lg hover:shadow-red-500/20 min-h-[44px]"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(true);
      }}
    >
      <Eye className="h-4 w-4 mr-2" />
      View Details
    </Button>
  );

  if (!analysis?.scoreBreakdown) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto backdrop-blur-2xl bg-white/95 dark:bg-gray-900/95 border-2 border-white/20 shadow-2xl">
        <DialogHeader className="relative">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            High Risk R4R Analysis Details
            <Badge className={`ml-2 px-3 py-1 text-sm font-semibold ${getRiskColor(analysis.riskLevel)}`}>
              {analysis.riskLevel} Risk
            </Badge>
          </DialogTitle>
          {/* Enhanced close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-0 right-0 p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-200 group min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="h-5 w-5 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200" />
          </button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Score Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5" />
                Score Calculation Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    {analysis.r4rScore.toFixed(1)}%
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-400 font-medium">
                    Final R4R Score
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <span className="text-sm font-medium">Base Score (Reciprocal Rate)</span>
                  <div className="text-right">
                    <div className="font-semibold">{analysis.scoreBreakdown.cappedBaseScore}%</div>
                    <div className="text-xs text-muted-foreground">
                      {analysis.scoreBreakdown.baseScoreDescription}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <span className="text-sm font-medium">Volume Multiplier</span>
                  <div className="text-right">
                    <div className="font-semibold">{analysis.scoreBreakdown.volumeMultiplier}x</div>
                    <div className="text-xs text-muted-foreground">
                      {analysis.scoreBreakdown.volumeDescription}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <span className="text-sm font-medium">Account Age Factor</span>
                  <div className="text-right">
                    <div className="font-semibold">{analysis.scoreBreakdown.accountAgeMultiplier}x</div>
                    <div className="text-xs text-muted-foreground">
                      {analysis.scoreBreakdown.accountAgeDescription}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                  <span className="text-sm font-medium">Time Penalty</span>
                  <div className="text-right">
                    <div className="font-semibold text-red-600">+{analysis.scoreBreakdown.timePenalty}</div>
                    <div className="text-xs text-red-500">
                      {analysis.scoreBreakdown.timePenaltyDescription}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                  <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Calculation Flow:</div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {analysis.scoreBreakdown.calculationFlow}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 mt-1">
                    {analysis.scoreBreakdown.finalCalculation}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4" />
                  Review Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Reviews Received</span>
                  <span className="font-semibold">{analysis.totalReviewsReceived}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Reviews Given</span>
                  <span className="font-semibold">{analysis.totalReviewsGiven}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Reciprocal Reviews</span>
                  <span className="font-semibold text-orange-600">{analysis.reciprocalReviews}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Reciprocal Rate</span>
                  <span className="font-semibold text-red-600">{analysis.reciprocalPercentage.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4" />
                  Timing Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Quick Reciprocals (&lt;30min)</span>
                  <span className="font-semibold text-red-600">{analysis.quickReciprocalCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Quick Reciprocal Rate</span>
                  <span className="font-semibold text-red-600">{analysis.quickReciprocalPercentage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Review Frequency</span>
                  <span className="font-semibold">{analysis.reviewFrequency.toFixed(1)}/week</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Avg Time Between Reviews</span>
                  <span className="font-semibold">{analysis.avgTimeBetweenReviews.toFixed(1)}h</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* High R4R Reviewers */}
          {analysis.highR4RReviewers && analysis.highR4RReviewers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-red-500" />
                  High R4R Reviewers (≥70%)
                  <Badge variant="destructive" className="ml-2">
                    {analysis.highR4RReviewers.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {analysis.highR4RReviewers.map((reviewer: any, index: number) => (
                    <div key={reviewer.userkey} className="flex items-center justify-between p-2 rounded border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-semibold">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium">
                          {reviewer.displayName || 'Unknown User'}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-red-600">
                        {reviewer.r4rScore.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4" />
                Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Risk Indicators:</span>
                </div>
                
                <div className="pl-6 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${analysis.reciprocalPercentage > 70 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <span>High reciprocal rate ({analysis.reciprocalPercentage.toFixed(1)}% vs &lt;40% normal)</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${analysis.quickReciprocalPercentage > 30 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <span>Quick reciprocation pattern ({analysis.quickReciprocalPercentage.toFixed(1)}% within 30min)</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${analysis.highR4RReviewers?.length > 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <span>Connected to {analysis.highR4RReviewers?.length || 0} high-risk reviewers</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="text-sm">
                    <span className="font-semibold text-amber-700 dark:text-amber-400">Note:</span>
                    <span className="text-amber-600 dark:text-amber-300 ml-1">
                      R4R behavior involves coordinated mutual positive reviews to artificially inflate reputation scores. 
                      High scores indicate potential gaming of the trust system.
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}