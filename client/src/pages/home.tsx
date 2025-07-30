import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { WalletScanner } from '@/components/wallet-scanner';
import { UserProfileView } from '@/components/user-profile-view';

import { HeroTagline } from '@/components/hero-tagline';
import { EthosStatus } from '@/components/ethos-status';
import { BottomNavigation } from '@/components/bottom-navigation';
import { useUserProfile } from '@/hooks/use-ethos-api';
import { sdk } from '@farcaster/frame-sdk';

interface DetectedFarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
}

export default function Home() {
  const { user, searchMode, setUser, clearUser } = useUserProfile();
  const [detectedUser, setDetectedUser] = useState<DetectedFarcasterUser | null>(null);

  // Farcaster user auto-detection hook
  useEffect(() => {
    const detectFarcasterUser = async () => {
      try {
        const context = await sdk.context;
        if (context?.user) {
          setDetectedUser({
            fid: context.user.fid,
            username: context.user.username || '',
            displayName: context.user.displayName || '',
            pfpUrl: context.user.pfpUrl || ''
          });
        }
      } catch (error) {
        // Farcaster context not available, user not in frame environment
        console.log('Farcaster context not available - this is expected in regular browser');
        
        // DEMO MODE: For testing purposes, we can simulate a detected user
        // Remove this in production or when testing in actual Farcaster environment
        if (window.location.hostname.includes('replit')) {
          setTimeout(() => {
            setDetectedUser({
              fid: 123456,
              username: 'cookedzera',
              displayName: 'CookedZera',
              pfpUrl: 'https://i.imgur.com/example.jpg' // This will fail and show fallback
            });
          }, 2000); // Show after 2 seconds to simulate detection
        }
      }
    };
    
    detectFarcasterUser();
  }, []);

  // Check for URL parameters on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for URL parameters first
      const urlParams = new URLSearchParams(window.location.search);
      const userParam = urlParams.get('user');
      
      if (userParam && !user) {
        try {
          const userData = JSON.parse(decodeURIComponent(userParam));
          setUser(userData);
          // Clean up the URL  
          window.history.replaceState({}, '', '/');
        } catch (error) {
          // Invalid user data in URL, ignore
        }
      }
    }
  }, [user, setUser]);

  const handleBackToSearch = () => {
    clearUser();
  };

  const handleViewProfile = async (username: string) => {
    try {
      // Use regular search endpoint - same as typing in search bar
      const response = await fetch('/api/search-user-farcaster', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ farcasterUsername: username })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Use the same profile view as regular search - no special handling needed
          setUser(result.data, 'farcaster');
        } else {
          console.error('Failed to get user data:', result.error);
        }
      } else {
        console.error('API request failed:', response.status);
      }
    } catch (error) {
      console.error('Failed to search for Farcaster user:', error);
    }
  };

  if (user) {
    // Use the same unified profile view for all users - no special Farcaster handling
    return (
      <UserProfileView user={user} onBackToSearch={handleBackToSearch} onUserSearch={setUser} searchMode={searchMode} />
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* No background elements in dark mode for clean appearance */}
      <div className="fixed inset-0 pointer-events-none z-0 dark:hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/8 to-cyan-400/8 rounded-full blur-xl hidden md:block md:animate-pulse"></div>
        <div className="absolute top-60 right-16 w-24 h-24 bg-gradient-to-br from-purple-400/8 to-pink-400/8 rounded-full blur-xl hidden md:block md:animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-20 w-40 h-40 bg-gradient-to-br from-orange-400/8 to-yellow-400/8 rounded-full blur-xl hidden md:block md:animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {/* Hero Tagline */}
        <HeroTagline />

        {/* Large Search Section */}
        <div className="w-full mx-auto mb-6 px-4">
          <div className="max-w-7xl mx-auto">
            <WalletScanner />
          </div>
        </div>

        {/* Farcaster Auto-Detect Component */}
        {detectedUser && (
          <div className="w-full mx-auto mb-6 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="backdrop-blur-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/15 shadow-2xl shadow-black/25 dark:shadow-black/80 rounded-lg p-3 flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  {detectedUser.pfpUrl ? (
                    <img 
                      src={detectedUser.pfpUrl} 
                      alt={detectedUser.displayName || 'Profile'}
                      className="w-10 h-10 rounded-full border-2 border-white/20 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full border-2 border-white/20 bg-gray-600 flex items-center justify-center text-white text-lg font-bold">
                      {detectedUser.displayName ? detectedUser.displayName[0].toUpperCase() : '?'}
                    </div>
                  )}
                  <div>
                    <p className="text-white text-base font-medium">{detectedUser.displayName || 'Farcaster User'}</p>
                    <p className="text-gray-400 text-xs">@{detectedUser.username} • Your Profile</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleViewProfile(detectedUser.username)}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md text-sm flex items-center gap-1 text-white transition-colors duration-200 min-h-[44px]"
                >
                  View →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* API Status */}
        {!user && <EthosStatus />}
      </div>
      
      {/* Bottom Navigation - only show on home page when no user profile is displayed */}
      {!user && <BottomNavigation />}
      

    </div>
  );
}