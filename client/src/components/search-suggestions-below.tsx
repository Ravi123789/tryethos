import React, { useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Crown, Sparkles } from 'lucide-react';
// Theme provider removed - dark mode only

interface SearchSuggestion {
  userkey: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  score: number;
  description?: string;
  farcasterUsername?: string;
  hasEthosAccount?: boolean;
  status?: string;
  xpTotal?: number;
  xpStreakDays?: number;
  profileId?: number;
}

interface SearchSuggestionsProps {
  query: string;
  onSelect: (suggestion: SearchSuggestion) => void;
  isVisible: boolean;
  onVisibilityChange: (visible: boolean) => void;
  farcasterMode?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export function SearchSuggestionsBelow({ 
  query, 
  onSelect, 
  isVisible, 
  onVisibilityChange, 
  farcasterMode = false,
  inputRef
}: SearchSuggestionsProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  // Dark mode only - no theme toggle needed
  
  // Use appropriate API based on mode
  const globalSuggestions = useQuery({
    queryKey: ['/api/search-suggestions', query],
    queryFn: () => fetch(`/api/search-suggestions?q=${encodeURIComponent(query)}`).then(res => res.json()),
    enabled: !farcasterMode && isVisible && query.length >= 3,
    staleTime: 30000,
  });
  
  const farcasterSuggestions = useQuery({
    queryKey: ['/api/farcaster-suggestions', query],
    queryFn: () => fetch(`/api/farcaster-suggestions?q=${encodeURIComponent(query)}`).then(res => res.json()),
    enabled: farcasterMode && isVisible && query.length >= 2,
    staleTime: 30000,
  });
  
  const { data, isLoading, error } = farcasterMode ? farcasterSuggestions : globalSuggestions;

  // Mobile detection
  const isMobile = () => window.innerWidth < 768;

  // Show/hide logic
  useEffect(() => {
    if (!isVisible) {
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowDropdown(true);
    }, 100);

    return () => {
      clearTimeout(timer);
      setShowDropdown(false);
    };
  }, [isVisible, query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onVisibilityChange(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside, { passive: true });
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [showDropdown, onVisibilityChange]);

  const handleSelect = (suggestion: SearchSuggestion) => {
    onSelect(suggestion);
    onVisibilityChange(false);
  };

  const suggestions = data?.data || [];
  const minLength = farcasterMode ? 2 : 3;
  
  if (!isVisible || query.length < minLength || !showDropdown) {
    return null;
  }

  const getTierInfo = (score: number) => {
    if (score >= 2000) return { tier: 'excellent', animation: 'excellent' };
    if (score >= 1600) return { tier: 'good', animation: 'good' };
    return { tier: 'neutral', animation: 'none' };
  };

  return (
    <div
      ref={dropdownRef}
      className={`search-suggestions-dropdown absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden shadow-2xl border border-gray-700 shadow-2xl shadow-black/40 ${isMobile() ? 'below-search-mobile' : 'below-search-desktop'}`}
      style={{
        maxHeight: isMobile() ? '280px' : '320px',
        transform: 'translate3d(0,0,0)',
        backdropFilter: 'blur(60px) saturate(200%)',
        WebkitBackdropFilter: 'blur(60px) saturate(200%)',
        background: 'rgba(0, 0, 0, 0.4)',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        isolation: 'isolate',
        willChange: 'backdrop-filter',
        position: 'absolute',
        zIndex: 1000,
      }}
    >
      {isLoading && (
        <div className="relative flex items-center justify-center p-6">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 border-2 rounded-full animate-spin ${
              farcasterMode 
                ? 'border-purple-300/60 border-t-purple-200 dark:border-purple-400/50 dark:border-t-purple-100' 
                : 'border-blue-300/60 border-t-blue-200 dark:border-blue-400/50 dark:border-t-blue-100'
            }`}></div>
            <span className={`text-sm font-medium ${
              farcasterMode 
                ? 'text-white dark:text-white' 
                : 'text-white dark:text-white'
            }`}>
              {farcasterMode ? 'Searching Farcaster...' : 'Searching...'}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="relative p-4 text-center">
          <span className="text-red-200 dark:text-red-300 text-sm font-medium bg-red-500/20 dark:bg-red-500/15 px-3 py-2 rounded-lg">Search failed. Please try again.</span>
        </div>
      )}

      {!isLoading && !error && suggestions.length === 0 && (
        <div className="relative p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <User className={`h-7 w-7 ${farcasterMode ? 'text-white dark:text-white' : 'text-white dark:text-white'}`} />
            <div className="flex flex-col items-center gap-1">
              <span className={`text-sm font-medium ${
                farcasterMode ? 'text-white dark:text-white' : 'text-white dark:text-white'
              }`}>
                {farcasterMode ? 'No Farcaster users found' : 'No users found'}
              </span>
              {farcasterMode && (
                <span className="text-xs text-white/70 dark:text-white/70 mt-1">
                  Try: newtonhere, dwr, vitalik
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && suggestions.length > 0 && (
        <div className={`relative overflow-y-auto ${isMobile() ? 'max-h-[240px]' : 'max-h-[280px]'}`}>
          {suggestions.map((suggestion: SearchSuggestion, index: number) => {
            const { tier, animation: tierAnimation } = getTierInfo(suggestion.score);
            
            return (
              <div 
                key={`${suggestion.userkey}-${index}`}
                onClick={() => handleSelect(suggestion)}
                className={`relative flex items-center cursor-pointer transition-all duration-200 group border-b border-gray-700/50 last:border-b-0 ${
                  isMobile() ? 'px-4 py-3' : 'px-4 py-3'
                } ${
                  farcasterMode 
                    ? 'hover:bg-purple-500/20 active:bg-purple-500/30 hover:backdrop-blur-md'
                    : 'hover:bg-gray-700/50 active:bg-gray-700/70 hover:backdrop-blur-md'
                } ${
                  tierAnimation === 'excellent' ? 'tier-excellent' : 
                  tierAnimation === 'good' ? 'tier-good' : ''
                }`}
                style={{ 
                  touchAction: 'manipulation', 
                  minHeight: '48px'
                }}
              >
                {/* Background blur overlay for text readability */}
                <div className="absolute inset-0 bg-black/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                
                {/* Avatar */}
                <Avatar className={`${isMobile() ? 'h-10 w-10' : 'h-10 w-10'} ring-2 transition-all duration-200 flex-shrink-0 mr-3 ${
                  farcasterMode
                    ? 'ring-blue-500/30 dark:ring-blue-400/20 group-hover:ring-blue-400/50 dark:group-hover:ring-blue-300/40'
                    : 'ring-gray-300/30 dark:ring-gray-500/20 group-hover:ring-gray-400/50 dark:group-hover:ring-gray-400/40'
                } ${
                  tierAnimation === 'excellent' ? 'ring-amber-500/60 group-hover:ring-amber-400/70' :
                  tierAnimation === 'good' ? 'ring-emerald-500/50 group-hover:ring-emerald-400/60' : ''
                }`}>
                  <AvatarImage 
                    src={suggestion.avatarUrl && suggestion.avatarUrl.includes('pbs.twimg.com') 
                      ? `/api/avatar-proxy?url=${encodeURIComponent(suggestion.avatarUrl)}`
                      : suggestion.avatarUrl
                    } 
                    alt={suggestion.displayName || suggestion.username}
                    crossOrigin="anonymous"
                  />
                  <AvatarFallback className={`text-white flex items-center justify-center ${
                    isMobile() ? 'text-sm' : 'text-xs'
                  } font-bold transition-all duration-200 ${
                    farcasterMode
                      ? 'bg-gradient-to-br from-gray-500/80 to-gray-700/70 border border-white/30 dark:border-white/20'
                      : 'bg-gradient-to-br from-gray-500/80 to-gray-700/70 border border-white/30 dark:border-white/20'
                  }`}>
                    {suggestion.displayName ? 
                      suggestion.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) :
                      suggestion.username ? 
                        suggestion.username.slice(0, 2).toUpperCase() :
                        <User className={`${isMobile() ? 'h-4 w-4' : 'h-3 w-3'} text-white/80`} />
                    }
                  </AvatarFallback>
                </Avatar>

                {/* Compact User Info */}
                <div className="flex-1 min-w-0 relative z-10">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h4 className={`font-bold transition-colors truncate ${
                      isMobile() ? 'text-sm' : 'text-sm'
                    } text-white dark:text-white drop-shadow-lg`}>
                      {suggestion.displayName || suggestion.username}
                    </h4>
                    {tierAnimation === 'excellent' && (
                      <Crown className="h-2.5 w-2.5 text-amber-300 dark:text-amber-200 animate-pulse flex-shrink-0 drop-shadow-lg group-hover:text-amber-200 dark:group-hover:text-amber-100" />
                    )}
                    {tierAnimation === 'good' && (
                      <Sparkles className="h-2.5 w-2.5 text-emerald-300 dark:text-emerald-200 flex-shrink-0 drop-shadow-lg group-hover:text-emerald-200 dark:group-hover:text-emerald-100" />
                    )}
                  </div>
                  <p className={`${isMobile() ? 'text-xs' : 'text-xs'} font-medium transition-colors truncate text-white/80 dark:text-white/80 drop-shadow-md`}>
                    @{suggestion.username}
                  </p>
                </div>

                {/* Compact Score display */}
                <div className="text-right flex-shrink-0 ml-2 relative z-10">
                  <div className={`${isMobile() ? 'text-lg' : 'text-lg'} font-black transition-all duration-200 leading-none ${
                    tierAnimation === 'excellent' 
                      ? 'text-amber-300 dark:text-amber-200 drop-shadow-lg group-hover:text-amber-200 dark:group-hover:text-amber-100 group-hover:drop-shadow-xl' 
                      : tierAnimation === 'good' 
                        ? 'text-emerald-300 dark:text-emerald-200 drop-shadow-lg group-hover:text-emerald-200 dark:group-hover:text-emerald-100 group-hover:drop-shadow-xl'
                        : farcasterMode 
                          ? 'text-purple-300 dark:text-purple-200 drop-shadow-lg group-hover:text-purple-200 dark:group-hover:text-purple-100 group-hover:drop-shadow-xl' 
                          : 'text-blue-300 dark:text-blue-200 drop-shadow-lg group-hover:text-blue-200 dark:group-hover:text-blue-100 group-hover:drop-shadow-xl'
                  }`}>
                    {suggestion.score}
                  </div>
                  <div className={`text-xs uppercase tracking-wider font-bold transition-colors leading-none ${
                    tierAnimation === 'excellent' 
                      ? 'text-amber-200/90 dark:text-amber-300/90 drop-shadow-md group-hover:text-amber-100 dark:group-hover:text-amber-200'
                      : tierAnimation === 'good' 
                        ? 'text-emerald-200/90 dark:text-emerald-300/90 drop-shadow-md group-hover:text-emerald-100 dark:group-hover:text-emerald-200'
                        : farcasterMode 
                          ? 'text-purple-200/90 dark:text-purple-300/90 drop-shadow-md group-hover:text-purple-100 dark:group-hover:text-purple-200' 
                          : 'text-blue-200/90 dark:text-blue-300/90 drop-shadow-md group-hover:text-blue-100 dark:group-hover:text-blue-200'
                  }`}>
                    {tier === 'excellent' ? 'EXC' : tier === 'good' ? 'REP' : 'NEU'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}