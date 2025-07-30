import { Home, Heart, Share2, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface BottomNavigationProps {
  onHomeClick?: () => void;
  currentUser?: {
    userkey: string;
    displayName?: string;
    username?: string;
    score: number;
  };
}

export function BottomNavigation({ onHomeClick, currentUser }: BottomNavigationProps) {
  const [activeTab, setActiveTab] = useState('home');

  // Helper functions for Farcaster sharing
  const getScoreLevel = (score: number): string => {
    if (score >= 2000) return 'Exemplary';
    if (score >= 1600) return 'Reputable';
    if (score >= 1200) return 'Neutral';
    if (score >= 800) return 'Questionable';
    return 'Untrusted';
  };

  const handleShareClick = () => {
    if (!currentUser) return;
    
    const baseUrl = window.location.origin;
    const frameUrl = `${baseUrl}/farcaster/frame/${encodeURIComponent(currentUser.userkey)}`;
    
    const castText = `✨ Flexing my trust reputation on @ethos-protocol! 

🏆 Trust Score: ${currentUser.score} | ${getScoreLevel(currentUser.score)} Tier
🔥 Building credibility in Web3, one interaction at a time

Check out your trust score using this mini app built by @cookedzera.eth 👇

${frameUrl}`;

    const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}&embeds[]=${encodeURIComponent(frameUrl)}`;
    window.open(warpcastUrl, '_blank');
  };

  const navItems = [
    { id: 'home', icon: Home, label: 'Home', onClick: onHomeClick },
    { id: 'favorites', icon: Heart, label: 'Favorites', disabled: true },
    { id: 'trends', icon: TrendingUp, label: 'Trends', disabled: true },
    { id: 'share', icon: Share2, label: 'Share', onClick: handleShareClick },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pb-safe">
      <div className="flex items-center justify-center p-3">
        {/* Enhanced Glassmorphism Container - Better Dark Theme */}
        <div className="relative flex items-center gap-1 p-1.5 rounded-2xl backdrop-blur-xl bg-white/10 border border-gray-700 shadow-2xl shadow-black/25 hover:bg-gray-700/50 transition-all duration-300">
          {/* Flowing liquid background for active item */}
          <div 
            className="absolute top-2 bottom-2 bg-gradient-to-r from-white/25 to-white/20 rounded-2xl backdrop-blur-xl border border-gray-600 shadow-lg transition-all duration-500 ease-out"
            style={{
              left: activeTab === 'home' ? '6px' : 
                    activeTab === 'favorites' ? '58px' : 
                    activeTab === 'trends' ? '110px' : '162px',
              width: activeTab === 'home' ? '72px' : '44px'
            }}
          />
          
          {navItems.map((item, index) => {
            const isActive = item.id === activeTab;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (!item.disabled) {
                    setActiveTab(item.id);
                    item.onClick?.();
                  }
                }}
                disabled={item.disabled}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-2xl transition-all duration-300 z-10 min-h-[44px] ${
                  item.disabled 
                    ? 'cursor-not-allowed'
                    : 'hover:scale-105 active:scale-95'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-4 h-4 transition-colors duration-300 ${
                    isActive 
                      ? 'text-gray-800 dark:text-white' 
                      : item.disabled 
                        ? 'text-white/30 dark:text-gray-600' 
                        : 'text-white/70 dark:text-gray-400 hover:text-white/90 dark:hover:text-gray-200'
                  }`} />
                  
                  {/* Icon glow effect - Monochrome theme */}
                  {isActive && (
                    <div className="absolute inset-0 bg-white/15 dark:bg-gray-300/20 blur-sm rounded-full animate-pulse"></div>
                  )}
                </div>
                
                {/* Active label only - Monochrome theme */}
                {isActive && (
                  <span className="text-xs font-semibold text-white dark:text-white whitespace-nowrap" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
                    {item.label}
                  </span>
                )}
                
                {/* Small "Soon" label for disabled items - Monochrome theme */}
                {item.disabled && (
                  <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[9px] text-white/40 dark:text-gray-600 whitespace-nowrap">
                    Soon
                  </span>
                )}
                
                {/* Ripple effect on hover - Monochrome theme */}
                <div className="absolute inset-0 rounded-full bg-white/8 dark:bg-gray-300/10 opacity-0 hover:opacity-100 transition-opacity duration-300 scale-0 hover:scale-100"></div>
              </button>
            );
          })}
          
          {/* Liquid glass edge highlights - Monochrome theme */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-white/5 via-transparent to-white/10 dark:from-gray-800/30 dark:via-transparent dark:to-gray-600/20 pointer-events-none"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/8 to-transparent dark:via-gray-700/30 pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
}