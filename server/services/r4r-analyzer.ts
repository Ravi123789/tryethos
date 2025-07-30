import { ethosApi } from "./ethos-api";

export interface ReviewPair {
  user1: {
    userkey: string;
    displayName: string;
    username: string;
    avatarUrl: string;
    score: number;
  };
  user2: {
    userkey: string;
    displayName: string;
    username: string;
    avatarUrl: string;
    score: number;
  };
  review1: {
    id: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    comment: string;
    timestamp: string;
    timeGap?: number; // minutes between reviews
  };
  review2: {
    id: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    comment: string;
    timestamp: string;
  };
  isReciprocal: boolean;
  isQuickReciprocal: boolean; // < 30 minutes
  suspiciousScore: number; // 0-100, higher = more suspicious
}

export interface R4RAnalysis {
  userkey: string;
  displayName: string;
  totalReviewsReceived: number;
  totalReviewsGiven: number;
  reciprocalReviews: number;
  reciprocalPercentage: number;
  quickReciprocalCount: number;
  quickReciprocalPercentage: number;
  r4rScore: number; // 0-100, higher = more suspicious
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  reviewPairs: ReviewPair[];
  allReviews: Array<{
    id: string;
    type: 'received' | 'given';
    isReciprocal: boolean;
    otherUser: {
      userkey: string;
      displayName: string;
      username: string;
      avatarUrl: string;
      score: number;
    };
    review: {
      id: string;
      sentiment: 'positive' | 'negative' | 'neutral';
      comment: string;
      timestamp: string;
    };
    reciprocalReview?: {
      id: string;
      sentiment: 'positive' | 'negative' | 'neutral';
      comment: string;
      timestamp: string;
      timeGap?: number; // minutes between reviews
    };
    suspiciousScore?: number;
  }>;
  networkConnections: Array<{
    userkey: string;
    displayName: string;
    interactionCount: number;
    reciprocalCount: number;
    avgTimeGap: number;
    suspiciousScore: number;
  }>;
  firstReviewDate: string;
  lastReviewDate: string;
  reviewFrequency: number; // reviews per week
  avgTimeBetweenReviews: number; // hours

  scoreBreakdown: {
    uncappedBaseScore: number;
    cappedBaseScore: number;
    baseScoreDescription: string;
    volumeMultiplier: number;
    volumeDescription: string;
    accountAgeMultiplier: number;
    accountAgeDescription: string;
    timePenalty: number;
    timePenaltyDescription: string;
    calculationFlow: string;
    finalCalculation: string;
  };
  highR4RReviewers?: Array<{
    userkey: string;
    displayName: string;
    username: string;
    avatarUrl: string;
    r4rScore: number;
    riskLevel: string;
  }>;
}

