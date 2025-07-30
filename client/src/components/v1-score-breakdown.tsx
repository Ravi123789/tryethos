import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Zap, Shield, Users, MessageSquare, Award, Coins } from "lucide-react";

interface V1ScoreBreakdownProps {
  userkey: string;
  className?: string;
}

interface V1ApiResponse {
  data: {
    data: {
      score: number;
      elements: { [key: string]: any };
    };
  };
}

export function V1ScoreBreakdown({ userkey, className = "" }: V1ScoreBreakdownProps) {
  const { data: v1Score, isLoading } = useQuery<V1ApiResponse>({
    queryKey: ['/api/v1-score', userkey],
    enabled: !!userkey,
  });

  if (isLoading) {
    return (
      <div className={`bg-gradient-to-br from-white/80 to-white/60 dark:from-zinc-900/80 dark:to-zinc-800/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-zinc-700/30 shadow-xl ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
          <div className="space-y-3">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!v1Score?.data?.data?.elements) {
    return (
      <div className={`bg-gradient-to-br from-white/80 to-white/60 dark:from-zinc-900/80 dark:to-zinc-800/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-zinc-700/30 shadow-xl ${className}`}>
        <div className="text-center py-8">
          <Shield className="w-12 h-12 mx-auto mb-4 text-zinc-400" />
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-2">Score Analysis Unavailable</h3>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">V1 score breakdown not available for this user</p>
        </div>
      </div>
    );
  }

  const elements = v1Score.data.data.elements;
  const totalScore = v1Score.data.data.score;

  const getElementIcon = (name: string) => {
    if (name.includes('Review')) return <MessageSquare className="w-4 h-4" />;
    if (name.includes('Vouch') || name.includes('Ethereum')) return <Coins className="w-4 h-4" />;
    if (name.includes('Social') || name.includes('Twitter')) return <Users className="w-4 h-4" />;
    if (name.includes('Reputation')) return <Award className="w-4 h-4" />;
    return <Zap className="w-4 h-4" />;
  };

  const getElementColor = (weighted: number) => {
    if (weighted > 100) return 'text-green-600 dark:text-green-400';
    if (weighted > 50) return 'text-blue-600 dark:text-blue-400';
    if (weighted > 0) return 'text-yellow-600 dark:text-yellow-400';
    if (weighted < 0) return 'text-red-600 dark:text-red-400';
    return 'text-zinc-600 dark:text-zinc-400';
  };

  const sortedElements = Object.entries(elements)
    .map(([name, element]: [string, any]) => ({ name, element, weighted: element.weighted, raw: element.raw }))
    .sort((a, b) => Math.abs(b.weighted) - Math.abs(a.weighted));

  return (
    <div className={`bg-gradient-to-br from-white/80 to-white/60 dark:from-zinc-900/80 dark:to-zinc-800/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-zinc-700/30 shadow-xl ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">V1 Score Analysis</h3>
        <Badge variant="secondary" className="ml-auto">
          Total: {totalScore}
        </Badge>
      </div>

      {/* Score Elements */}
      <div className="space-y-4">
        {sortedElements.map(({ name, weighted, raw, element }) => {
          const maxRange = element.range?.max || Math.max(100, Math.abs(weighted) * 1.2);
          const percentage = Math.min(100, (Math.abs(weighted) / maxRange) * 100);
          
          return (
            <Card key={name} className="p-4 bg-white/40 dark:bg-zinc-800/40 border-white/20 dark:border-zinc-700/20">
              <div className="flex items-start gap-3">
                <div className={`mt-1 ${getElementColor(weighted)}`}>
                  {getElementIcon(name)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                      {name.replace(' Impact', '').replace(' Penalty', '')}
                    </h4>
                    <div className="flex items-center gap-2">
                      {weighted > 0 ? (
                        <TrendingUp className="w-3 h-3 text-green-500" />
                      ) : weighted < 0 ? (
                        <TrendingDown className="w-3 h-3 text-red-500" />
                      ) : null}
                      <span className={`text-sm font-semibold ${getElementColor(weighted)}`}>
                        {weighted > 0 ? '+' : ''}{weighted}
                      </span>
                    </div>
                  </div>
                  
                  <Progress 
                    value={percentage} 
                    className="h-2 mb-2"
                  />
                  
                  <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                    <span>Raw: {raw}</span>
                    {element.range && (
                      <span>Range: {element.range.min} to {element.range.max}</span>
                    )}
                  </div>
                  
                  {/* Metadata highlights */}
                  {element.metadata && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {element.metadata.positiveReviewCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {element.metadata.positiveReviewCount} reviews
                        </Badge>
                      )}
                      {element.metadata.vouches > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {element.metadata.vouches} vouches
                        </Badge>
                      )}
                      {element.metadata.stakedEth > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {element.metadata.stakedEth.toFixed(4)} ETH
                        </Badge>
                      )}
                      {element.metadata.mutualVouches > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {element.metadata.mutualVouches} mutual
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-white/20 dark:border-zinc-700/20">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Elements</div>
            <div className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
              {Object.keys(elements).length}
            </div>
          </div>
          <div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Active</div>
            <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
              {sortedElements.filter(e => e.weighted !== 0).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}