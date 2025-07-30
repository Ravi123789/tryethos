import React, { useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Crown, Sparkles, Shield, Hash, CheckCircle } from 'lucide-react';
import { SiFarcaster } from 'react-icons/si';
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
    if (score >= 2000) return { tier: 'excellent', animation: 'excellent', status: 'trusted', color: 'green' };
    if (score >= 1600) return { tier: 'good', animation: 'good', status: 'reputable', color: 'emerald' };
    if (score >= 1200) return { tier: 'neutral', animation: 'none', status: 'neutral', color: 'yellow' };
    if (score >= 800) return { tier: 'questionable', animation: 'none', status: 'questionable', color: 'orange' };
    return { tier: 'risky', animation: 'none', status: 'risky', color: 'red' };
  };

  return (
    <div
      ref={dropdownRef}
      className={`search-suggestions-dropdown absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden shadow-2xl border border-gray-700 shadow-2xl shadow-black/40 ${isMobile() ? 'below-search-mobile' : 'below-search-desktop'}`}
      style={{
        maxHeight: isMobile() ? '400px' : '500px',
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
        <div className={`relative overflow-y-auto ${isMobile() ? 'max-h-[320px]' : 'max-h-[400px]'}`}>
          {suggestions.map((suggestion: SearchSuggestion, index: number) => {
            const { tier, animation: tierAnimation, status, color } = getTierInfo(suggestion.score);
            
            return (
              <div 
                key={`${suggestion.userkey}-${index}`}
                onClick={() => handleSelect(suggestion)}
                className={`
                  relative flex items-center cursor-pointer transition-all duration-300 group 
                  min-h-[70px] p-4 border-b border-gray-700 last:border-b-0
                  hover:bg-gray-700/30 hover:border-gray-600/50 active:bg-gray-700/50
                  ${farcasterMode ? 'hover:bg-blue-600/20 active:bg-blue-600/30' : ''}
                  ${tierAnimation === 'excellent' ? 'tier-excellent' : 
                    tierAnimation === 'good' ? 'tier-good' : ''
                  }
                `}
                style={{ 
                  touchAction: 'manipulation'
                }}
              >
                {/* Enhanced hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Larger Avatar with platform indicator */}
                <div className="relative flex-shrink-0 mr-4">
                  <Avatar className={`h-12 w-12 ring-2 transition-all duration-300 ${
                    farcasterMode
                      ? 'ring-blue-500/40 group-hover:ring-blue-400/60'
                      : 'ring-gray-400/30 group-hover:ring-gray-300/50'
                  } ${
                    tierAnimation === 'excellent' ? 'ring-amber-500/60 group-hover:ring-amber-400/80' :
                    tierAnimation === 'good' ? 'ring-emerald-500/50 group-hover:ring-emerald-400/70' : ''
                  }`}>
                    <AvatarImage 
                      src={suggestion.avatarUrl && suggestion.avatarUrl.includes('pbs.twimg.com') 
                        ? `/api/avatar-proxy?url=${encodeURIComponent(suggestion.avatarUrl)}`
                        : suggestion.avatarUrl
                      } 
                      alt={suggestion.displayName || suggestion.username}
                      crossOrigin="anonymous"
                    />
                    <AvatarFallback className="text-white flex items-center justify-center text-lg font-bold bg-gradient-to-br from-gray-600/80 to-gray-800/70 border border-white/20">
                      {suggestion.displayName ? 
                        suggestion.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) :
                        suggestion.username ? 
                          suggestion.username.slice(0, 2).toUpperCase() :
                          <User className="h-5 w-5 text-white/80" />
                      }
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Platform indicator */}
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-gray-800 ${
                    farcasterMode ? 'bg-blue-600' : 'bg-gray-600'
                  }`}>
                    {farcasterMode ? (
                      <SiFarcaster className="w-3 h-3 text-white" />
                    ) : (
                      <Shield className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>

                {/* Enhanced User Info with better hierarchy */}
                <div className="flex-1 min-w-0 relative z-10">
                  {/* Display name with tier indicators */}
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-lg text-white drop-shadow-lg truncate group-hover:text-white transition-colors">
                      {suggestion.displayName || suggestion.username}
                    </h4>
                    {tierAnimation === 'excellent' && (
                      <Crown className="h-4 w-4 text-amber-300 animate-pulse flex-shrink-0 drop-shadow-lg" />
                    )}
                    {tierAnimation === 'good' && (
                      <Sparkles className="h-4 w-4 text-emerald-300 flex-shrink-0 drop-shadow-lg" />
                    )}
                  </div>
                  
                  {/* Username handle */}
                  <p className="text-sm font-medium text-white/70 drop-shadow-sm mb-2 truncate">
                    @{suggestion.username}
                  </p>
                  
                  {/* Trust score with context and icon */}
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-white/60" />
                    <span className="text-sm font-semibold text-white/80">
                      Trust: 
                    </span>
                    <span className={`text-sm font-bold ${
                      tierAnimation === 'excellent' 
                        ? 'text-amber-300' 
                        : tierAnimation === 'good' 
                          ? 'text-emerald-300'
                          : farcasterMode 
                            ? 'text-blue-300' 
                            : 'text-blue-300'
                    }`}>
                      {suggestion.score}
                    </span>
                  </div>
                </div>

                {/* Status indicator with colored dot */}
                <div className="text-right flex-shrink-0 ml-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      color === 'green' ? 'bg-green-500 shadow-lg shadow-green-500/30' :
                      color === 'emerald' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' :
                      color === 'yellow' ? 'bg-yellow-500 shadow-lg shadow-yellow-500/30' :
                      color === 'orange' ? 'bg-orange-500 shadow-lg shadow-orange-500/30' :
                      'bg-red-500 shadow-lg shadow-red-500/30'
                    }`}></div>
                    <div className={`text-xs font-bold uppercase tracking-wider leading-none transition-colors ${
                      color === 'green' ? 'text-green-300' :
                      color === 'emerald' ? 'text-emerald-300' :
                      color === 'yellow' ? 'text-yellow-300' :
                      color === 'orange' ? 'text-orange-300' :
                      'text-red-300'
                    }`}>
                      {status}
                    </div>
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