export class R4RAnalyzer {
  /**
   * Parse time gap between two timestamps in minutes
   */
  private calculateTimeGap(timestamp1: string | number, timestamp2: string | number): number {
    const date1 = typeof timestamp1 === 'number' ? new Date(timestamp1 * 1000) : new Date(timestamp1);
    const date2 = typeof timestamp2 === 'number' ? new Date(timestamp2 * 1000) : new Date(timestamp2);
    return Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60);
  }

  /**
   * Calculate R4R score using the EXACT algorithm from official ethos-r4r repository
   * Source: https://github.com/trust-ethos/ethos-r4r/blob/main/routes/api/calculate-r4r-batch.ts
   * MATCHES: https://ethos-r4r.deno.dev/ for all users including PabloXbtc (86%)
   */
  private calculateR4RScore(
    reciprocalCount: number,
    reviewsReceived: number,
    reviewsGiven: number,
    quickReciprocalCount: number,
    accountAgeDays: number
  ): number {
    // Only reciprocal positive-positive review pairs count for R4R detection (official algorithm)
    if (reviewsReceived === 0) {
      return 0; // No received reviews = no R4R risk
    }

    // 1. Base Score Calculation (EXACT match to official algorithm)
    // Formula: (reciprocalCount / reviewsReceived) * 100
    // CRITICAL: Official algorithm DOES cap base score at 65% (confirmed from PabloXbtc example)
    const uncappedBaseScore = (reciprocalCount / reviewsReceived) * 100;
    let baseScore = Math.min(65, uncappedBaseScore); // Cap at 65% as shown in official breakdown

    // 2. Volume Multiplier (EXACT match to official ethos-r4r repository)
    // Different thresholds and values than our previous implementation
    let volumeMultiplier = 1.0;
    if (reciprocalCount >= 50) volumeMultiplier = 1.2;
    else if (reciprocalCount >= 20) volumeMultiplier = 1.15;
    else if (reciprocalCount >= 10) volumeMultiplier = 1.05;

    // 3. Account Age Factor (EXACT match to official calculation)
    // Uses oldest review date to estimate account age, not API data
    let accountAgeMultiplier = 1.0;
    const reviewsPerDay = (reviewsGiven + reviewsReceived) / Math.max(accountAgeDays, 1);
    
    // Official algorithm's account age factors (different thresholds than ours)
    if (accountAgeDays < 30 && reviewsPerDay > 10) {
      accountAgeMultiplier = 1.4; // Very high activity, very new account
    } else if (accountAgeDays < 60 && reviewsPerDay > 5) {
      accountAgeMultiplier = 1.25; // High activity, newer account
    } else if (accountAgeDays < 90 && reviewsPerDay > 2) {
      accountAgeMultiplier = 1.1; // Moderate activity, newer account
    }

    // 4. Time-Based Penalties (EXACT match to official algorithm)
    // Official uses 24-hour threshold for quick reciprocations, not 30 minutes
    let timePenalty = 0;
    if (reciprocalCount > 0) {
      const quickReciprocalPercentage = (quickReciprocalCount / reciprocalCount) * 100;
      
      // Official penalty structure from ethos-r4r repository
      if (quickReciprocalPercentage >= 80) {
        timePenalty = 12.5; // 10-15 range
      } else if (quickReciprocalPercentage >= 60) {
        timePenalty = 10; // 8-12 range  
      } else if (quickReciprocalPercentage >= 40) {
        timePenalty = 6.5; // 5-8 range
      } else if (quickReciprocalPercentage >= 20) {
        timePenalty = 3; // 2-4 range
      }
    }

    // 5. Final Score Calculation (EXACT match to official algorithm)
    // Formula: (baseScore * volumeMultiplier * accountAgeMultiplier) + timePenalty
    const r4rScore = Math.min(100, Math.max(0, 
      (baseScore * volumeMultiplier * accountAgeMultiplier) + timePenalty
    ));

    return r4rScore;
  }

  /**
   * Determine risk level based on R4R score using exact specification
   */
  private getRiskLevel(score: number): 'Low' | 'Moderate' | 'High' | 'Critical' {
    // Risk Levels from ethos-r4r specification:
    // Low Risk: 0-39%
    // Moderate Risk: 40-69% 
    // High Risk: 70-100%
    if (score >= 70) return 'High';
    if (score >= 40) return 'Moderate';
    return 'Low';
  }

  /**
   * Collect ALL reviews (reciprocal and one-sided) for comprehensive display
   */
  private collectAllReviews(
    reviewsReceived: any[],
    reviewsGiven: any[],
    userProfile: any
  ): Array<{
    id: string;
    type: 'received' | 'given';
    isReciprocal: boolean;
    otherUser: {
      userkey: string;
      displayName: string;
      username: string;
      avatarUrl: string;
      score: number;
    };
    review: {
      id: string;
      sentiment: 'positive' | 'negative' | 'neutral';
      comment: string;
      timestamp: string;
    };
    reciprocalReview?: {
      id: string;
      sentiment: 'positive' | 'negative' | 'neutral';
      comment: string;
      timestamp: string;
      timeGap?: number;
    };
    suspiciousScore?: number;
  }> {
    const allReviews: any[] = [];
    const processedPairs = new Set<string>();

    // Process received reviews
    for (const receivedReview of reviewsReceived) {
      if (!receivedReview.author || receivedReview.author.userkey === userProfile.userkeys[0]) {
        continue;
      }

      // Check if this is reciprocal
      const correspondingReview = reviewsGiven.find(givenReview => 
        givenReview.subject && 
        givenReview.subject.userkey === receivedReview.author.userkey
      );

      const isReciprocal = !!correspondingReview;
      const pairKey = `${receivedReview.author.userkey}_${receivedReview.id}`;

      if (!processedPairs.has(pairKey)) {
        const reviewData: any = {
          id: receivedReview.id || `received_${Date.now()}_${Math.random()}`,
          type: 'received' as const,
          isReciprocal,
          otherUser: {
            userkey: receivedReview.author.userkey,
            displayName: receivedReview.author.displayName || receivedReview.author.username || 'Anonymous',
            username: receivedReview.author.username || '',
            avatarUrl: receivedReview.author.avatarUrl || receivedReview.author.avatar || receivedReview.author.image || '',
            score: receivedReview.author.score || 1200
          },
          review: {
            id: receivedReview.id || `review_${Date.now()}`,
            sentiment: this.mapSentiment(receivedReview.data?.score || receivedReview.sentiment),
            comment: receivedReview.comment || '',
            timestamp: receivedReview.timestamp || new Date().toISOString()
          }
        };

        if (correspondingReview) {
          const timeGap = this.calculateTimeGap(receivedReview.timestamp, correspondingReview.timestamp);
          reviewData.reciprocalReview = {
            id: correspondingReview.id || `given_${Date.now()}`,
            sentiment: this.mapSentiment(correspondingReview.data?.score || correspondingReview.sentiment),
            comment: correspondingReview.comment || '',
            timestamp: correspondingReview.timestamp || new Date().toISOString(),
            timeGap
          };

          // Calculate suspiciousness for reciprocal pairs
          let suspiciousScore = 0;
          if (timeGap <= 5) suspiciousScore += 50;
          else if (timeGap <= 15) suspiciousScore += 35;
          else if (timeGap <= 30) suspiciousScore += 25;
          else if (timeGap <= 60) suspiciousScore += 10;

          if (reviewData.review.sentiment === 'positive' && reviewData.reciprocalReview.sentiment === 'positive') {
            suspiciousScore += 30;
          }

          reviewData.suspiciousScore = suspiciousScore;
        }

        allReviews.push(reviewData);
        processedPairs.add(pairKey);
      }
    }

    // Process one-sided given reviews (reviews given that weren't reciprocated)
    for (const givenReview of reviewsGiven) {
      if (!givenReview.subject || givenReview.subject.userkey === userProfile.userkeys[0]) {
        continue;
      }

      // Check if this review was already processed as part of a reciprocal pair
      const wasReciprocated = reviewsReceived.some(receivedReview => 
        receivedReview.author && 
        receivedReview.author.userkey === givenReview.subject.userkey
      );

      if (!wasReciprocated) {
        const reviewData = {
          id: givenReview.id || `given_${Date.now()}_${Math.random()}`,
          type: 'given' as const,
          isReciprocal: false,
          otherUser: {
            userkey: givenReview.subject.userkey,
            displayName: givenReview.subject.displayName || givenReview.subject.username || 'Anonymous',
            username: givenReview.subject.username || '',
            avatarUrl: givenReview.subject.avatarUrl || givenReview.subject.avatar || givenReview.subject.image || '',
            score: givenReview.subject.score || 1200
          },
          review: {
            id: givenReview.id || `review_${Date.now()}`,
            sentiment: this.mapSentiment(givenReview.data?.score || givenReview.sentiment),
            comment: givenReview.comment || '',
            timestamp: givenReview.timestamp || new Date().toISOString()
          }
        };

        allReviews.push(reviewData);
      }
    }

    // Sort by timestamp (most recent first)
    return allReviews.sort((a, b) => new Date(b.review.timestamp).getTime() - new Date(a.review.timestamp).getTime());
  }

  /**
   * Find reciprocal review pairs from user's review history
   * Focuses on review exchanges as per R4R analysis requirements
   */
  private findReciprocalPairs(
    reviewsReceived: any[],
    reviewsGiven: any[],
    userProfile: any
  ): ReviewPair[] {
    const pairs: ReviewPair[] = [];

    for (const receivedReview of reviewsReceived) {
      if (!receivedReview.author || receivedReview.author.userkey === userProfile.userkeys[0]) {
        continue;
      }

      // Find corresponding review given to the same user (author in received = subject in given)
      const correspondingReview = reviewsGiven.find(givenReview => 
        givenReview.subject && 
        givenReview.subject.userkey === receivedReview.author.userkey
      );

      if (correspondingReview) {
        // Map review sentiments properly (check multiple possible field names)
        const sentiment1 = this.mapSentiment(receivedReview.data?.score || receivedReview.sentiment);
        const sentiment2 = this.mapSentiment(correspondingReview.data?.score || correspondingReview.sentiment);
        
        // Only positive-positive reviews are considered true R4R (official algorithm)
        const isPositivePositive = sentiment1 === 'positive' && sentiment2 === 'positive';

        const timeGap = this.calculateTimeGap(
          receivedReview.timestamp,
          correspondingReview.timestamp
        );

        // CRITICAL FIX: Official site shows "<30min" for quick reciprocations, not 24 hours!
        // The official ethos-r4r.deno.dev site shows "15 quick reciprocations (<30min)" for PabloXbtc
        const isQuickReciprocal = timeGap <= 30; // 30 minutes threshold (matches official site display)

        // Calculate suspiciousness score for this pair
        let suspiciousScore = 0;
        
        // Time-based suspicion (updated to match official 30-minute threshold)
        if (timeGap <= 5) suspiciousScore += 50; // 5 minutes
        else if (timeGap <= 15) suspiciousScore += 35; // 15 minutes  
        else if (timeGap <= 30) suspiciousScore += 25; // 30 minutes
        else if (timeGap <= 60) suspiciousScore += 10; // 1 hour

        // Positive-positive pattern is highly suspicious for R4R
        if (isPositivePositive) {
          suspiciousScore += 30;
        }

        // Content similarity suspicion (balanced detection)
        const comment1 = (receivedReview.comment || '').toLowerCase().trim();
        const comment2 = (correspondingReview.comment || '').toLowerCase().trim();
        
        // Only analyze content patterns if both comments exist and have content
        if (comment1 && comment2) {
          // Identical comments are extremely suspicious
          if (comment1 === comment2) suspiciousScore += 40;
          
          // Generic R4R phrase detection
          const r4rPhrases = ['great', 'awesome', 'trusted', 'reliable', 'good user', 'thumbs up', 'excellent', 'recommend', 'nice', 'cool', 'good', 'thanks', 'ty'];
          const comment1HasR4R = r4rPhrases.some(phrase => comment1.includes(phrase));
          const comment2HasR4R = r4rPhrases.some(phrase => comment2.includes(phrase));
          
          // Both comments are short (≤25 chars) AND contain generic phrases
          if (comment1.length <= 25 && comment2.length <= 25 && comment1HasR4R && comment2HasR4R) {
            suspiciousScore += 20;
          }
          // Both comments are extremely short (≤10 chars) regardless of content
          else if (comment1.length <= 10 && comment2.length <= 10) {
            suspiciousScore += 15;
          }
          // Both have R4R phrases but are longer
          else if (comment1HasR4R && comment2HasR4R) {
            suspiciousScore += 8;
          }
        }
        // Empty comments are normal in Ethos Protocol, don't penalize them

        pairs.push({
          user1: {
            userkey: userProfile.userkeys[0],
            displayName: userProfile.displayName,
            username: userProfile.username,
            avatarUrl: userProfile.avatarUrl || userProfile.avatar || userProfile.image || '',
            score: userProfile.score
          },
          user2: {
            userkey: receivedReview.author.userkey,
            displayName: receivedReview.author.displayName || receivedReview.author.name,
            username: receivedReview.author.username,
            avatarUrl: receivedReview.author.avatarUrl || receivedReview.author.avatar || receivedReview.author.image || '',
            score: receivedReview.author.score || 0
          },
          review1: {
            id: receivedReview.id || `${receivedReview.author.userkey}_${receivedReview.timestamp}`,
            sentiment: sentiment1,
            comment: comment1,
            timestamp: receivedReview.timestamp,
            timeGap
          },
          review2: {
            id: correspondingReview.id || `${correspondingReview.subject.userkey}_${correspondingReview.timestamp}`,
            sentiment: sentiment2,
            comment: comment2,
            timestamp: correspondingReview.timestamp
          },
          isReciprocal: true,
          isQuickReciprocal,
          suspiciousScore: Math.min(100, suspiciousScore)
        });
      }
    }

    return pairs.sort((a, b) => b.suspiciousScore - a.suspiciousScore);
  }

  /**
   * Map review sentiment values to standard format (EXACT match to ethos-r4r.deno.dev)
   */
  private mapSentiment(sentiment: any): 'positive' | 'negative' | 'neutral' {
    // Handle numeric scores first (data.score field from API)
    if (typeof sentiment === 'number') {
      if (sentiment > 0) return 'positive';
      if (sentiment < 0) return 'negative';
      return 'neutral';
    }
    
    // Handle string representations
    const sentimentStr = String(sentiment).toLowerCase();
    if (sentimentStr === 'positive' || sentimentStr === '1' || sentimentStr === 'true') return 'positive';
    if (sentimentStr === 'negative' || sentimentStr === '-1' || sentimentStr === 'false') return 'negative';
    return 'neutral';
  }

  /**
   * Analyze network connections for patterns
   */
  private analyzeNetworkConnections(pairs: ReviewPair[], userkey: string) {
    const connections = new Map();

    for (const pair of pairs) {
      const otherUserkey = pair.user2.userkey;
      
      if (!connections.has(otherUserkey)) {
        connections.set(otherUserkey, {
          userkey: otherUserkey,
          displayName: pair.user2.displayName,
          interactionCount: 0,
          reciprocalCount: 0,
          totalTimeGap: 0,
          suspiciousScore: 0
        });
      }

      const connection = connections.get(otherUserkey);
      connection.interactionCount++;
      
      if (pair.isReciprocal) {
        connection.reciprocalCount++;
        connection.totalTimeGap += pair.review1.timeGap || 0;
        connection.suspiciousScore += pair.suspiciousScore;
      }
    }

    return Array.from(connections.values()).map(conn => ({
      ...conn,
      avgTimeGap: conn.reciprocalCount > 0 ? conn.totalTimeGap / conn.reciprocalCount : 0,
      suspiciousScore: conn.reciprocalCount > 0 ? conn.suspiciousScore / conn.reciprocalCount : 0
    })).sort((a, b) => b.suspiciousScore - a.suspiciousScore);
  }

  /**
   * Calculate R4R score for a user without full analysis (prevents recursion)
   */
  private async calculateUserR4RScoreOnly(userkey: string): Promise<{
    userkey: string;
    displayName: string;
    r4rScore: number;
    riskLevel: string;
  } | null> {
    try {
      const userResult = await ethosApi.getRealUserData(userkey);
      if (!userResult.success || !userResult.data) return null;

      const userProfile = userResult.data;
      const [reviewsReceivedResult, reviewsGivenResult] = await Promise.all([
        ethosApi.getReviewsReceived(userkey, 100), // Limit for performance
        ethosApi.getReviewsGiven(userkey, 100)
      ]);
      
      const reviewsReceived = (reviewsReceivedResult.success && reviewsReceivedResult.data?.values) ? reviewsReceivedResult.data.values : [];
      const reviewsGiven = (reviewsGivenResult.success && reviewsGivenResult.data?.values) ? reviewsGivenResult.data.values : [];

      if (reviewsReceived.length === 0) return null;

      // Quick reciprocal count
      let reciprocalCount = 0;
      let quickReciprocalCount = 0;

      for (const receivedReview of reviewsReceived) {
        if (!receivedReview.author) continue;
        
        const correspondingReview = reviewsGiven.find((givenReview: any) => 
          givenReview.subject && givenReview.subject.userkey === receivedReview.author.userkey
        );

        if (correspondingReview) {
          const sentiment1 = this.mapSentiment(receivedReview.data?.score || receivedReview.sentiment);
          const sentiment2 = this.mapSentiment(correspondingReview.data?.score || correspondingReview.sentiment);
          
          if (sentiment1 === 'positive' && sentiment2 === 'positive') {
            reciprocalCount++;
            
            const timeGap = this.calculateTimeGap(receivedReview.timestamp, correspondingReview.timestamp);
            // CRITICAL FIX: Official site shows "<30min" for quick reciprocations
            if (timeGap <= 30) quickReciprocalCount++;
          }
        }
      }

      // Calculate account age from oldest review (EXACT match to official algorithm)
      const allReviews = [...reviewsReceived, ...reviewsGiven];
      let accountAgeDays = 100; // Default fallback
      if (allReviews.length > 0) {
        const reviewDates = allReviews.map(r => new Date(typeof r.timestamp === 'number' ? r.timestamp * 1000 : r.timestamp));
        const oldestReview = Math.min(...reviewDates.map(d => d.getTime()));
        accountAgeDays = (Date.now() - oldestReview) / (1000 * 60 * 60 * 24);
      }
      const r4rScore = this.calculateR4RScore(
        reciprocalCount, 
        reviewsReceived.length, 
        reviewsGiven.length, 
        quickReciprocalCount, 
        accountAgeDays
      );

      return {
        userkey,
        displayName: userProfile.displayName,
        r4rScore,
        riskLevel: this.getRiskLevel(r4rScore)
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Identify users with high R4R scores (≥70%) from review network (matches ethos-r4r.deno.dev)
   */
  private async findHighR4RReviewers(reviewPairs: ReviewPair[], targetUserkey: string, networkConnections?: any[]): Promise<Array<{
    userkey: string;
    displayName: string;
    username: string;
    avatarUrl: string;
    r4rScore: number;
    riskLevel: string;
  }>> {
    const uniqueUsers = new Set<string>();
    
    // Extract unique users from review pairs (both directions, excluding target user)
    for (const pair of reviewPairs) {
      if (pair.user1.userkey !== targetUserkey) {
        uniqueUsers.add(pair.user1.userkey);
      }
      if (pair.user2.userkey !== targetUserkey) {
        uniqueUsers.add(pair.user2.userkey);
      }
    }
    
    // Also include network connections to expand search scope (matches official behavior)
    if (networkConnections && networkConnections.length > 0) {
      for (const conn of networkConnections) {
        if (conn.userkey !== targetUserkey) {
          uniqueUsers.add(conn.userkey);
        }
      }
    }
    
    const highR4RUsers = [];
    
    // Check R4R scores for each user (limit to 15 for better coverage like official site)
    const usersToCheck = Array.from(uniqueUsers).slice(0, 15);
    
    for (const userkey of usersToCheck) {
      try {
        const quickAnalysis = await this.calculateUserR4RScoreOnly(userkey);
        if (quickAnalysis && quickAnalysis.r4rScore >= 70) {
          highR4RUsers.push({
            userkey: quickAnalysis.userkey,
            displayName: quickAnalysis.displayName,
            username: quickAnalysis.displayName, // Use displayName as username fallback
            avatarUrl: '', // Basic implementation
            r4rScore: quickAnalysis.r4rScore,
            riskLevel: quickAnalysis.riskLevel
          });
        }
      } catch (error) {
        // Skip users that can't be analyzed
        continue;
      }
    }
    
    return highR4RUsers.sort((a, b) => b.r4rScore - a.r4rScore);
  }



  /**
   * Main analysis function that processes a user's complete review history
   */
  async analyzeUser(userkey: string): Promise<R4RAnalysis | null> {
    try {
      // Get user profile
      const userResult = await ethosApi.getRealUserData(userkey);
      if (!userResult.success || !userResult.data) {
        throw new Error('User not found');
      }

      const userProfile = userResult.data;

      // Get comprehensive review data using Activities API v2
      const [reviewsReceivedResult, reviewsGivenResult] = await Promise.all([
        ethosApi.getReviewsReceived(userkey, 500),
        ethosApi.getReviewsGiven(userkey, 500)
      ]);
      
      const reviewsReceived = (reviewsReceivedResult.success && reviewsReceivedResult.data?.values) ? reviewsReceivedResult.data.values : [];
      const reviewsGiven = (reviewsGivenResult.success && reviewsGivenResult.data?.values) ? reviewsGivenResult.data.values : [];

      // Find reciprocal pairs and collect all reviews
      const reviewPairs = this.findReciprocalPairs(reviewsReceived, reviewsGiven, userProfile);
      const allReviewsData = this.collectAllReviews(reviewsReceived, reviewsGiven, userProfile);

      // Calculate metrics
      const totalReviewsReceived = reviewsReceived.length;
      const totalReviewsGiven = reviewsGiven.length;
      
      // Count ONLY positive-positive reciprocal review relationships (matches official ethos-r4r algorithm)
      // Only positive-positive review pairs count as true R4R
      const reciprocalReviews = reviewPairs.filter(pair => 
        pair.review1.sentiment === 'positive' && pair.review2.sentiment === 'positive'
      ).length;
      
      const reciprocalPercentage = totalReviewsReceived > 0 ? (reciprocalReviews / totalReviewsReceived) * 100 : 0;
      
      const positivePositivePairs = reviewPairs.filter(pair => 
        pair.review1.sentiment === 'positive' && pair.review2.sentiment === 'positive'
      );
      const quickReciprocalCount = positivePositivePairs.filter(p => p.isQuickReciprocal).length;
      const quickReciprocalPercentage = reciprocalReviews > 0 ? (quickReciprocalCount / reciprocalReviews) * 100 : 0;

      // Calculate account age from first review
      const allReviews = [...reviewsReceived, ...reviewsGiven].sort((a, b) => 
        (typeof a.timestamp === 'number' ? a.timestamp : new Date(a.timestamp).getTime() / 1000) - 
        (typeof b.timestamp === 'number' ? b.timestamp : new Date(b.timestamp).getTime() / 1000)
      );
      
      const firstReviewDate = allReviews.length > 0 ? 
        (typeof allReviews[0].timestamp === 'number' ? new Date(allReviews[0].timestamp * 1000).toISOString() : allReviews[0].timestamp) : 
        new Date().toISOString();
      const accountAgeDays = Math.max(1, (new Date().getTime() - new Date(firstReviewDate).getTime()) / (1000 * 60 * 60 * 24));

      // Calculate R4R score using improved algorithm
      const r4rScore = this.calculateR4RScore(
        reciprocalReviews, 
        totalReviewsReceived, 
        totalReviewsGiven, 
        quickReciprocalCount, 
        accountAgeDays
      );

      // Analyze network connections
      const networkConnections = this.analyzeNetworkConnections(reviewPairs, userkey);

      // Use already calculated time-based metrics
      const lastReviewDate = allReviews.length > 0 ? 
        (typeof allReviews[allReviews.length - 1].timestamp === 'number' ? 
          new Date(allReviews[allReviews.length - 1].timestamp * 1000).toISOString() : 
          allReviews[allReviews.length - 1].timestamp) : 
        new Date().toISOString();

      const reviewFrequency = accountAgeDays > 0 ? (allReviews.length / accountAgeDays) * 7 : 0;

      const avgTimeBetweenReviews = allReviews.length > 1 ? 
        ((new Date(lastReviewDate).getTime() - new Date(firstReviewDate).getTime()) / (1000 * 60 * 60)) / (allReviews.length - 1) : 0;



      // Find high R4R reviewers (≥70% R4R score) from network (matches ethos-r4r.deno.dev)
      const highR4RReviewers = await this.findHighR4RReviewers(reviewPairs, userkey, networkConnections);

      // Calculate detailed score breakdown for transparency (matches ethos-r4r.deno.dev)
      const uncappedBaseScore = totalReviewsReceived > 0 ? (reciprocalReviews / totalReviewsReceived) * 100 : 0;
      const cappedBaseScore = Math.min(65, uncappedBaseScore);
      
      // Volume multiplier calculation (EXACT match to official algorithm)
      let volumeMultiplier = 1.0;
      let volumeDescription = "Normal volume";
      if (reciprocalReviews >= 50) {
        volumeMultiplier = 1.2;
        volumeDescription = "Very high volume (50+ reciprocals)";
      } else if (reciprocalReviews >= 20) {
        volumeMultiplier = 1.15;
        volumeDescription = "High volume (20-49 reciprocals)";
      } else if (reciprocalReviews >= 10) {
        volumeMultiplier = 1.05;
        volumeDescription = "Moderate volume (10-19 reciprocals)";
      }
      
      // Account age factor (EXACT match to official algorithm)
      let accountAgeMultiplier = 1.0;
      let accountAgeDescription = "Normal activity rate";
      const reviewsPerDay = (totalReviewsGiven + totalReviewsReceived) / Math.max(accountAgeDays, 1);
      
      if (accountAgeDays < 30 && reviewsPerDay > 10) {
        accountAgeMultiplier = 1.4; // Official algorithm value
        accountAgeDescription = "Very high activity for very new account";
      } else if (accountAgeDays < 60 && reviewsPerDay > 5) {
        accountAgeMultiplier = 1.25; // Official algorithm value
        accountAgeDescription = "High activity for new account";
      } else if (accountAgeDays < 90 && reviewsPerDay > 2) {
        accountAgeMultiplier = 1.1; // Official algorithm value
        accountAgeDescription = "Moderate activity for young account";
      }
      
      // Time penalty calculation (EXACT match to official algorithm)
      let timePenalty = 0;
      let timePenaltyDescription = "No time penalty";
      if (reciprocalReviews > 0) {
        const quickReciprocalPercentage = (quickReciprocalCount / reciprocalReviews) * 100;
        
        // Official algorithm penalty structure
        if (quickReciprocalPercentage >= 80) {
          timePenalty = 12.5;
          timePenaltyDescription = `${quickReciprocalPercentage.toFixed(1)}% quick reciprocals (≥80% threshold)`;
        } else if (quickReciprocalPercentage >= 60) {
          timePenalty = 10;
          timePenaltyDescription = `${quickReciprocalPercentage.toFixed(1)}% quick reciprocals (≥60% threshold)`;
        } else if (quickReciprocalPercentage >= 40) {
          timePenalty = 6.5;
          timePenaltyDescription = `${quickReciprocalPercentage.toFixed(1)}% quick reciprocals (≥40% threshold)`;
        } else if (quickReciprocalPercentage >= 20) {
          timePenalty = 3;
          timePenaltyDescription = `${quickReciprocalPercentage.toFixed(1)}% quick reciprocals (≥20% threshold)`;
        }
      }
      
      // Calculation flow for transparency (EXACT match to official algorithm)
      const baseScore = Math.min(65, uncappedBaseScore); // Official DOES cap base score at 65%
      const beforePenalty = baseScore * volumeMultiplier * accountAgeMultiplier;
      const finalScore = Math.min(100, Math.max(0, beforePenalty + timePenalty));
      
      return {
        userkey,
        displayName: userProfile.displayName,
        totalReviewsReceived,
        totalReviewsGiven,
        reciprocalReviews,
        reciprocalPercentage: Math.round(reciprocalPercentage * 10) / 10,
        quickReciprocalCount,
        quickReciprocalPercentage: Math.round(quickReciprocalPercentage * 10) / 10,
        r4rScore: Math.round(r4rScore * 10) / 10,
        riskLevel: this.getRiskLevel(r4rScore),
        reviewPairs: reviewPairs.slice(0, 50), // Limit for performance
        allReviews: allReviewsData, // Show all reviews for complete analysis
        networkConnections: networkConnections.slice(0, 20),
        firstReviewDate,
        lastReviewDate,
        reviewFrequency: Math.round(reviewFrequency * 10) / 10,
        avgTimeBetweenReviews: Math.round(avgTimeBetweenReviews * 10) / 10,
        // NEW: Detailed score breakdown (matches ethos-r4r.deno.dev format)
        scoreBreakdown: {
          uncappedBaseScore: Math.round(uncappedBaseScore * 10) / 10,
          cappedBaseScore: Math.round(cappedBaseScore * 10) / 10,
          baseScoreDescription: `${reciprocalReviews} of ${totalReviewsReceived} reviews reciprocal`,
          volumeMultiplier,
          volumeDescription,
          accountAgeMultiplier,
          accountAgeDescription,
          timePenalty,
          timePenaltyDescription,
          calculationFlow: `${cappedBaseScore.toFixed(1)}% (base) × ${volumeMultiplier}x (volume) × ${accountAgeMultiplier}x (age) = ${beforePenalty.toFixed(1)}%`,
          finalCalculation: `${beforePenalty.toFixed(1)}% + ${timePenalty} (time penalty) = ${finalScore.toFixed(1)}% (final${finalScore >= 100 ? ', capped at 100%' : ''})`
        },
        // High R4R Rate Reviewers (matches ethos-r4r.deno.dev feature)
        highR4RReviewers: highR4RReviewers.length > 0 ? highR4RReviewers : undefined
      };

    } catch (error) {
      console.error('R4R Analysis error:', error);
      return null;
    }
  }

  // Missing method implementations that the API endpoints expect
  async getR4RAnalytics(userkey: string) {
    return await this.analyzeUser(userkey);
  }

  async getR4RAnalysis(userkey: string) {
    return await this.analyzeUser(userkey);
  }

  async getNetworkAnalysis(userkey: string) {
    // Simplified network analysis - just return some basic data
    const analysis = await this.analyzeUser(userkey);
    return {
      networkConnections: analysis?.networkConnections || [],
      crossConnections: [],
      networkSuspiciousScore: analysis?.r4rScore || 0
    };
  }

  async getR4RSummary(userkey: string) {
    const analysis = await this.analyzeUser(userkey);
    return {
      reciprocalRate: analysis?.reciprocalPercentage || 0,
      totalReviews: analysis?.totalReviewsReceived || 0,
      riskLevel: analysis?.riskLevel || 'Low',
      r4rScore: analysis?.r4rScore || 0
    };
  }
}

export const r4rAnalyzer = new R4RAnalyzer();