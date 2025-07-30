import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Crown, Award, Zap, AlertTriangle, Shield } from "lucide-react";
import { motion } from "framer-motion";

interface NextRankProgressProps {
  currentScore: number;
  className?: string;
}

// Official Ethos Protocol tier system (0-2800 range)
const getTierThresholds = () => [
  { threshold: 2800, tier: 'Exemplary (Max)', icon: Crown, colors: 'from-purple-600 to-purple-400', textColor: 'text-purple-300', nextLabel: 'MAX TIER REACHED' },
  { threshold: 2000, tier: 'Exemplary', icon: Crown, colors: 'from-purple-500 to-purple-300', textColor: 'text-purple-300', nextLabel: 'Exemplary (Max)' },
  { threshold: 1600, tier: 'Reputable', icon: Award, colors: 'from-emerald-500 to-emerald-300', textColor: 'text-emerald-300', nextLabel: 'Exemplary' },
  { threshold: 1200, tier: 'Neutral', icon: Zap, colors: 'from-blue-500 to-blue-300', textColor: 'text-blue-300', nextLabel: 'Reputable' },
  { threshold: 800, tier: 'Questionable', icon: AlertTriangle, colors: 'from-amber-500 to-amber-300', textColor: 'text-amber-300', nextLabel: 'Neutral' },
  { threshold: 0, tier: 'Untrusted', icon: Shield, colors: 'from-gray-500 to-gray-300', textColor: 'text-gray-400', nextLabel: 'Questionable' }
];

export function NextRankProgress({ currentScore, className = '' }: NextRankProgressProps) {
  const [progress, setProgress] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  const tiers = getTierThresholds();
  const currentTierIndex = tiers.findIndex(tier => currentScore >= tier.threshold);
  const currentTier = tiers[currentTierIndex] || tiers[tiers.length - 1];
  const nextTier = currentTierIndex > 0 ? tiers[currentTierIndex - 1] : null;
  
  // Calculate progress towards next tier
  useEffect(() => {
    if (!nextTier) {
      setProgress(100); // Max tier reached
      return;
    }
    
    const currentTierMin = currentTier.threshold;
    const nextTierMin = nextTier.threshold;
    const scoreInCurrentTier = currentScore - currentTierMin;
    const tierRange = nextTierMin - currentTierMin;
    const calculatedProgress = Math.min(100, (scoreInCurrentTier / tierRange) * 100);
    
    setProgress(calculatedProgress);
  }, [currentScore, currentTier, nextTier]);
  
  // Animate progress bar
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 300);
    return () => clearTimeout(timer);
  }, [progress]);
  
  if (!nextTier) {
    // Max tier reached
    return (
      <div className={`backdrop-blur-md bg-white/8 border border-white/15 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center">
            <Crown className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-medium text-white/90">Maximum Tier Achieved</div>
            <div className="text-xs text-white/60">You've reached the highest Ethos Protocol tier</div>
          </div>
        </div>
        
        <div className="relative">
          <Progress 
            value={100} 
            className="h-2 bg-white/10"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full opacity-80" />
        </div>
        
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-purple-300 font-medium">{currentTier.tier}</span>
          <span className="text-white/60">🏆 LEGENDARY STATUS</span>
        </div>
      </div>
    );
  }
  
  const scoreNeeded = nextTier.threshold - currentScore;
  const CurrentIcon = currentTier.icon;
  const NextIcon = nextTier.icon;
  
  return (
    <div className={`backdrop-blur-md bg-white/8 border border-white/15 rounded-xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
            <TrendingUp className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-medium text-white/90">Next Rank</span>
        </div>
        
        <div className="text-xs text-white/60">
          <span className={`${nextTier.textColor} font-medium`}>{scoreNeeded}</span> points needed
        </div>
      </div>
      
      {/* Enhanced Progress Bar with Better Visual Indicators */}
      <div className="relative mb-3">
        <div className="h-4 bg-white/8 rounded-full overflow-hidden border border-white/10">
          <motion.div 
            className={`h-full bg-gradient-to-r ${nextTier.colors} rounded-full relative overflow-hidden`}
            initial={{ width: "0%" }}
            animate={{ width: `${animatedProgress}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            {/* Progress indicator dot */}
            {animatedProgress > 5 && (
              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-lg"></div>
            )}
          </motion.div>
        </div>
        
        {/* Enhanced Glow effect */}
        <motion.div 
          className={`absolute top-0 left-0 h-4 bg-gradient-to-r ${nextTier.colors} rounded-full opacity-40 blur-md -z-10`}
          initial={{ width: "0%" }}
          animate={{ width: `${animatedProgress}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        
        {/* Progress percentage overlay */}
        {animatedProgress > 20 && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            <span className="text-xs font-bold text-white drop-shadow-lg">
              {animatedProgress.toFixed(0)}%
            </span>
          </motion.div>
        )}
      </div>
      
      {/* Tier Information */}
      <div className="flex items-center justify-between">
        {/* Current Tier */}
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${currentTier.colors} flex items-center justify-center`}>
            <CurrentIcon className="w-3 h-3 text-white" />
          </div>
          <div className="text-xs">
            <div className={`${currentTier.textColor} font-medium`}>{currentTier.tier}</div>
            <div className="text-white/50">{currentScore} pts</div>
          </div>
        </div>
        
        {/* Arrow */}
        <div className="flex-1 flex items-center justify-center">
          <motion.div 
            className="text-white/40"
            animate={{ x: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            →
          </motion.div>
        </div>
        
        {/* Next Tier */}
        <div className="flex items-center gap-2">
          <div className="text-xs text-right">
            <div className={`${nextTier.textColor} font-medium`}>{nextTier.tier}</div>
            <div className="text-white/50">{nextTier.threshold} pts</div>
          </div>
          <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${nextTier.colors} flex items-center justify-center opacity-60`}>
            <NextIcon className="w-3 h-3 text-white" />
          </div>
        </div>
      </div>
      
      {/* Progress Percentage */}
      <div className="mt-3 text-center">
        <div className="text-xs text-white/60">
          Progress: <span className={`${nextTier.textColor} font-medium`}>{animatedProgress.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}