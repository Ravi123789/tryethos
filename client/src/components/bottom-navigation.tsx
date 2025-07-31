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
      <div className="flex items-center justify-center p-4">
        {/* Clay Navigation Container */}
        <div className="relative flex items-center gap-2 clay-card p-2">
          {/* Active item indicator with clay pressed effect */}
          <div 
            className="absolute top-2 bottom-2 clay-card-inset border border-[#0052ff]/30 transition-all duration-500 ease-out"
            style={{
              left: activeTab === 'home' ? '8px' : 
                    activeTab === 'favorites' ? '64px' : 
                    activeTab === 'trends' ? '120px' : '176px',
              width: activeTab === 'home' ? '76px' : '48px',
              borderRadius: 'var(--radius)'
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
                className={`clay-nav-button relative flex items-center gap-2 px-4 py-3 transition-all duration-300 z-10 min-h-[48px] min-w-[48px] ${
                  item.disabled 
                    ? 'cursor-not-allowed opacity-40'
                    : 'hover:scale-105 active:scale-95'
                }`}
              >
                <Icon className={`w-5 h-5 transition-colors duration-300 ${
                  isActive 
                    ? 'text-white' 
                    : item.disabled 
                      ? 'text-white/30' 
                      : 'text-white/70 hover:text-white/90'
                }`} />
                
                {/* Active label with claymorphism styling */}
                {isActive && (
                  <span className="text-sm font-semibold text-white whitespace-nowrap">
                    {item.label}
                  </span>
                )}
                
                {/* Small "Soon" label for disabled items */}
                {item.disabled && (
                  <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[9px] text-white/40 whitespace-nowrap">
                    Soon
                  </span>
                )}
              </button>
            );
          })}
          
          {/* Clay edge highlights */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/5 via-transparent to-white/5 pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
}