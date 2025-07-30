import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { WalletScanner } from '@/components/wallet-scanner';
import { UserProfileView } from '@/components/user-profile-view';
import { EnhancedFarcasterProfile } from '@/components/enhanced-farcaster-profile';

import { HeroTagline } from '@/components/hero-tagline';
import { EthosStatus } from '@/components/ethos-status';
import { BottomNavigation } from '@/components/bottom-navigation';
import { useUserProfile } from '@/hooks/use-ethos-api';

export default function Home() {
  const { user, searchMode, setUser, clearUser } = useUserProfile();

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

  if (user) {
    // Check if this is a Farcaster user with enhanced data or has Farcaster userkey
    const isFarcasterUser = (user as any)._isFarcasterEnhanced || user.userkeys?.some((key: string) => key.startsWith('service:farcaster:'));
    
    if (isFarcasterUser) {
      return (
        <EnhancedFarcasterProfile user={user} onBackToSearch={handleBackToSearch} />
      );
    }
    
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
      </div>
      
      {/* Bottom Navigation - only show on home page when no user profile is displayed */}
      {!user && <BottomNavigation />}
      

    </div>
  );
}