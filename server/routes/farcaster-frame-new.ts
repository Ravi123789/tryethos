import express from 'express';
import { createCanvas, loadImage, Image } from 'canvas';
import path from 'path';
import fs from 'fs';
import { ethosApi } from '../services/ethos-api';

const router = express.Router();

// Dynamic image URLs with minute-based versioning for faster updates
const getImageUrl = (userkey: string) => {
  // Use minute-based versioning for faster cache updates
  const minuteVersion = Math.floor(Date.now() / (1000 * 60)); // Changes every minute
  return `/farcaster/card/${encodeURIComponent(userkey)}?v=${minuteVersion}`;
};

// Farcaster frame endpoint
router.get('/frame/:userkey', async (req, res) => {
  const { userkey } = req.params;
  // Always use production domain for frames
  const baseUrl = 'https://ethosradar.com';

  // Resolve userkey if it's a username format
  let resolvedUserkey = decodeURIComponent(userkey);
  
  if (!resolvedUserkey.includes('service:') && !resolvedUserkey.includes('address:') && !resolvedUserkey.includes('profileId:')) {
    try {
      const searchResponse = await fetch(`http://localhost:${process.env.PORT || 5000}/api/search-suggestions?q=${encodeURIComponent(resolvedUserkey)}&limit=1`);
      if (searchResponse.ok) {
        const searchResult = await searchResponse.json();
        if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
          resolvedUserkey = searchResult.data[0].userkey;
        }
      }
    } catch (error) {
      // Username resolution failed, continue with original
    }
  }

  let cardImageUrl = `${baseUrl}${getImageUrl(resolvedUserkey)}`;
  let frameTitle = 'Check Your Ethos Trust Score';
  let frameDescription = 'Generate your personalized trust reputation card';

  try {
    const profileResponse = await fetch(`http://localhost:${process.env.PORT || 5000}/api/enhanced-profile/${encodeURIComponent(resolvedUserkey)}`);
    if (profileResponse.ok) {
      const profileResult = await profileResponse.json();
      if (profileResult.success && profileResult.data) {
        const user = profileResult.data;
        frameTitle = `${user.displayName || user.username}'s Trust Score`;
        frameDescription = `Trust Score: ${user.score} | Check out their reputation on Ethos Protocol`;
      }
    }
  } catch (error) {
    // Error fetching user for frame handled
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${frameTitle}</title>
        <meta property="og:title" content="${frameTitle}">
        <meta property="og:description" content="${frameDescription}">
        <meta property="og:image" content="${cardImageUrl}">
        <meta property="og:image:width" content="460">
        <meta property="og:image:height" content="320">
        
        <!-- Mini App Embed tags -->
        <meta name="fc:frame" content='{"version":"1","imageUrl":"${cardImageUrl}","button":{"title":"Scan Your Trust Score","action":{"type":"launch_miniapp","name":"EthosRadar","url":"${baseUrl}/"}}}'>
        
        <!-- For backward compatibility -->
        <meta name="fc:miniapp" content='{"version":"1","imageUrl":"${cardImageUrl}","button":{"title":"Scan Your Trust Score","action":{"type":"launch_miniapp","name":"EthosRadar","url":"${baseUrl}/"}}}'>



      </head>
      <body>
        <h1>${frameTitle}</h1>
        <p>${frameDescription}</p>
        <img src="${cardImageUrl}" alt="Trust Score Card" style="max-width: 100%; height: auto;">
      </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(html);
});

