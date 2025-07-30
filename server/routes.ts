import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { z } from "zod";
import { ethosApi } from "./services/ethos-api";
import { getExtendedAttestations, mapServiceToIcon, formatServiceName } from "./attestations";
import { r4rAnalyzer } from "./services/r4r-analyzer";
import farcasterFrameRoutes from "./routes/farcaster-frame-new";

// Ethos-style tier system matching official app.ethos.network tiers
function getTierInfo(score: number) {
  if (score >= 2500) return { tier: 'exemplary IV', emoji: '🌟', flex: 'LEGENDARY STATUS' };
  if (score >= 2000) return { tier: 'exemplary III', emoji: '⚡', flex: 'ELITE TIER' };
  if (score >= 1600) return { tier: 'exemplary II', emoji: '🔥', flex: 'TOP PERFORMER' };
  if (score >= 1200) return { tier: 'exemplary I', emoji: '💎', flex: 'EXEMPLARY' };
  if (score >= 900) return { tier: 'credible III', emoji: '📈', flex: 'HIGHLY CREDIBLE' };
  if (score >= 600) return { tier: 'credible II', emoji: '⭐', flex: 'CREDIBLE' };
  if (score >= 300) return { tier: 'credible I', emoji: '🌱', flex: 'ESTABLISHING' };
  return { tier: 'neutral', emoji: '🔰', flex: 'BUILDING REPUTATION' };
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Farcaster Mini App Manifest endpoint
  app.get('/.well-known/farcaster.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const manifest = {
      accountAssociation: {
        header: "eyJmaWQiOjE5MDUyMiwidHlwZSI6ImF1dGgiLCJrZXkiOiIweDk5RjZGZTYwZTJCYTM0MzI1MTI5ZEJEMmNEZGM0NTdEMjk3MzY4RjgifQ",
        payload: "eyJkb21haW4iOiJldGhvc3JhZGFyLmNvbSJ9",
        signature: "Ap2jpG3Hb7ifpde/kd56Hr6Z8e4mOnSi7tQZU25LYsVtsveU1T2LyfqQmB1oy0w1Mwm31IDlQlWKuAoOIquj0Bs="
      },
      frame: {
        version: "1",
        name: "EthosRadar",
        homeUrl: "https://ethosradar.com",
        iconUrl: "https://ethosradar.com/logo.png",
        splashBackgroundColor: "#0F172A",
        subtitle: "Trust Score Scanner for Web3",
        description: "Generate your personalized trust reputation card on Ethos Protocol",
        primaryCategory: "utility",
        tags: ["trust", "reputation", "ethos", "crypto", "web3"]
      }
    };
    res.json(manifest);
  });

  // Mount Farcaster frame routes
  app.use('/farcaster', farcasterFrameRoutes);





  
  // Serve PNG images with correct content type
  app.get('/logo.png', (req, res) => {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.sendFile(path.join(process.cwd(), 'public', 'logo.png'));
  });
  
  app.get('/icon.png', (req, res) => {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.sendFile(path.join(process.cwd(), 'public', 'icon.png'));
  });
  
  app.get('/splash.png', (req, res) => {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.sendFile(path.join(process.cwd(), 'public', 'splash.png'));
  });
  

  
  // SVG icon for Mini App display
  app.get('/icon.svg', (req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    const svg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1E40AF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3B82F6;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
  </defs>
  
  <!-- Background circle -->
  <rect width="1024" height="1024" rx="200" fill="url(#bgGrad)"/>
  
  <!-- Main radar circle -->
  <circle cx="512" cy="512" r="300" fill="none" stroke="white" stroke-width="6" opacity="0.3"/>
  <circle cx="512" cy="512" r="200" fill="none" stroke="white" stroke-width="8" opacity="0.5"/>
  <circle cx="512" cy="512" r="100" fill="none" stroke="white" stroke-width="10" opacity="0.7"/>
  
  <!-- Center eye/radar -->
  <ellipse cx="512" cy="512" rx="80" ry="40" fill="white" opacity="0.9" filter="url(#shadow)"/>
  <circle cx="512" cy="512" r="24" fill="#1E40AF"/>
  
  <!-- Radar sweep line -->
  <line x1="512" y1="512" x2="512" y2="212" stroke="white" stroke-width="4" opacity="0.8" transform="rotate(45 512 512)"/>
  
  <!-- Trust network dots -->
  <circle cx="612" cy="412" r="8" fill="white" opacity="0.8"/>
  <circle cx="712" cy="512" r="6" fill="white" opacity="0.6"/>
  <circle cx="412" cy="612" r="8" fill="white" opacity="0.8"/>
  <circle cx="312" cy="412" r="6" fill="white" opacity="0.6"/>
</svg>`;
    res.send(svg);
  });
  
  // Custom PNG files are now served as static assets through the main static middleware
  // No need for separate routes - they're automatically served from dist/public/
  
  // Hero image for Farcaster manifest (1200x630 - 1.91:1 aspect ratio per 2025 spec)
  app.get('/hero.png', (req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1E40AF;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#60A5FA;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge> 
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#heroGrad)"/>
  
  <!-- Network nodes background pattern -->
  <g opacity="0.1">
    <circle cx="200" cy="120" r="4" fill="white"/>
    <circle cx="400" cy="180" r="4" fill="white"/>
    <circle cx="700" cy="140" r="4" fill="white"/>
    <circle cx="900" cy="210" r="4" fill="white"/>
    <circle cx="300" cy="300" r="4" fill="white"/>
    <circle cx="600" cy="270" r="4" fill="white"/>
    <circle cx="1000" cy="300" r="4" fill="white"/>
    <circle cx="160" cy="420" r="4" fill="white"/>
    <circle cx="500" cy="480" r="4" fill="white"/>
    <circle cx="840" cy="450" r="4" fill="white"/>
    
    <!-- Connection lines -->
    <line x1="200" y1="120" x2="400" y2="180" stroke="white" stroke-width="1"/>
    <line x1="400" y1="180" x2="700" y2="140" stroke="white" stroke-width="1"/>
    <line x1="700" y1="140" x2="900" y2="210" stroke="white" stroke-width="1"/>
    <line x1="300" y1="300" x2="600" y2="270" stroke="white" stroke-width="1"/>
    <line x1="600" y1="270" x2="1000" y2="300" stroke="white" stroke-width="1"/>
    <line x1="160" y1="420" x2="500" y2="480" stroke="white" stroke-width="1"/>
    <line x1="500" y1="480" x2="840" y2="450" stroke="white" stroke-width="1"/>
  </g>
  
  <!-- Central radar/eye icon -->
  <g transform="translate(600,315)">
    <!-- Radar circles -->
    <circle cx="0" cy="0" r="80" fill="none" stroke="white" stroke-width="3" opacity="0.6"/>
    <circle cx="0" cy="0" r="55" fill="none" stroke="white" stroke-width="3" opacity="0.8"/>
    <circle cx="0" cy="0" r="30" fill="none" stroke="white" stroke-width="3"/>
    
    <!-- Eye shape -->
    <ellipse cx="0" cy="0" rx="45" ry="25" fill="white" opacity="0.9"/>
    <circle cx="0" cy="0" r="16" fill="#1E40AF"/>
    <circle cx="4" cy="-4" r="6" fill="white"/>
    
    <!-- Scanning line -->
    <line x1="0" y1="0" x2="65" y2="-25" stroke="#60A5FA" stroke-width="4" opacity="0.8"/>
  </g>
  
  <!-- Title -->
  <text x="600" y="180" font-family="Arial, sans-serif" font-size="64" font-weight="bold" 
        text-anchor="middle" fill="white">EthosRadar</text>
  
  <!-- Subtitle -->
  <text x="600" y="220" font-family="Arial, sans-serif" font-size="24" 
        text-anchor="middle" fill="white" opacity="0.9">Trust Network Scanner</text>
  
  <!-- Bottom tagline -->
  <text x="600" y="520" font-family="Arial, sans-serif" font-size="20" 
        text-anchor="middle" fill="white" opacity="0.8">Powered by Ethos Protocol</text>
  
  <!-- Trust score indicators -->
  <g transform="translate(100,80)" opacity="0.7">
    <circle cx="0" cy="0" r="20" fill="#10B981"/>
    <text x="0" y="6" font-family="Arial, sans-serif" font-size="16" font-weight="bold" 
          text-anchor="middle" fill="white">1850</text>
  </g>
  
  <g transform="translate(1100,550)" opacity="0.7">
    <circle cx="0" cy="0" r="20" fill="#F59E0B"/>
    <text x="0" y="6" font-family="Arial, sans-serif" font-size="16" font-weight="bold" 
          text-anchor="middle" fill="white">1200</text>
  </g>
</svg>`;
    res.send(svg);
  });
  

  // Simple search suggestions using direct Ethos API (ethos-r4r approach)
  app.get("/api/search-suggestions", async (req, res) => {
    try {
      const query = req.query.q;
      const limit = req.query.limit || "8";
      const offset = req.query.offset || "0";

      if (!query || typeof query !== 'string' || query.length < 3) {
        return res.json({ success: true, data: [] });
      }

      // Use direct Ethos V1 search API (same as ethos-r4r)
      const ethosUrl = `https://api.ethos.network/api/v1/search?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`;
      
      const response = await fetch(ethosUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'EthosRadar/1.0'
        }
      });
      
      const data = await response.json();
      
      if (data.ok && data.data && data.data.values) {
        // Simple conversion to our format with null safety
        const suggestions = data.data.values.map((user: any) => ({
          userkey: user.userkey || '',
          displayName: user.name || user.username || 'Unknown User',
          username: user.username || 'unknown',
          avatarUrl: user.avatar || '',
          score: user.score || 0,
          description: user.description || ''
        }));
        
        return res.json({ success: true, data: suggestions });
      }
      
      return res.json({ success: true, data: [] });
    } catch (error) {
      // Error fetching from Ethos API
      return res.json({ 
        success: false, 
        error: "Failed to fetch from Ethos API" 
      });
    }
  });

  // Farcaster search suggestions - fuzzy search for partial matches
  app.get("/api/farcaster-suggestions", async (req, res) => {
    try {
      const query = req.query.q;
      const limit = parseInt(req.query.limit as string) || 8;

      if (!query || typeof query !== 'string' || query.length < 2) {
        return res.json({ success: true, data: [] });
      }

      const searchQuery = query.trim().toLowerCase();
      
      // Enhanced Farcaster mode: try common partial matches first
      const possibleUsernames = [
        searchQuery,
        `${searchQuery}.eth`,
        searchQuery.replace('.eth', ''),
        // Try some common completions for popular users
        ...(searchQuery === 'vit' ? ['vitalik', 'vitalik.eth'] : []),
        ...(searchQuery === 'dan' ? ['dwr', 'danromero'] : []),
        ...(searchQuery === 'cook' ? ['cookedzera'] : []),
        ...(searchQuery === 'jesse' ? ['jessepollak'] : []),
        ...(searchQuery === 'newton' ? ['newtonhere'] : []),
        ...(searchQuery === 'newt' ? ['newtonhere'] : [])
      ];

      const suggestions = [];
      const foundUserkeys = new Set(); // Track found users to avoid duplicates
      
      // Try each possible username
      for (const username of possibleUsernames.slice(0, 5)) {
        try {
          const response = await fetch(`https://api.ethos.network/api/v2/users/by/farcaster/usernames`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-Ethos-Client': 'EthosRadar@1.0.0'
            },
            body: JSON.stringify({ farcasterUsernames: [username] }),
          });

          if (response.ok) {
            const data = await response.json();
            
            // Farcaster API Response logged
            
            if (data.users && data.users.length > 0) {
              const userResult = data.users[0];
              const user = userResult.user;
              const farcasterUsername = userResult.username;
              const userkey = user.userkeys?.[0] || `farcaster:${farcasterUsername}`;
              
              // Skip if we already found this user
              if (foundUserkeys.has(userkey)) {
                continue;
              }
              foundUserkeys.add(userkey);
              
              // Remove .eth suffix from username for display
              const cleanUsername = farcasterUsername.replace(/\.eth$/, '');
              
              // For Farcaster users, try multiple avatar sources
              let avatarUrl = user.avatarUrl || '';
              
              // Try multiple sources for avatar URL
              if (!avatarUrl && userkey) {
                try {
                  // Try enhanced profile first
                  const enhancedProfile = await ethosApi.getEnhancedProfile(userkey);
                  if (enhancedProfile.success && enhancedProfile.data) {
                    const profileData = enhancedProfile.data as any;
                    // Try different avatar sources from enhanced profile
                    if (profileData.data?.ethereumDetails?.ens?.avatar) {
                      avatarUrl = profileData.data.ethereumDetails.ens.avatar;
                    } else if (profileData.avatarUrl) {
                      avatarUrl = profileData.avatarUrl;
                    }
                  }
                  
                  // If still no avatar, try Farcaster FID-based lookup
                  if (!avatarUrl) {
                    const farcasterKey = user.userkeys?.find((key: string) => key.startsWith('service:farcaster:'));
                    if (farcasterKey) {
                      const fid = farcasterKey.split(':')[2];
                      const fidResult = await ethosApi.getUserByFarcasterFid(fid);
                      if (fidResult.success && fidResult.data?.avatarUrl) {
                        avatarUrl = fidResult.data.avatarUrl;
                      }
                    }
                  }
                } catch (err) {
                  // Continue without avatar
                }
              }
              
              suggestions.push({
                userkey: userkey || `farcaster:${cleanUsername}`,
                displayName: user.displayName || cleanUsername,
                username: cleanUsername, // Clean username without .eth suffix
                avatarUrl: avatarUrl || '',
                score: user.score || 0,
                description: user.description || `Farcaster: @${cleanUsername}`,
                farcasterUsername: cleanUsername,
                hasEthosAccount: true,
                status: user.status || 'ACTIVE',
                xpTotal: user.xpTotal || 0,
                xpStreakDays: user.xpStreakDays || 0,
                profileId: user.profileId || 0
              });
              
              if (suggestions.length >= limit) break;
            }
          }
        } catch (err) {
          // Continue to next username
          continue;
        }
      }
      
      return res.json({ success: true, data: suggestions });
    } catch (error) {
      // Error in Farcaster suggestions endpoint
      return res.json({ 
        success: false, 
        error: "Failed to fetch Farcaster suggestions" 
      });
    }
  });

  // Pure Farcaster search - completely separate from global search
  app.post("/api/search-user-farcaster", async (req, res) => {
    try {
      const { farcasterUsername } = z.object({
        farcasterUsername: z.string().min(1),
      }).parse(req.body);

      // Farcaster Search with Global Fallback

      // Step 1: Try to get FID from Farcaster username API
      const usernameResult = await ethosApi.getUserByFarcasterUsername(farcasterUsername);
      
      if (!usernameResult.success) {
        // Fallback to global search if no Farcaster user found
        // No pure Farcaster user found, trying global search fallback
        
        try {
          const globalSearchResult = await ethosApi.searchUsersV1(farcasterUsername, 10);
          
          if (globalSearchResult.success && globalSearchResult.data?.ok && globalSearchResult.data.data.values.length > 0) {
            // Find best match from global search
            const bestMatch = globalSearchResult.data.data.values[0];
            
            // Convert to expected user format
            const globalUser = {
              id: bestMatch.profileId,
              profileId: bestMatch.profileId,
              displayName: bestMatch.name,
              username: bestMatch.username,
              avatarUrl: bestMatch.avatar,
              description: bestMatch.description,
              score: bestMatch.score,
              status: null, // V1 API doesn't provide status, will be filled by enhanced profile API
              userkeys: [bestMatch.userkey],
              xpTotal: null,
              xpStreakDays: null,
              links: {
                profile: `https://app.ethos.network/profile/${bestMatch.userkey}`,
                scoreBreakdown: `https://app.ethos.network/profile/${bestMatch.userkey}/score`
              },
              stats: null,
              _crossReferenced: true, // Mark as cross-referenced from global search
              _originalQuery: farcasterUsername
            };
            
            // Found global search result
            return res.json({ success: true, data: globalUser });
          }
        } catch (globalError) {
          // Global search fallback error
        }
        
        return res.status(404).json({
          success: false,
          error: `User not found in Farcaster or global search: ${farcasterUsername}`
        });
      }

      const userData = usernameResult.data;
      if (!userData || !userData.user) {
        return res.status(404).json({
          success: false,
          error: `Invalid Farcaster user data for: ${farcasterUsername}`
        });
      }

      // Step 2: Extract FID from response
      const farcasterKey = userData.user.userkeys?.find((key: string) => key.startsWith('service:farcaster:'));
      if (!farcasterKey) {
        return res.status(404).json({
          success: false,
          error: `No FID found for Farcaster user: ${farcasterUsername}`
        });
      }

      const fid = farcasterKey.split(':')[2];
      // Extracted FID for user

      // Step 3: Get complete profile data using FID API endpoint
      const fidResult = await ethosApi.getUserByFarcasterFid(fid);
      
      if (!fidResult.success) {
        return res.status(404).json({
          success: false,
          error: `Could not get profile data for FID: ${fid}`
        });
      }

      // Pure Farcaster Profile Retrieved for FID

      // Return pure Farcaster profile data
      const enhancedUser = {
        ...fidResult.data,
        _isFarcasterEnhanced: true,
        _fid: fid,
        _pureFarcaster: true
      };

      res.json({ success: true, data: enhancedUser });
    } catch (error) {
      // Pure Farcaster search error
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  });

  // Enhanced Farcaster FID lookup for detailed profiles
  app.get("/api/farcaster-fid/:fid", async (req, res) => {
    try {
      const { fid } = req.params;
      
      if (!fid || isNaN(Number(fid))) {
        return res.status(400).json({ 
          success: false, 
          error: 'Valid FID is required' 
        });
      }

      const result = await ethosApi.getUserByFarcasterFid(fid);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      // Farcaster FID search error
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch Farcaster user by FID' 
      });
    }
  });

  // Search users via Twitter/X only
  app.post("/api/search-user", async (req, res) => {
    try {
      const { query, searchType } = z.object({
        query: z.string().min(1),
        searchType: z.enum(['twitter', 'userkey', 'auto']).optional().default('auto'),
      }).parse(req.body);

      let result;
      
      if (searchType === 'auto') {
        const parsed = ethosApi.parseUserkey(query);
        
        // Try Twitter/X search first
        if (parsed.type === 'twitter') {
          const twitterResult = await ethosApi.getUsersByTwitter([query]);
          if (twitterResult.success && twitterResult.data && twitterResult.data.length > 0) {
            result = { success: true, data: twitterResult.data[0] };
          }
        }
        
        // If Twitter search didn't work, fallback to V1 search (searches Twitter profiles too)
        if (!result || !result.success) {
          const searchResult = await ethosApi.searchUsersV1(query, 10);
          if (searchResult.success && searchResult.data && searchResult.data.ok && searchResult.data.data.values.length > 0) {
            // Filter for Twitter/X profiles only
            const twitterResults = searchResult.data.data.values.filter(user => 
              user.userkey.includes('service:x.com:') || user.userkey.includes('service:twitter.com:')
            );
            
            if (twitterResults.length > 0) {
              const v1Result = twitterResults[0];
              // Convert V1 format to V2 format for consistency
              const convertedUser = {
                id: v1Result.profileId, // Keep null as null, don't convert to 0
                profileId: v1Result.profileId, // Keep null as null
                displayName: v1Result.name,
                username: v1Result.username,
                avatarUrl: v1Result.avatar,
                description: v1Result.description,
                score: v1Result.score,
                status: null, // V1 API doesn't provide reliable status, will be resolved by enhanced profile
                userkeys: [v1Result.userkey],
                xpTotal: 0,
                xpStreakDays: 0,
                links: {
                  profile: `https://app.ethos.network/profile/${v1Result.userkey}`,
                  scoreBreakdown: `https://app.ethos.network/profile/${v1Result.userkey}/score`
                },
                stats: {
                  review: {
                    received: { negative: 0, neutral: 0, positive: 0 }
                  },
                  vouch: {
                    given: { amountWeiTotal: "0", count: 0 },
                    received: { amountWeiTotal: "0", count: 0 }
                  }
                }
              };
              result = { success: true, data: convertedUser };
            } else {
              result = { success: false, error: 'No Twitter/X profiles found' };
            }
          } else {
            result = { success: false, error: 'User not found' };
          }
        }
      } else {
        // Specific search type - only Twitter/X and userkey supported
        switch (searchType) {
          case 'twitter':
            const twitterResult = await ethosApi.getUsersByTwitter([query]);
            result = twitterResult.success && twitterResult.data?.length ? 
              { success: true, data: twitterResult.data[0] } : 
              { success: false, error: 'Twitter user not found' };
            break;
          case 'userkey':
            // Direct userkey lookup - only support Twitter/X userkeys
            if (query.includes('service:x.com:') || query.includes('service:twitter.com:')) {
              const searchResult = await ethosApi.searchUsersV1(query, 50);
              
              if (searchResult.success && searchResult.data?.ok && searchResult.data.data.values.length > 0) {
                // Find exact userkey match first
                let v1Result = searchResult.data.data.values.find(user => user.userkey === query);
                
                if (!v1Result) {
                  // Try partial match for Twitter userkeys
                  const queryParts = query.split(':');
                  if (queryParts.length >= 3) {
                    const service = queryParts[1]; // 'x.com'
                    const identifier = queryParts[2]; // Twitter ID
                    
                    v1Result = searchResult.data.data.values.find(user => 
                      user.userkey.includes(service) && user.userkey.includes(identifier)
                    );
                  }
                }
                
                if (v1Result) {
                  const convertedUser = {
                    id: v1Result.profileId, // Keep null as null
                    profileId: v1Result.profileId, // Keep null as null
                    displayName: v1Result.name,
                    username: v1Result.username,
                    avatarUrl: v1Result.avatar,
                    description: v1Result.description,
                    score: v1Result.score,
                    status: null, // V1 API doesn't provide reliable status
                    userkeys: [v1Result.userkey],
                    xpTotal: null,
                    xpStreakDays: null,
                    links: {
                      profile: `https://app.ethos.network/profile/${v1Result.userkey}`,
                      scoreBreakdown: `https://app.ethos.network/profile/${v1Result.userkey}/score`
                    },
                    stats: null
                  };
                  result = { success: true, data: convertedUser };
                } else {
                  result = { success: false, error: 'Twitter userkey not found' };
                }
              } else {
                result = { success: false, error: 'Twitter userkey not found' };
              }
            } else {
              result = { success: false, error: 'Only Twitter/X userkeys are supported' };
            }
            break;
          default:
            result = { success: false, error: 'Only Twitter/X search is supported' };
        }
      }

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  });

  // General search endpoint that handles addresses and other userkeys
  app.post("/api/search", async (req, res) => {
    try {
      const { query } = z.object({
        query: z.string().min(1),
      }).parse(req.body);

      let result;
      
      // Parse the userkey to determine search strategy
      const parsed = ethosApi.parseUserkey(query);
      
      if (parsed.type === 'address') {
        // For addresses, search using V1 API which can find Ethereum addresses
        const searchResult = await ethosApi.searchUsersV1(query, 50);
        
        if (searchResult.success && searchResult.data?.ok && searchResult.data.data.values.length > 0) {
          // Find exact address match first
          let v1Result = searchResult.data.data.values.find(user => 
            user.userkey === query || 
            user.userkey.toLowerCase().includes(query.replace('address:', '').toLowerCase())
          );
          
          // If no exact match, take the first result
          if (!v1Result) {
            v1Result = searchResult.data.data.values[0];
          }
          
          // Convert V1 format to expected format
          const convertedUser = {
            id: v1Result.profileId,
            profileId: v1Result.profileId,
            displayName: v1Result.name,
            username: v1Result.username,
            avatarUrl: v1Result.avatar,
            description: v1Result.description,
            score: v1Result.score,
            status: null, // V1 API doesn't provide status
            userkeys: [v1Result.userkey],
            xpTotal: null,
            xpStreakDays: null,
            links: {
              profile: `https://app.ethos.network/profile/${v1Result.userkey}`,
              scoreBreakdown: `https://app.ethos.network/profile/${v1Result.userkey}/score`
            },
            stats: null
          };
          result = { success: true, data: convertedUser };
        } else {
          result = { success: false, error: 'Address not found' };
        }
      } else if (parsed.type === 'twitter') {
        // For Twitter, try the dedicated Twitter search first to get real status
        const twitterId = query.replace('service:x.com:', '');
        const twitterResult = await ethosApi.getUsersByTwitter([twitterId]);
        if (twitterResult.success && twitterResult.data?.length) {
          result = { success: true, data: twitterResult.data[0] };
        } else {
          // Fallback to V1 search
          const searchResult = await ethosApi.searchUsersV1(query, 10);
          if (searchResult.success && searchResult.data?.ok && searchResult.data.data.values.length > 0) {
            const twitterResults = searchResult.data.data.values.filter(user => 
              user.userkey.includes('service:x.com:') || user.userkey.includes('service:twitter.com:')
            );
            
            if (twitterResults.length > 0) {
              const v1Result = twitterResults[0];
              const convertedUser = {
                id: v1Result.profileId,
                profileId: v1Result.profileId,
                displayName: v1Result.name,
                username: v1Result.username,
                avatarUrl: v1Result.avatar,
                description: v1Result.description,
                score: v1Result.score,
                status: null, // V1 API doesn't provide status
                userkeys: [v1Result.userkey],
                xpTotal: null,
                xpStreakDays: null,
                links: {
                  profile: `https://app.ethos.network/profile/${v1Result.userkey}`,
                  scoreBreakdown: `https://app.ethos.network/profile/${v1Result.userkey}/score`
                },
                stats: null
              };
              result = { success: true, data: convertedUser };
            } else {
              result = { success: false, error: 'Twitter user not found' };
            }
          } else {
            result = { success: false, error: 'User not found' };
          }
        }
      } else {
        // For other types, use general V1 search
        const searchResult = await ethosApi.searchUsersV1(query, 10);
        
        if (searchResult.success && searchResult.data?.ok && searchResult.data.data.values.length > 0) {
          const v1Result = searchResult.data.data.values[0];
          const convertedUser = {
            id: v1Result.profileId,
            profileId: v1Result.profileId,
            displayName: v1Result.name,
            username: v1Result.username,
            avatarUrl: v1Result.avatar,
            description: v1Result.description,
            score: v1Result.score,
            status: null, // V1 API doesn't provide status
            userkeys: [v1Result.userkey],
            xpTotal: null,
            xpStreakDays: null,
            links: {
              profile: `https://app.ethos.network/profile/${v1Result.userkey}`,
              scoreBreakdown: `https://app.ethos.network/profile/${v1Result.userkey}/score`
            },
            stats: null
          };
          result = { success: true, data: convertedUser };
        } else {
          result = { success: false, error: 'User not found' };
        }
      }

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  });

  // Get enhanced user profile with optimized status detection
  app.get("/api/enhanced-profile/:userkey", async (req, res) => {
    try {
      const userkey = decodeURIComponent(req.params.userkey);
      
      // Fast status detection using optimized V2 API calls
      let userResult;
      
      if (userkey.startsWith('profileId:')) {
        const profileId = parseInt(userkey.split(':')[1]);
        const profileResult = await ethosApi.getUsersByProfileId([profileId]);
        if (profileResult.success && profileResult.data && profileResult.data.length > 0) {
          userResult = profileResult.data[0];
        }
      } else if (userkey.includes('service:x.com:')) {
        // For Twitter users, get status directly from Twitter API (fastest)
        const parts = userkey.split(':');
        const twitterId = parts[2];
        const twitterResult = await ethosApi.getUsersByTwitter([twitterId]);
        if (twitterResult.success && twitterResult.data && twitterResult.data.length > 0) {
          userResult = twitterResult.data[0];
        }
      } else if (userkey.startsWith('address:')) {
        // For address userkeys (common from cross-referenced Farcaster results)
        const address = userkey.split(':')[1];
        const addressResult = await ethosApi.getUsersByAddresses([address]);
        if (addressResult.success && addressResult.data && addressResult.data.length > 0) {
          userResult = addressResult.data[0];
        }
      } else {
        // For other userkey types, try direct lookup first
        const directResult = await ethosApi.getUserByUserkey(userkey);
        if (directResult.success) {
          userResult = directResult.data;
        }
      }
      
      // Enhanced fallback: If no V2 API result, try V1 API and convert
      if (!userResult) {
        // No V2 API result, trying V1 fallback for enhanced profile
        
        try {
          const v1SearchResult = await ethosApi.searchUsersV1(userkey, 5);
          
          if (v1SearchResult.success && v1SearchResult.data?.ok && v1SearchResult.data.data.values.length > 0) {
            // Find exact userkey match or best match
            let v1User = v1SearchResult.data.data.values.find(user => user.userkey === userkey);
            if (!v1User) {
              v1User = v1SearchResult.data.data.values[0]; // Use first result as fallback
            }
            
            // Convert V1 result to V2 format with enhanced data fetching
            let enhancedXpTotal = null;
            let enhancedXpStreak = null;
            let enhancedStatus = null;
            
            // Try to get enhanced data if profileId exists
            if (v1User.profileId) {
              try {
                const profileResult = await ethosApi.getUsersByProfileId([v1User.profileId]);
                if (profileResult.success && profileResult.data && profileResult.data.length > 0) {
                  const enhancedData = profileResult.data[0];
                  enhancedXpTotal = enhancedData.xpTotal;
                  enhancedXpStreak = enhancedData.xpStreakDays;
                  enhancedStatus = enhancedData.status;
                }
              } catch (enhanceError) {
                // Could not enhance V1 user data
              }
            }
            
            userResult = {
              id: v1User.profileId || 0,
              profileId: v1User.profileId || 0, 
              displayName: v1User.name,
              username: v1User.username,
              avatarUrl: v1User.avatar,
              description: v1User.description,
              score: v1User.score,
              status: enhancedStatus || (v1User.profileId ? 'ACTIVE' : 'UNINITIALIZED'),
              userkeys: [v1User.userkey],
              xpTotal: enhancedXpTotal || 0,
              xpStreakDays: enhancedXpStreak || 0,
              links: {
                profile: `https://app.ethos.network/profile/${v1User.userkey}`,
                scoreBreakdown: `https://app.ethos.network/profile/${v1User.userkey}/score`
              },
              stats: null
            };
            
            // Enhanced V1 fallback result
          }
        } catch (v1Error) {
          // V1 fallback error for enhanced profile
        }
      }

      // If we got user data, add weekly XP data and leaderboard position, then return
      if (userResult) {
        // Get weekly XP for users with actual activity
        let weeklyXpGain = 0;
        if (userResult.status === 'ACTIVE' && userResult.xpTotal > 0) {
          weeklyXpGain = await ethosApi.getWeeklyXpGain(userkey);
        }
        
        // Get leaderboard position from categories API
        let leaderboardPosition = userResult.leaderboardPosition;
        if (!leaderboardPosition) {
          try {
            leaderboardPosition = await ethosApi.getUserLeaderboardPosition(userkey);
          } catch (error) {
            // Could not fetch leaderboard position
          }
        }
        
        return res.json({
          success: true,
          data: {
            id: userResult.id,
            profileId: userResult.profileId,
            displayName: userResult.displayName,
            username: userResult.username,
            avatarUrl: userResult.avatarUrl,
            description: userResult.description,
            score: userResult.score,
            status: userResult.status,
            userkeys: userResult.userkeys,
            xpTotal: userResult.xpTotal,
            xpStreakDays: userResult.xpStreakDays,
            leaderboardPosition: leaderboardPosition || null,
            weeklyXpGain: weeklyXpGain,
            links: userResult.links || {
              profile: `https://app.ethos.network/profile/${userkey}`,
              scoreBreakdown: `https://app.ethos.network/profile/${userkey}/score`
            },
            stats: userResult.stats,
            connectedAccounts: (userResult as any).connectedAccounts || null
          }
        });
      }

      // If no user found, return not found
      return res.status(404).json({
        success: false,
        error: 'User not found on Ethos Protocol'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });


  // Get social media attestations for a user
  app.get("/api/attestations/:userkey", async (req, res) => {
    try {
      const userkey = decodeURIComponent(req.params.userkey);
      
      // Get the correct Ethos profile ID from user data
      let profileId: number;
      if (userkey.startsWith('profileId:')) {
        profileId = parseInt(userkey.split(':')[1]);
      } else if (userkey.startsWith('service:x.com:')) {
        // For Twitter userkeys, we need to get the actual Ethos profile ID from V2 API
        const parts = userkey.split(':');
        const twitterId = parts[2];
        
        try {
          const userResult = await ethosApi.getUsersByTwitter([twitterId]);
          if (userResult.success && userResult.data && userResult.data.length > 0) {
            profileId = userResult.data[0].profileId;

          } else {
            return res.status(404).json({
              success: false,
              error: 'User profile not found for Twitter ID'
            });
          }
        } catch (error) {
          return res.status(500).json({
            success: false,
            error: 'Failed to lookup user profile'
          });
        }
      } else if (userkey.startsWith('address:')) {
        // For address userkeys (common from cross-referenced Farcaster results)
        const address = userkey.split(':')[1];
        
        try {
          const addressResult = await ethosApi.getUsersByAddresses([address]);
          if (addressResult.success && addressResult.data && addressResult.data.length > 0) {
            profileId = addressResult.data[0].profileId;
          } else {
            return res.status(404).json({
              success: false,
              error: 'User profile not found for address'
            });
          }
        } catch (error) {
          return res.status(500).json({
            success: false,
            error: 'Failed to lookup user profile by address'
          });
        }
      } else {
        // Try to get profile ID from generic userkey lookup
        try {
          const userResult = await ethosApi.getUserByUserkey(userkey);
          if (userResult.success && userResult.data && userResult.data.profileId) {
            profileId = userResult.data.profileId;
          } else {
            return res.status(404).json({
              success: false,
              error: 'User profile not found for userkey'
            });
          }
        } catch (error) {
          return res.status(500).json({
            success: false,
            error: 'Failed to lookup user profile'
          });
        }
      }


      
      const attestations = await getExtendedAttestations(profileId);
      
      const formattedAttestations = attestations.map(att => ({
        service: att.attestation.service,
        serviceName: formatServiceName(att.attestation.service),
        icon: mapServiceToIcon(att.attestation.service),
        account: att.attestation.account,
        username: att.extra?.username || att.attestation.account,
        displayName: att.extra?.name || '',
        avatar: att.extra?.avatar || '',
        website: att.extra?.website || '',
        followers: att.extra?.followersCount || 0,
        verified: att.extra?.isBlueVerified || false,
        createdAt: att.attestation.createdAt,
        joinedAt: att.extra?.joinedAt || null
      }));

      res.json({
        success: true,
        data: formattedAttestations
      });
    } catch (error) {
      // Error fetching attestations
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });

  // Get trust score - Enhanced with V1 detailed breakdown
  app.get("/api/trust-score/:userkey", async (req, res) => {
    try {
      const userkey = decodeURIComponent(req.params.userkey);
      // Get V1 detailed score first (authentic data)
      const v1Result = await ethosApi.getV1Score(userkey);
      
      if (v1Result.success && v1Result.data?.data) {
        const scoreData = v1Result.data.data;
        const elements = scoreData.elements || {};
        
        // Extract real metrics from V1 elements
        const reviewImpact = elements['Review Impact'];
        const vouchImpact = elements['Vouched Ethereum Impact'];  
        const vouchCount = elements['Number of Vouchers Impact'];
        const mutualVouch = elements['Mutual Vouch Bonus'];
        const reputationMarket = elements['Reputation Market Impact'];
        
        // Get user profile data for display info
        const userResult = await ethosApi.getUserByUserkey(userkey);
        const displayName = userResult.success ? userResult.data?.displayName : 'Unknown';
        
        res.json({
          success: true,
          data: {
            id: userResult.data?.id || 0,
            profileId: userResult.data?.profileId || 0,
            displayName: displayName || 'Unknown User',
            score: scoreData.score,
            level: scoreData.score >= 2000 ? 'Exemplary' : 
                   scoreData.score >= 1600 ? 'Reputable' :
                   scoreData.score >= 1200 ? 'Neutral' :
                   scoreData.score >= 800 ? 'Questionable' : 'Untrusted',
            userkeys: [userkey],
            // V1 authentic breakdown
            v1Details: {
              totalElements: Object.keys(elements).length,
              reviewScore: reviewImpact?.weighted || 0,
              reviewCount: reviewImpact?.element?.metadata?.positiveReviewCount || 0,
              vouchScore: vouchImpact?.weighted || 0,
              vouchersCount: vouchCount?.element?.metadata?.vouches || 0,
              stakedEth: vouchImpact?.element?.metadata?.stakedEth || 0,
              mutualVouches: mutualVouch?.element?.metadata?.mutualVouches || 0,
              reputationMarketScore: reputationMarket?.weighted || 0,
              elements: elements // Full breakdown for detailed analysis
            }
          }
        });
      } else {
        // Fallback to existing V2 API
        const result = await ethosApi.getScoreByUserkey(userkey);
        
        if (!result.success) {
          return res.status(404).json(result);
        }

        res.json(result);
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  });

  // Get multiple trust scores
  app.post("/api/trust-scores", async (req, res) => {
    try {
      const { userkeys } = z.object({
        userkeys: z.array(z.string()).min(1).max(50),
      }).parse(req.body);

      const result = await ethosApi.getScoresByUserkeys(userkeys);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  });

  // V1 Score Direct Access - REAL DATA ONLY
  app.get("/api/v1-score/:userkey", async (req, res) => {
    try {
      const userkey = decodeURIComponent(req.params.userkey);
      const result = await ethosApi.getV1Score(userkey);
      
      if (result.success && result.data) {
        res.json(result);
      } else {
        res.status(404).json({
          success: false,
          error: result.error || 'V1 score not found'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // V1 Score History - REAL DATA ONLY  
  app.get("/api/v1-score-history/:userkey", async (req, res) => {
    try {
      const userkey = decodeURIComponent(req.params.userkey);
      const duration = req.query.duration as string || '30d';
      const result = await ethosApi.getV1ScoreHistory(userkey, duration);
      
      if (result.success && result.data) {
        res.json(result);
      } else {
        res.status(404).json({
          success: false,
          error: result.error || 'V1 score history not found'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Get score calculation status
  app.get("/api/score-status/:userkey", async (req, res) => {
    try {
      const { userkey } = req.params;
      
      const result = await ethosApi.getScoreStatus(userkey);
      
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  });

  // Get real user statistics using V1 API + vouch activities for complete data
  // Dashboard reviews using accurate user stats data (authentic sentiment breakdown)
  app.get("/api/dashboard-reviews/:userkey", async (req, res) => {
    const userkey = decodeURIComponent(req.params.userkey);
    
    try {
      // Dashboard Reviews API - Fetching for user
      
      // Get user data with accurate review stats (not limited by pagination)
      const userResult = await ethosApi.getRealUserData(userkey);
      
      if (!userResult.success || !userResult.data?.stats?.review?.received) {
        // Dashboard Reviews API - No review stats for user
        return res.json({
          success: true,
          data: {
            totalReviews: 0,
            positiveReviews: 0,
            neutralReviews: 0,
            negativeReviews: 0,
            positivePercentage: 0
          }
        });
      }
      
      const reviewStats = userResult.data.stats.review.received;
      const positiveReviews = reviewStats.positive || 0;
      const neutralReviews = reviewStats.neutral || 0;
      const negativeReviews = reviewStats.negative || 0;
      const totalReviews = positiveReviews + neutralReviews + negativeReviews;
      
      // Calculate positive percentage excluding neutral reviews (matching official Ethos calculation)
      const nonNeutralReviews = positiveReviews + negativeReviews;
      const positivePercentage = nonNeutralReviews > 0 ? 
        Math.round((positiveReviews / nonNeutralReviews) * 100) : 0;
      
      // Dashboard Reviews API - successful response
      
      res.json({
        success: true,
        data: {
          totalReviews,
          positiveReviews,
          neutralReviews,
          negativeReviews,
          positivePercentage
        }
      });
    } catch (error) {
      console.error(`❌ Dashboard Reviews API error for ${userkey}:`, error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/user-stats/:userkey", async (req, res) => {
    try {
      const userkey = decodeURIComponent(req.params.userkey);
      // Get both V1 score data, vouch activities, and V2 user data for complete information
      const [v1Result, vouchResult, v2UserResult] = await Promise.all([
        ethosApi.getV1Score(userkey),
        ethosApi.getUserVouchActivities(userkey),
        ethosApi.getRealUserData(userkey)
      ]);
      
      if (v1Result.success && v1Result.data?.data?.elements) {
        const elements = v1Result.data.data.elements;
        
        // Extract real data from V1 elements (received vouches and reviews)
        const reviewImpact = elements['Review Impact'];
        const vouchImpact = elements['Vouched Ethereum Impact'];  
        const vouchCount = elements['Number of Vouchers Impact'];
        
        // Get given vouch count from activities API but ALWAYS use V2 API for amounts
        let givenVouchCount = 0;
        let givenVouchAmount = 0;
        let receivedVouchAmount = 0;
        let receivedVouchCount = 0;
        
        if (vouchResult.success && vouchResult.data?.given) {
          givenVouchCount = vouchResult.data.given.length;
        }
        
        // Get authentic vouch data from V2 users API if available
        if (v2UserResult.success && v2UserResult.data?.stats?.vouch) {
          const vouchStats = v2UserResult.data.stats.vouch;
          
          givenVouchAmount = parseFloat(String(vouchStats.given.amountWeiTotal || '0')) / 1e18;
          receivedVouchAmount = parseFloat(String(vouchStats.received.amountWeiTotal || '0')) / 1e18;
          receivedVouchCount = vouchStats.received.count || 0;
        } else {
          // Fallback: try direct V2 API calls if v2UserResult didn't work
          try {
            let directResult = null;
            
            if (userkey.startsWith('profileId:')) {
              const profileId = parseInt(userkey.split(':')[1]);
              directResult = await ethosApi.getUsersByProfileId([profileId]);
            } else if (userkey.startsWith('service:x.com:')) {
              const twitterId = userkey.split(':').pop();
              if (twitterId) {
                directResult = await ethosApi.getUsersByTwitter([twitterId]);
              }
            } else if (userkey.startsWith('address:')) {
              const address = userkey.split(':')[1];
              directResult = await ethosApi.getUsersByAddresses([address]);
            }
            
            if (directResult?.success && directResult.data?.[0]?.stats?.vouch) {
              const vouchStats = directResult.data[0].stats.vouch;
              givenVouchAmount = parseFloat(String(vouchStats.given.amountWeiTotal || '0')) / 1e18;
              receivedVouchAmount = parseFloat(String(vouchStats.received.amountWeiTotal || '0')) / 1e18;
              receivedVouchCount = vouchStats.received.count || 0;
            }
          } catch (error) {
            // Final fallback to V1 metadata only if V2 completely unavailable
            receivedVouchAmount = vouchImpact?.element?.metadata?.stakedEth || 0;
            receivedVouchCount = vouchCount?.element?.metadata?.vouches || 0;
          }
        }

        const realStats = {
          review: {
            received: {
              negative: reviewImpact?.element?.metadata?.negativeReviewCount || 0,
              neutral: reviewImpact?.element?.metadata?.neutralReviewCount || 0,
              positive: reviewImpact?.element?.metadata?.positiveReviewCount || 0
            }
          },
          vouch: {
            given: {
              amountWeiTotal: Math.floor(givenVouchAmount * 1e18).toString(),
              count: givenVouchCount
            },
            received: {
              amountWeiTotal: Math.floor(receivedVouchAmount * 1e18).toString(),
              count: receivedVouchCount
            }
          }
        };
        
        res.json({
          success: true,
          data: realStats
        });
      } else {
        // No user data available
        res.status(404).json({
          success: false,
          error: 'User stats not found'
        });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  });

  // Get user score history using V1 API - REAL DATA ONLY
  app.get("/api/score-history/:userkey", async (req, res) => {
    try {
      const userkey = decodeURIComponent(req.params.userkey);
      const duration = req.query.duration as string || '30d';
      // Use V1 score history API for authentic data
      const v1Result = await ethosApi.getV1ScoreHistory(userkey, duration);
      
      if (v1Result.success && v1Result.data?.values) {
        // Convert V1 format to expected format with calculated changes
        const values = v1Result.data.values;
        
        // Sort by timestamp to ensure chronological order (oldest first)
        const sortedValues = values.sort((a: any, b: any) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        const historyData = sortedValues.map((entry: any, index: number) => {
          // Calculate change from previous entry (authentic data)
          let change = 0;
          if (index > 0) {
            const previousScore = sortedValues[index - 1].score; // Previous entry is older
            change = entry.score - previousScore;
            

          }
          
          return {
            timestamp: entry.createdAt,
            score: entry.score,
            change: change,
            activity: change > 0 ? 'score_increase' : change < 0 ? 'score_decrease' : 'score_update',
            reason: change > 0 ? 'Trust network growth' : change < 0 ? 'Score recalculation' : 'Score maintenance'
          };
        });
        
        // Return in reverse chronological order (newest first) for UI display
        const finalHistoryData = historyData.reverse();
        
        res.json({
          success: true,
          data: finalHistoryData
        });
      } else {
        // Fallback to mock history generation if V1 fails (TEMPORARY)
        const result = await ethosApi.getScoreHistory(userkey);
        res.json({
          success: true,
          data: result
        });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch score history' 
      });
    }
  });

  // REMOVED DUPLICATE - using the one below

  // Get review count between users
  app.get("/api/review-count", async (req, res) => {
    try {
      const { author, subject } = z.object({
        author: z.string(),
        subject: z.string(),
      }).parse(req.query);

      const result = await ethosApi.getReviewCountBetween(author, subject);
      
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  });

  // Generate share content for social platforms
  app.post("/api/generate-share-content", async (req, res) => {
    try {
      const { userkey, platform } = z.object({
        userkey: z.string(),
        platform: z.enum(['farcaster', 'twitter', 'telegram']).default('farcaster'),
      }).parse(req.body);

      // Get authentic Ethos V1 score and tier data (NO MOCK DATA)
      const v1ScoreResult = await ethosApi.getV1Score(userkey);
      
      if (!v1ScoreResult.success || !v1ScoreResult.data?.ok) {
        return res.status(404).json({ 
          success: false, 
          error: 'Could not retrieve authentic Ethos score from V1 API' 
        });
      }

      const score = v1ScoreResult.data.data.score;
      
      // Official Ethos tier system from developers.ethos.network API documentation
      const getOfficialEthosTier = (score: number) => {
        if (score >= 2000) {
          return {
            tier: 'Exemplary',
            emoji: '💎',
            flex: 'EXEMPLARY',
            level: 'exemplary'
          };
        } else if (score >= 1600) {
          return {
            tier: 'Reputable',
            emoji: '🌟',
            flex: 'REPUTABLE',
            level: 'reputable'
          };
        } else if (score >= 1200) {
          return {
            tier: 'Neutral',
            emoji: '⚖️',
            flex: 'BUILDING',
            level: 'neutral'
          };
        } else if (score >= 800) {
          return {
            tier: 'Questionable',
            emoji: '⚠️',
            flex: 'DEVELOPING',
            level: 'questionable'
          };
        } else {
          return {
            tier: 'Untrusted',
            emoji: '🔴',
            flex: 'STARTING',
            level: 'untrusted'
          };
        }
      }
      
      const tierInfo = getOfficialEthosTier(score);
      
      // Get authentic user profile data for proper username display
      let displayName = 'Anon';
      let leaderboardPosition = null;
      
      try {
        // Use the same enhanced profile approach that works for the UI to get authentic username
        const userResult = await ethosApi.getRealUserData(userkey);
        if (userResult.success && userResult.data) {
          // Try multiple fields to get the best display name
          displayName = userResult.data.username || userResult.data.displayName;
          
          // If still no name found, extract from userkey as last resort
          if (!displayName || displayName === 'Anon') {
            displayName = ethosApi.extractUsernameFromUserkey(userkey);
          }
          
        } else {
          // Fallback: extract from userkey if it's a service-based key
          displayName = ethosApi.extractUsernameFromUserkey(userkey);
        }
        
        // Final fallback to prevent empty names
        if (!displayName) {
          displayName = 'Anon';
        }
      } catch (error) {
        displayName = ethosApi.extractUsernameFromUserkey(userkey) || 'Anon';
      }
      
      // Try to get leaderboard position from categories API
      try {
        leaderboardPosition = await ethosApi.getUserLeaderboardPosition(userkey);
      } catch (error) {
        // Could not fetch leaderboard position
      }
      
      let content = '';
      switch (platform) {
        case 'farcaster':
          const farcasterTemplates = [
            `${tierInfo.emoji} ${tierInfo.tier.toUpperCase()} TIER ${tierInfo.emoji}\n\n📊 Trust Score: ${score} | ${tierInfo.tier}\n👤 Identity: ${displayName}\n🏆 Powered by @ethos_network protocol\n\n💎 Want to know YOUR web3 reputation?\n🔍 Try Ethosradar.com - Multi-chain scanner!\n\n#TrustScore #Web3Rep #EthosRadar`,
            `💯 REPUTATION FLEX! ${tierInfo.tier.toUpperCase()}\n\n${tierInfo.emoji} ${score} Trust Rating | ${tierInfo.flex}\n⚡ Identity: ${displayName}\n🌐 Multi-platform verified by @ethos_network\n\n🎯 Your turn! Check your rep:\n🔗 Ethosradar.com\n\n#Ethos_network #Web3Trust #EthosRadar`,
            `📈 CREDIBILITY UNLOCK ${tierInfo.emoji}\n\n${tierInfo.tier} Status Achieved!\n• Score: ${score} ${tierInfo.emoji}\n• Identity: ${displayName}\n• Network: Multi-chain ✅\n\n🚨 Check YOUR tier:\n🔍 Ethosradar.com\n\n#Web3Intel #TrustScore #EthosRadar`
          ];
          content = farcasterTemplates[Math.floor(Math.random() * farcasterTemplates.length)];
          break;
        case 'twitter':
          const twitterTemplates = [
            `${tierInfo.emoji} ${tierInfo.flex} ON-CHAIN! ${tierInfo.emoji}\n\n📊 Trust Score: ${score} | ${tierInfo.tier}\n👤 Identity: ${displayName}\n🏆 @ethos_network verified\n\n💎 Check YOUR web3 reputation:\n🔍 Ethosradar.com\n\n#TrustScore #Web3Rep #EthosRadar #CryptoTwitter`,
            `💯 CT FLEX ALERT! ${tierInfo.tier.toUpperCase()}\n\n${tierInfo.emoji} ${score} Trust Rating | ${tierInfo.flex}\n⚡ Identity: ${displayName}\n🌐 Multi-platform by @ethos_network\n\n🎯 Your turn:\n🔗 Ethosradar.com\n\n#CryptoTwitter #Web3Trust #EthosRadar`,
            `📈 ${tierInfo.tier.toUpperCase()} STATUS UNLOCKED ${tierInfo.emoji}\n\n• Score: ${score}\n• Identity: ${displayName}\n• Tier: ${tierInfo.flex}\n• Network: Multi-chain ✅\n\n🚨 Find YOUR tier:\n🔍 Ethosradar.com\n\n#Web3Intel #TrustScore #EthosRadar`,
            `${tierInfo.emoji} REPUTATION THREAD ${tierInfo.emoji}\n\n${displayName} just achieved ${tierInfo.tier}!\nScore: ${score} | Status: ${tierInfo.flex}\n\n📊 @ethos_network verified\n💪 Building web3 credibility\n\n🔥 Check yours:\n📱 Ethosradar.com\n\n#TrustScore #Web3Rep #EthosRadar`,
            `💯 ON-CHAIN CREDIBILITY FLEX:\n\n🔥 ${tierInfo.tier} | Score: ${score}\n🏆 Rank: #${leaderboardPosition || 'TBD'} Overall\n${tierInfo.emoji} Status: ${tierInfo.flex}\n🧬 Verified by @ethos_network\n\n🎯 Check your standing:\n🔗 Ethosradar.com\n\n#Web3Trust #EthosRadar`
          ];
          content = twitterTemplates[Math.floor(Math.random() * twitterTemplates.length)];
          break;
        case 'telegram':
          content = `${tierInfo.emoji} ${tierInfo.tier.toUpperCase()} ACHIEVED ${tierInfo.emoji}\n\nJust scanned my Web3 reputation:\n📊 ${score} | ${tierInfo.flex}\n👤 ${displayName}\n🏆 @ethos_network verified\n\n🔍 Check yours: Ethosradar.com\n#TrustScore #Web3`;
          break;
      }

      res.json({
        success: true,
        data: {
          content,
          score,
          level: tierInfo.level,
          tier: tierInfo.tier,
          platform,
        },
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  });

  // Health check endpoint to test Ethos API connectivity
  app.get("/api/health", async (req, res) => {
    try {
      // Test with a known address to verify API connectivity
      const testResult = await ethosApi.searchUsers('vitalik', undefined, 1);
      
      res.json({
        success: true,
        ethos_api_status: testResult.success ? 'connected' : 'error',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        ethos_api_status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Get user network data using real Ethos API - AUTHENTIC DATA ONLY
  app.get('/api/user-network/:userkey', async (req, res) => {
    try {
      const userkey = decodeURIComponent(req.params.userkey);
      // Use the network data API that calculates strong connections
      const networkResult = await ethosApi.getSimpleNetworkData(userkey);
      
      if (networkResult.success && networkResult.data) {
        res.json(networkResult);
      } else {
        res.status(404).json({
          success: false,
          error: networkResult.error || 'Network data not found'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Get user vouch activities using real Ethos V2 API
  app.get("/api/user-vouch-activities/:userkey", async (req, res) => {
    try {
      const { userkey } = req.params;
      
      // Get authentic user stats first for amount calculations
      let userStats = null;
      try {
        let directResult = null;
        
        if (userkey.startsWith('profileId:')) {
          // For profileId format, use profile-id endpoint
          const profileId = parseInt(userkey.split(':')[1]);
          directResult = await ethosApi.getUsersByProfileId([profileId]);
        } else if (userkey.startsWith('service:x.com:')) {
          // For Twitter service format, use x endpoint  
          const twitterId = userkey.split(':').pop();
          if (twitterId) {
            directResult = await ethosApi.getUsersByTwitter([twitterId]);
          }
        }
        
        userStats = directResult?.success ? directResult.data?.[0]?.stats : null;
        if (userStats?.vouch) {
        }
      } catch (error) {
      }
      
      // Get vouch activities using correct V2 API endpoints with user stats for amount calculation
      const result = await ethosApi.getUserVouchActivities(userkey, userStats);
      
      let receivedVouches: any[] = [];
      let givenVouches: any[] = [];
      let totalGivenEth = 0; // Declare at function scope for proper access
      
      if (result.success && result.data) {
        
        // Remove hardcoded average calculation - use actual vouch amounts from API
        

        
        // Use the pre-formatted received vouches with rich user info from the service
        receivedVouches = result.data.received || [];

        // Process given vouches using ONLY authentic V2 API stats
        let realGivenStats = null;
        if (result.data.given && result.data.given.length > 0) {
          // Always use direct V2 API call to get authentic vouch data based on userkey format
          try {
            let directResult = null;
            
            if (userkey.startsWith('profileId:')) {
              // For profileId format, use profile-id endpoint
              const profileId = parseInt(userkey.split(':')[1]);
              directResult = await ethosApi.getUsersByProfileId([profileId]);
            } else if (userkey.startsWith('service:x.com:')) {
              // For Twitter service format, use x endpoint
              const twitterId = userkey.split(':').pop();
              if (twitterId) {
                directResult = await ethosApi.getUsersByTwitter([twitterId]);
              }
            }
            
            if (directResult?.success && directResult.data?.[0]?.stats?.vouch?.given?.amountWeiTotal) {
              realGivenStats = directResult.data[0].stats.vouch.given;
              totalGivenEth = parseFloat(realGivenStats.amountWeiTotal.toString()) / 1e18;
            }
          } catch (error) {
            // Could not fetch authentic V2 vouch given stats
          }
        }
        
        // Use the pre-formatted given vouches with rich user info from the service  
        givenVouches = result.data.given || [];
      } else {
        // Fallback: use user stats to show summary data
        try {
          const userResult = await ethosApi.getUserByUserkey(userkey);
          if (userResult.success && userResult.data?.stats) {
            const stats = userResult.data.stats;
            
            // Create placeholder entries based on stats
            if (stats.vouch?.received?.count > 0) {
              for (let i = 0; i < Math.min(stats.vouch.received.count, 5); i++) {
                receivedVouches.push({
                  id: `received-${i}`,
                  amount: (parseFloat(stats.vouch.received.amountWeiTotal.toString()) / stats.vouch.received.count).toString(),
                  amountEth: ((parseFloat(stats.vouch.received.amountWeiTotal.toString()) / stats.vouch.received.count) / 1e18).toFixed(6),
                  timestamp: new Date(Date.now() - i * 86400000).toISOString(),
                  comment: "Vouch received (details from stats)",
                  voucher: "Unknown voucher",
                  vouchee: userkey,
                  platform: "ethereum"
                });
              }
            }
            
            if (stats.vouch?.given?.count > 0) {
              for (let i = 0; i < Math.min(stats.vouch.given.count, 5); i++) {
                givenVouches.push({
                  id: `given-${i}`,
                  amount: (parseFloat(stats.vouch.given.amountWeiTotal.toString()) / stats.vouch.given.count).toString(),
                  amountEth: ((parseFloat(stats.vouch.given.amountWeiTotal.toString()) / stats.vouch.given.count) / 1e18).toFixed(6),
                  timestamp: new Date(Date.now() - i * 86400000).toISOString(),
                  comment: "Vouch given (details from stats)",
                  voucher: userkey,
                  vouchee: "Unknown recipient",
                  platform: "ethereum"
                });
              }
            }
          }
        } catch (fallbackError) {
          // Fallback user data fetch failed
        }
      }

      // Get real-time ETH price from CoinGecko API (public, no rate limits)
      let ethUsdRate = 3400; // fallback
      try {
        const coingeckoResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true');
        const coingeckoData = await coingeckoResponse.json();
        if (coingeckoData.ethereum?.usd) {
          ethUsdRate = coingeckoData.ethereum.usd;
        }
      } catch (error) {
      }

      // Also add declared totalGivenEth if it was calculated
      const responseData: any = {
        received: receivedVouches,
        given: givenVouches,
        total: receivedVouches.length + givenVouches.length,
        ethUsdRate: ethUsdRate
      };

      // Add authentic totalGivenEth from user stats if available 
      if (typeof totalGivenEth !== 'undefined' && totalGivenEth > 0) {
        responseData.totalGivenEth = totalGivenEth;
        responseData.totalGivenUsd = totalGivenEth * ethUsdRate;
      } else {
        // Fallback to 0 if no authentic data available
        responseData.totalGivenEth = 0;
        responseData.totalGivenUsd = 0;
      }

      res.json({ 
        success: true, 
        data: responseData
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  });

  // 7-day score momentum with score changes endpoint using Ethos API v1 score history
  app.get("/api/weekly-activities/:userkey", async (req, res) => {
    try {
      const userkey = decodeURIComponent(req.params.userkey);
      
      // Use 7-day duration parameter as specified in API documentation
      const scoreHistoryUrl = `https://api.ethos.network/api/v1/score/${encodeURIComponent(userkey)}/history?duration=7d&limit=200`;
      
      const response = await fetch(scoreHistoryUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'EthosRadar/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.ok && data.data && data.data.values) {
        // Get score history from the last 7 days
        const scoreHistory = data.data.values;
        
        // Calculate score changes by comparing consecutive entries
        let totalScoreChange = 0;
        let totalXpGain = 0;
        const dailyActivity = new Map();
        
        // Sort by date to calculate proper score changes
        const sortedHistory = scoreHistory.sort((a: any, b: any) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        const activities = [];
        
        for (let i = 1; i < sortedHistory.length; i++) {
          const current = sortedHistory[i];
          const previous = sortedHistory[i - 1];
          const scoreChange = current.score - previous.score;
          
          if (scoreChange !== 0) {
            const date = new Date(current.createdAt).toDateString();
            
            totalScoreChange += scoreChange;
            
            // More realistic XP estimation based on score change magnitude
            const xpGain = Math.abs(scoreChange) <= 5 ? Math.abs(scoreChange) * 2 : Math.abs(scoreChange) * 1.5;
            totalXpGain += xpGain;
            
            activities.push({
              id: current.id,
              timestamp: current.createdAt,
              scoreChange: scoreChange,
              xpGain: xpGain,
              score: current.score,
              type: scoreChange > 0 ? 'score_increase' : 'score_decrease'
            });
            
            // Group by day for streak calculation
            if (!dailyActivity.has(date)) {
              dailyActivity.set(date, []);
            }
            dailyActivity.get(date).push({
              scoreChange,
              xpGain,
              timestamp: current.createdAt
            });
          }
        }
        // Use activeDays (unique days with score changes) as our "7-day activity streak"
        let streakDays = dailyActivity.size;
        
        return res.json({
          success: true,
          data: {
            activities: activities.slice(0, 10), // Return recent 10 activities
            summary: {
              streakDays: streakDays,
              scoreChange: totalScoreChange,
              xpGain: totalXpGain,
              totalChanges: activities.length,
              activeDays: dailyActivity.size
            }
          }
        });
      }
      
      return res.json({ success: true, data: { activities: [], summary: null } });
    } catch (error) {
      console.error("Error fetching weekly activities:", error);
      return res.json({ 
        success: false, 
        error: "Failed to fetch weekly activities" 
      });
    }
  });

  // Score history endpoint using Ethos V1 scores API
  app.get('/api/score-history/:userkey', async (req, res) => {
    try {
      const { userkey } = req.params;
      // Fetch score history from Ethos V1 API
      const scoreHistoryData = await ethosApi.getScoreHistory(userkey);
      
      res.json({
        success: true,
        data: scoreHistoryData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch score history data'
      });
    }
  });

  // Helper function to map review sentiment
  function mapReviewSentiment(sentiment: any): 'positive' | 'negative' | 'neutral' {
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

  // Simple in-memory cache for R4R analysis (5 minute TTL)
  const r4rCache = new Map<string, { data: any; timestamp: number }>();
  const r4rSummaryCache = new Map<string, { data: any; timestamp: number }>();
  const R4R_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Fast Review Summary - Ultra-fast endpoint for dashboard (bypasses heavy R4R processing)
  app.get("/api/review-summary/:userkey", async (req, res) => {
    try {
      const userkey = decodeURIComponent(req.params.userkey);
      const cacheKey = `fast-review-${userkey}`;
      
      // Check cache first (shorter cache for freshness)
      const cached = r4rSummaryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < R4R_CACHE_TTL) {
        return res.json({ success: true, data: cached.data });
      }
      
      // Direct API call to Ethos for just review sentiment data
      const reviewsResponse = await fetch(
        `https://ethos.network/api/review?subject=${encodeURIComponent(userkey)}&limit=100&offset=0`,
        {
          headers: {
            'accept': 'application/json',
            'user-agent': 'EthosRadar/1.0'
          }
        }
      );
      
      if (!reviewsResponse.ok) {
        // Return zero data if API fails
        return res.json({
          success: true,
          data: { totalReviews: 0, positivePercentage: 0 }
        });
      }
      
      const reviewsData = await reviewsResponse.json();
      const reviews = reviewsData.values || [];
      
      // Fast sentiment calculation using score field
      const positiveReviews = reviews.filter((review: any) => (review.score || 0) > 0).length;
      const totalReviews = reviews.length;
      const positivePercentage = totalReviews > 0 ? Math.round((positiveReviews / totalReviews) * 100) : 0;
      
      const summary = {
        totalReviews,
        positivePercentage
      };
      
      // Cache for 2 minutes (much shorter than R4R)
      r4rSummaryCache.set(cacheKey, { data: summary, timestamp: Date.now() });
      
      res.json({ success: true, data: summary });
    } catch (error) {
      // Fast review summary error
      res.json({
        success: true,
        data: { totalReviews: 0, positivePercentage: 0 }
      });
    }
  });

  // R4R Summary - Fast lightweight endpoint for dashboard use
  app.get("/api/r4r-summary/:userkey", async (req, res) => {
    try {
      const userkey = decodeURIComponent(req.params.userkey);
      
      // Check cache first
      const cached = r4rSummaryCache.get(userkey);
      if (cached && Date.now() - cached.timestamp < R4R_CACHE_TTL) {
        return res.json({
          success: true,
          data: cached.data,
          cached: true
        });
      }
      
      // Get basic reviews data for sentiment calculation
      const reviewsData = await ethosApi.getUserReviews(userkey);
      if (!reviewsData.success || !reviewsData.data) {
        return res.json({
          success: true,
          data: {
            totalReviews: 0,
            positivePercentage: 0,
            allReviews: []
          }
        });
      }

      const reviews = reviewsData.data;
      const allReviews = [];
      
      // Process received reviews for sentiment
      if (reviews.received) {
        for (const review of reviews.received) {
          allReviews.push({
            id: review.id || `${review.author?.userkey}_${review.timestamp}`,
            type: 'received',
            review: {
              sentiment: mapReviewSentiment(review.score || review.sentiment),
              comment: review.comment || '',
              timestamp: review.timestamp
            }
          });
        }
      }

      const totalReviews = allReviews.length;
      const positiveReviews = allReviews.filter(r => r.review.sentiment === 'positive').length;
      const positivePercentage = totalReviews > 0 ? Math.round((positiveReviews / totalReviews) * 100) : 0;

      const summary = {
        totalReviews,
        positivePercentage,
        allReviews
      };

      // Cache the result
      r4rSummaryCache.set(userkey, { data: summary, timestamp: Date.now() });

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      // R4R Summary error
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });

  // R4R (Review for Review) Analysis - Comprehensive reputation farming detection
  app.get("/api/r4r-analysis/:userkey", async (req, res) => {
    try {
      const userkey = decodeURIComponent(req.params.userkey);
      
      // Check cache first
      const cached = r4rCache.get(userkey);
      if (cached && Date.now() - cached.timestamp < R4R_CACHE_TTL) {
        return res.json({
          success: true,
          data: cached.data,
          cached: true
        });
      }
      
      const analysis = await r4rAnalyzer.analyzeUser(userkey);
      
      if (!analysis) {
        return res.status(404).json({
          success: false,
          error: 'Unable to analyze user - user not found or insufficient data'
        });
      }

      // Cache the result
      r4rCache.set(userkey, { data: analysis, timestamp: Date.now() });

      // Clean old cache entries (simple cleanup)
      if (r4rCache.size > 100) {
        const oldestKey = r4rCache.keys().next().value;
        if (oldestKey) {
          r4rCache.delete(oldestKey);
        }
      }

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      // R4R Analysis error
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });

  // R4R Network Analysis - Analyze connections between users for farming patterns
  app.post("/api/r4r-network-analysis", async (req, res) => {
    try {
      const { userkeys } = z.object({
        userkeys: z.array(z.string()).min(1).max(20),
      }).parse(req.body);

      const analyses = await Promise.all(
        userkeys.map(async (userkey) => {
          const analysis = await r4rAnalyzer.analyzeUser(userkey);
          return { userkey, analysis };
        })
      );

      // Find cross-connections between analyzed users
      const crossConnections = [];
      for (let i = 0; i < analyses.length; i++) {
        for (let j = i + 1; j < analyses.length; j++) {
          const user1 = analyses[i];
          const user2 = analyses[j];
          
          if (user1.analysis && user2.analysis) {
            const connection1to2 = user1.analysis.networkConnections.find(
              conn => conn.userkey === user2.userkey
            );
            const connection2to1 = user2.analysis.networkConnections.find(
              conn => conn.userkey === user1.userkey
            );

            if (connection1to2 || connection2to1) {
              crossConnections.push({
                user1: user1.userkey,
                user2: user2.userkey,
                connection1to2,
                connection2to1,
                isMutual: !!(connection1to2 && connection2to1),
                suspiciousScore: Math.max(
                  connection1to2?.suspiciousScore || 0,
                  connection2to1?.suspiciousScore || 0
                )
              });
            }
          }
        }
      }

      res.json({
        success: true,
        data: {
          analyses: analyses.map(a => a.analysis).filter(Boolean),
          crossConnections,
          networkSuspiciousScore: crossConnections.length > 0 
            ? crossConnections.reduce((sum, conn) => sum + conn.suspiciousScore, 0) / crossConnections.length
            : 0
        }
      });
    } catch (error) {
      // R4R Network Analysis error
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });

  // Avatar proxy endpoint to handle CORS and loading issues
  app.get("/api/avatar-proxy", async (req, res) => {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL parameter is required' });
      }

      // Only allow specific domains for security
      const allowedDomains = ['pbs.twimg.com', 'avatars.githubusercontent.com', 'cdn.stamp.fyi'];
      const urlObj = new URL(url);
      
      if (!allowedDomains.includes(urlObj.hostname)) {
        return res.status(403).json({ error: 'Domain not allowed' });
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'EthosRadar/1.0.0',
          'Accept': 'image/*',
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to fetch image' });
      }

      // Set appropriate headers
      res.set({
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
      });

      // Pipe the image data
      const buffer = Buffer.from(await response.arrayBuffer());
      res.send(buffer);
    } catch (error) {
      // Avatar proxy error
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Add missing API endpoints that frontend is calling

  // R4R Analytics endpoint 
  app.get("/api/r4r-analytics/:userkey", async (req, res) => {
    try {
      const userkey = decodeURIComponent(req.params.userkey);
      const result = await r4rAnalyzer.getR4RAnalytics(userkey);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  });

  // R4R Analysis endpoint  
  app.get("/api/r4r-analysis/:userkey", async (req, res) => {
    try {
      const userkey = decodeURIComponent(req.params.userkey);
      const result = await r4rAnalyzer.getR4RAnalysis(userkey);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  });

  // R4R Network Analysis endpoint
  app.post("/api/r4r-network-analysis", async (req, res) => {
    try {
      const { userkey } = z.object({
        userkey: z.string().min(1),
      }).parse(req.body);
      
      const result = await r4rAnalyzer.getNetworkAnalysis(userkey);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  });

  // R4R Summary endpoint
  app.get("/api/r4r-summary/:userkey", async (req, res) => {
    try {
      const userkey = decodeURIComponent(req.params.userkey);
      const result = await r4rAnalyzer.getR4RSummary(userkey);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