// Card image generation endpoint - EXACT COPY from working component
router.get('/card/:userkey', async (req, res) => {
  const { userkey } = req.params;
  
  // Generate Farcaster card for user

  try {
    // Create canvas with slightly narrower dimensions for better embed fit
    const canvas = createCanvas(460, 320);
    const ctx = canvas.getContext('2d');

    // STEP 1: Resolve userkey if it's a username format
    let resolvedUserkey = decodeURIComponent(userkey);
    
    // If userkey doesn't contain service format, try to resolve it as username
    if (!resolvedUserkey.includes('service:') && !resolvedUserkey.includes('address:') && !resolvedUserkey.includes('profileId:')) {
      try {
        const searchResponse = await fetch(`http://localhost:${process.env.PORT || 5000}/api/search-suggestions?q=${encodeURIComponent(resolvedUserkey)}&limit=1`);
        if (searchResponse.ok) {
          const searchResult = await searchResponse.json();
          if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
            resolvedUserkey = searchResult.data[0].userkey;
            // Resolved username to userkey
          }
        }
      } catch (error) {
        // Username resolution failed, continue with original
      }
    }

    // Get user data and enhanced profile with error handling
    let user: any = null;
    let enhancedProfile: any = null;
    let dashboardData: any = null;

    try {
      const profileResponse = await fetch(`http://localhost:${process.env.PORT || 5000}/api/enhanced-profile/${encodeURIComponent(resolvedUserkey)}`);
      if (profileResponse.ok) {
        const profileResult = await profileResponse.json();
        // Profile data successfully loaded
        
        if (profileResult.success && profileResult.data) {
          user = profileResult.data;
          enhancedProfile = profileResult.data;
        }
      }
    } catch (error) {
      // Error handled silently
    }

    // Get dashboard review data
    try {
      const dashboardResponse = await fetch(`http://localhost:${process.env.PORT || 5000}/api/dashboard-reviews/${encodeURIComponent(resolvedUserkey)}`);
      if (dashboardResponse.ok) {
        dashboardData = await dashboardResponse.json();
      }
    } catch (error) {
      // Error handled silently
    }

    // Get vouch data using our API endpoint
    let vouchData: any = null;
    try {
      const vouchResponse = await fetch(`http://localhost:${process.env.PORT || 5000}/api/user-vouch-activities/${encodeURIComponent(resolvedUserkey)}`);
      if (vouchResponse.ok) {
        const vouchResult = await vouchResponse.json();
        if (vouchResult.success && vouchResult.data) {
          vouchData = vouchResult.data;
        }
      }
    } catch (error) {
      // Error handled silently
    }

    // Extract data with fallbacks - use displayName as shown in profile
    const displayName = user?.displayName || enhancedProfile?.displayName || user?.username || 'Unknown User';
    const score = user?.score || enhancedProfile?.score || 0;
    const totalReviews = dashboardData?.data?.totalReviews || 0;
    const positivePercentage = dashboardData?.data?.positivePercentage || 0;
    const vouchCount = vouchData?.received?.length || 0;

    // Generate frame card with optimized rendering

    // Background rendering removed - using simple gradient

    // Optimized direct background rendering (no async promises)
    const createBackground = () => {
      // Simple gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#f8fafc');
      gradient.addColorStop(0.5, '#e2e8f0');
      gradient.addColorStop(1, '#cbd5e1');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Single subtle background element
      const bgGradient = ctx.createRadialGradient(230, 160, 0, 230, 160, 80);
      bgGradient.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
      bgGradient.addColorStop(1, 'rgba(150, 150, 150, 0.01)');
      ctx.fillStyle = bgGradient;
      ctx.beginPath();
      ctx.arc(230, 160, 80, 0, 2 * Math.PI);
      ctx.fill();
      
      // Card background
      const cardX = 30, cardY = 30;
      const cardWidth = canvas.width - 60, cardHeight = canvas.height - 60;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 20);
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    // Simplified level color helper
    const getLevelColor = () => {
      if (score >= 2000) return '#8b5cf6'; // Purple
      if (score >= 1600) return '#10b981'; // Emerald  
      if (score >= 1200) return '#3b82f6'; // Blue
      if (score >= 800) return '#f59e0b';  // Amber
      return '#6b7280'; // Gray
    };

    // Create optimized background
    createBackground();
    // Start text rendering

    // Single standardized quote for all cards
    const standardQuote = '"Having morals in crypto is expensive"';
    
    // Header section with black text on transparent card background - quote moved down and right
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(standardQuote, 55, 60);

    // Draw avatar if available - moved up
    const avatarRadius = 25;
    const avatarX = 60;
    const avatarY = 95;
    let nameStartX = 60;
    
    if (user?.avatarUrl) {
      try {
        // Simplified avatar loading without promises
        const avatarImg = new Image();
        (avatarImg as any).crossOrigin = 'anonymous';
        
        try {
          avatarImg.src = user.avatarUrl || '';
          
          // Draw avatar synchronously (may not load, but won't block)
          ctx.save();
          ctx.beginPath();
          ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius, 0, 2 * Math.PI);
          ctx.clip();
          
          if (avatarImg.complete) {
            ctx.drawImage(avatarImg, avatarX, avatarY, avatarRadius * 2, avatarRadius * 2);
          }
          
          ctx.restore();
          
          // Status ring
          const status = enhancedProfile?.status || user?.status;
          const ringColor = status === 'ACTIVE' ? '#10b981' : 
                           status === 'INACTIVE' ? '#eab308' : 
                           status === 'UNINITIALIZED' ? '#9333ea' : '#6b7280';
          
          ctx.strokeStyle = ringColor;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius + 2, 0, 2 * Math.PI);
          ctx.stroke();
        } catch (error) {
          // Avatar loading failed
        }
        
        nameStartX = avatarX + (avatarRadius * 2) + 12;
      } catch (error) {
        // Error loading avatar handled
      }
    } else {
      // Simplified default avatar
      ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
      ctx.beginPath();
      ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Status ring
      const status = enhancedProfile?.status || user?.status;
      const ringColor = status === 'ACTIVE' ? '#10b981' : 
                       status === 'INACTIVE' ? '#eab308' : 
                       status === 'UNINITIALIZED' ? '#9333ea' : '#6b7280';
      
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius + 2, 0, 2 * Math.PI);
      ctx.stroke();
      
      // User initial
      ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      const initial = displayName ? displayName[0].toUpperCase() : '?';
      ctx.fillText(initial, avatarX + avatarRadius, avatarY + avatarRadius + 8);
      
      nameStartX = avatarX + (avatarRadius * 2) + 12;
    }

    // Main content - user name with bold/plain styling - EXACT COPY
    ctx.textAlign = 'left';
    
    // Parse username for bold/plain styling - always split in half for single words
    // Parse username for rendering
    let boldPart = '';
    let plainPart = '';
    
    // Clean displayName by removing emojis for splitting logic
    const cleanName = displayName.replace(/[^\w\s]/g, '').trim();
    // Clean name processed
    
    // Split logic for different username patterns
    if (cleanName.includes(' ')) {
      const parts = cleanName.split(' ');
      boldPart = parts[0];
      plainPart = parts.slice(1).join(' ');
    } else {
      // For single words like "hrithik", always split in half (hri + thik)
      const mid = Math.floor(cleanName.length / 2);
      boldPart = cleanName.substring(0, mid);
      plainPart = cleanName.substring(mid);
    }
    
    // Username split complete
    
    // Draw bold part in black - moved up and made larger
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    // Use simplest possible font specification
    ctx.font = 'bold 28px Arial';
    ctx.fillText(boldPart, nameStartX, 135);
    
    // Draw plain part in black with lighter weight - moved up and made larger
    const boldWidth = ctx.measureText(boldPart).width;
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.font = '300 28px Arial';
    ctx.fillText(plainPart, nameStartX + boldWidth, 135);
    
    // Calculate level based on trust score - EXACT COPY
    const getScoreLevel = (score: number): string => {
      if (score >= 2000) return 'Exemplary';
      if (score >= 1600) return 'Reputable';
      if (score >= 1200) return 'Neutral';
      if (score >= 800) return 'Questionable';
      return 'Untrusted';
    };
    
    const levelName = getScoreLevel(score);
    


    // Background logo removed per user request

    // Level positioned at top-right corner - adjusted for narrower canvas
    const levelText = `${levelName}`;
    const currentLevelColor = getLevelColor();
    ctx.fillStyle = currentLevelColor;
    ctx.font = '20px serif';
    ctx.textAlign = 'right';
    ctx.fillText(levelText, canvas.width - 50, 65);

    // Vertical accent line with increased height - adjusted position
    ctx.strokeStyle = currentLevelColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width - 45, 45);
    ctx.lineTo(canvas.width - 45, 75);
    ctx.stroke();

    // Simple level-based border glow
    drawLevelGlow(currentLevelColor);

    // Trust score below username - Cormorant Garamond font, moved up
    const displayScore = score.toString();
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    // Use Cormorant Garamond for elegant serif appearance
    ctx.font = '50px "Cormorant Garamond", "Times New Roman", serif';
    ctx.textAlign = 'left';
    ctx.fillText(displayScore, nameStartX, 210);

    // Stats below in black text - moved up for better positioning
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    
    const statsY = 260;
    
    // Calculate authentic dollar value from vouch data
    const stakedEthWei = enhancedProfile?.stats?.vouch?.received?.amountWeiTotal || '0';
    const stakedEth = parseFloat(stakedEthWei) / 1e18;
    const dollarValue = stakedEth * 3870;
    
    const vouchText = `${vouchCount} vouches`;
    const dollarText = `($${dollarValue.toFixed(0)})`;
    
    // Draw vouches text
    ctx.fillText(vouchText, 60, statsY);
    const vouchWidth = ctx.measureText(vouchText).width;
    
    // Draw dollar amount
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillText(dollarText, 60 + vouchWidth + 5, statsY);
    const dollarWidth = ctx.measureText(dollarText).width;
    
    // Calculate dynamic reviews position based on vouch section width - adjusted for narrower canvas
    const vouchSectionWidth = vouchWidth + dollarWidth + 10; // vouches + dollar + spacing
    const reviewsX = Math.max(150, 60 + vouchSectionWidth + 15); // Reduced spacing for narrower canvas
    
    // Draw reviews - positioned dynamically to avoid overlap
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    const reviewText = `${totalReviews} reviews`;
    // Draw reviews text
    ctx.fillText(reviewText, reviewsX, statsY);
    const reviewWidth = ctx.measureText(reviewText).width;
    
    // Draw percentage
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    const percentageX = reviewsX + reviewWidth + 5;
    ctx.fillText(`(${positivePercentage}%)`, percentageX, statsY);
    
    // Bottom right corner attribution - EthosRadar and username (small thin font matching vouches/reviews)
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; // Same opacity as vouches/reviews
    ctx.font = '12px Arial'; // Same size as vouches/reviews
    ctx.textAlign = 'right';
    
    // EthosRadar text - positioned for narrower canvas
    ctx.fillText('EthosRadar', canvas.width - 40, 250);
    
    // Username handle below EthosRadar - positioned to match reference
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; // Same opacity as dollar amount/percentage
    ctx.font = '12px Arial'; // Same size for consistency
    const userHandle = user?.username || enhancedProfile?.username || 'user';
    ctx.fillText(`@${userHandle}`, canvas.width - 40, 263);
    ctx.restore();
    
    // Bottom center attribution - positioned well outside card border
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Generated using EthosRadar mini app by @cookedzera.eth`, canvas.width / 2, 305);
    ctx.textAlign = 'left'; // Reset alignment for other text

    // Optimized headers for production Farcaster frame delivery
    const isPreview = req.query.preview === 'true';
    res.setHeader('Content-Type', 'image/png');
    
    if (isPreview) {
      // Preview mode: immediate updates for development
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('X-Preview-Mode', 'true');
    } else {
      // Production mode: optimized caching for Farcaster performance
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600'); // 5min browser, 1hr CDN
      res.setHeader('ETag', `"${userkey}-${score}-${totalReviews}"`);
    }
    
    // CORS headers for wide compatibility
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    const buffer = canvas.toBuffer('image/png');
    res.send(buffer);

  } catch (error) {
    // Error handled silently
    
    // Return proper PNG error image instead of JSON
    const errorCanvas = createCanvas(600, 315);
    const errorCtx = errorCanvas.getContext('2d');
    
    // Simple error card
    errorCtx.fillStyle = '#1f2937';
    errorCtx.fillRect(0, 0, 600, 315);
    errorCtx.fillStyle = '#ffffff';
    errorCtx.font = '24px Arial';
    errorCtx.textAlign = 'center';
    errorCtx.fillText('Frame Generation Error', 300, 150);
    errorCtx.font = '16px Arial';
    errorCtx.fillText('Please try again later', 300, 180);
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache');
    res.status(500).send(errorCanvas.toBuffer('image/png'));
  }
});

export default router;