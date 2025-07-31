import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, Zap, ChevronDown } from "lucide-react";
import { useSearchUser, useSearchUserByFarcaster, useUserProfile } from "@/hooks/use-ethos-api";
import { LoadingOverlay } from "@/components/loading-overlay";
import { SearchSuggestions } from "@/components";
import { SiFarcaster } from "react-icons/si";

const SEARCH_TYPES = [
  { 
    type: 'auto', 
    label: 'Smart Search', 
    icon: '🔍',
    description: 'AI-powered detection',
    placeholder: 'Enter wallet address, ENS, username, or handle...'
  },
  { 
    type: 'farcaster', 
    label: 'Farcaster', 
    icon: <SiFarcaster className="w-3 h-3" />,
    description: 'Search by Farcaster username',
    placeholder: 'Enter Farcaster username (e.g., vitalik.eth)...'
  }
];

export function WalletScanner() {
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("auto");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [farcasterMode, setFarcasterMode] = useState(false);
  const [showFarcasterAnimation, setShowFarcasterAnimation] = useState(false);
  const searchMutation = useSearchUser();
  const farcasterSearchMutation = useSearchUserByFarcaster();
  const { user, setUser } = useUserProfile();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Show compact version when user data is loaded
  const isCompactMode = !!user;
  const DEBOUNCE_DELAY = 500; // Match ethos-r4r approach
  const MIN_SEARCH_LENGTH = 3; // Match ethos-r4r approach

  const selectedTypeInfo = SEARCH_TYPES.find(t => t.type === selectedType) || SEARCH_TYPES[0];



  const handleSearch = async () => {
    if (!query.trim()) return;
    setShowSuggestions(false);

    let result;
    
    if (farcasterMode || selectedType === 'farcaster') {
      result = await farcasterSearchMutation.mutateAsync({
        farcasterUsername: query.trim(),
      });
    } else {
      result = await searchMutation.mutateAsync({
        query: query.trim(),
        searchType: selectedType === 'auto' ? undefined : selectedType,
      });
    }

    if (result.success && result.data) {
      const searchMode = (farcasterMode || selectedType === 'farcaster') ? 'farcaster' : 'global';
      setUser(result.data, searchMode);
    }
  };

  const toggleFarcasterMode = () => {
    const newFarcasterMode = !farcasterMode;
    setFarcasterMode(newFarcasterMode);
    
    if (newFarcasterMode) {
      // Switching to Farcaster mode - trigger subtle animation and clear query
      setShowFarcasterAnimation(true);
      setQuery("");
      setShowSuggestions(false);
      inputRef.current?.focus();
      
      // Hide animation after 2 seconds - shorter and more subtle
      setTimeout(() => {
        setShowFarcasterAnimation(false);
      }, 2000);
    } else {
      // Switching from Farcaster mode back to global search
      setShowSuggestions(false);
      setShowFarcasterAnimation(false);
    }
  };

  const handleSuggestionSelect = async (suggestion: { userkey: string; displayName: string; username: string; avatarUrl?: string; score?: number; description?: string }) => {
    setQuery(suggestion.displayName || suggestion.username || suggestion.userkey);
    setShowSuggestions(false);
    
    // Convert suggestion directly to user object with basic data, stats will be fetched separately
    const userData = {
      id: 0,
      profileId: 0,
      displayName: suggestion.displayName,
      username: suggestion.username,
      avatarUrl: suggestion.avatarUrl || '',
      description: suggestion.description || '',
      score: suggestion.score || 0,
      status: "ACTIVE",
      userkeys: [suggestion.userkey],
      xpTotal: Math.floor((suggestion.score || 0) * 1.2),
      xpStreakDays: Math.floor(Math.random() * 30),
      links: {
        profile: `https://app.ethos.network/profile/${suggestion.userkey}`,
        scoreBreakdown: `https://app.ethos.network/profile/${suggestion.userkey}/score`
      },
      stats: {
        review: {
          received: { positive: 0, neutral: 0, negative: 0 }
        },
        vouch: {
          given: { amountWeiTotal: 0, count: 0 },
          received: { amountWeiTotal: 0, count: 0 }
        }
      }
    };

    const searchMode = farcasterMode ? 'farcaster' : 'global';
    setUser(userData, searchMode);
  };

  // Debounced input handler (ethos-r4r approach)
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Show suggestions based on mode and minimum length
    const minLength = farcasterMode ? 2 : MIN_SEARCH_LENGTH;
    if (value.length >= minLength) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [MIN_SEARCH_LENGTH, farcasterMode]);

  const handleInputFocus = () => {
    setIsFocused(true);
    const minLength = farcasterMode ? 2 : MIN_SEARCH_LENGTH;
    if (query.length >= minLength) setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Compact clay search bar for when user is loaded
  if (isCompactMode) {
    return (
      <>
        <div className="clay-compact-search relative">
          <div className="clay-search-wrapper">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              {searchMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-[#8a63d2]/30 border-t-[#8a63d2] rounded-full animate-spin"></div>
              ) : (
                <Search className="w-5 h-5 text-white/70" />
              )}
            </div>
            
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search another user..."
              value={query}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              className="clay-search-input flex-1 border-none text-white/90 placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            
            <button
              onClick={handleSearch}
              disabled={!query.trim() || searchMutation.isPending}
              className="clay-search-button clay-button-base"
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>
          
          {/* Search suggestions positioned directly under the search wrapper */}
          <SearchSuggestions
            query={query}
            onSelect={handleSuggestionSelect}
            isVisible={showSuggestions}
            onVisibilityChange={setShowSuggestions}
            farcasterMode={farcasterMode}
            inputRef={inputRef}
          />
        </div>
        
        <LoadingOverlay 
          isVisible={searchMutation.isPending} 
          message="Scanning trust network..."
        />
      </>
    );
  }

  // Modern mobile-first interface for Farcaster/Base
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1419] via-[#1a1f2e] to-[#0f1419] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="clay-card p-6 space-y-6">
          {/* Modern Logo Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">EthosRadar</h1>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-3 leading-tight tracking-tight">
              Who's Who?
            </h2>
            <p className="text-lg text-white/70 mb-6 leading-relaxed">
              The Network Knows.
            </p>
            
            {/* Modern verification badge */}
            <div className="flex items-center justify-center mb-6">
              <div className="clay-card-inset flex items-center gap-2 px-4 py-2 border-emerald-500/30">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-emerald-300 text-sm font-medium">Verified on Ethos</span>
              </div>
            </div>
          </div>
          {/* Modern Search Bar */}
          <div className="relative mb-6">
            <div className={`
              clay-card-inset p-4 transition-all duration-300
              ${farcasterMode 
                ? 'border-[#8a63d2]/30' 
                : 'border-[#0052ff]/30'
              }
            `}>
              <Input
                ref={inputRef}
                type="text"
                placeholder="Enter @username to search"
                value={query}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                className="w-full bg-transparent border-0 text-white text-lg placeholder:text-white/50 focus:outline-none focus:ring-0"
                      transition-all duration-200 rounded-2xl min-h-[44px]
                      ${farcasterMode 
                        ? 'placeholder:text-blue-200/90' 
                        : 'placeholder-gray-400'
                      }
                      ${isFocused ? 'placeholder:text-gray-300' : ''}
                    `}
                  />
                  
                  {/* Loading indicator */}
                  {searchMutation.isPending && (
                    <div className="absolute right-4 md:right-4 right-3 top-1/2 transform -translate-y-1/2">
                      <div className={`w-5 h-5 md:w-5 md:h-5 w-4 h-4 border-2 rounded-full animate-spin ${
                        farcasterMode 
                          ? 'border-blue-400/20 border-t-blue-300/80 dark:border-blue-600/20 dark:border-t-blue-400/80' 
                          : 'border-white/20 border-t-white/80 dark:border-gray-600/20 dark:border-t-gray-400/80'
                      }`}></div>
                    </div>
                  )}
                  
                  {/* Search action icon - always visible but smaller */}
                  {!searchMutation.isPending && (
                    <button
                      onClick={handleSearch}
                      disabled={!query.trim()}
                      className={`
                        absolute right-3 md:right-3 right-2 top-1/2 transform -translate-y-1/2
                        p-1.5 md:p-1.5 p-1 rounded-lg 
                        transition-all duration-300 
                        bg-transparent border-none shadow-none
                        hover:bg-white/5 hover:rounded-md
                        ${!query.trim() ? 'opacity-30 cursor-not-allowed' : 'opacity-60 hover:opacity-80'}
                      `}
                    >
                      <Zap className={`w-3.5 h-3.5 md:w-3.5 md:h-3.5 w-3 h-3 transition-all duration-300 ${
                        farcasterMode 
                          ? 'text-blue-200/60 hover:text-blue-100/80' 
                          : 'text-gray-300/60 dark:text-white/40 hover:text-gray-200/80 dark:hover:text-white/60'
                      }`} />
                    </button>
                  )}
                </div>
                
                {/* Bottom subtle glow */}
                <div className={`
                  absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-px 
                  bg-gradient-to-r from-transparent via-gray-400/40 dark:via-white/30 to-transparent
                  transition-opacity duration-500
                  ${isFocused ? 'opacity-100' : 'opacity-0'}
                `}></div>
                
              </div>
              
              {/* Search suggestions positioned directly under the input field */}
              <div className="relative z-[1000]">
                <SearchSuggestions
                  query={query}
                  onSelect={handleSuggestionSelect}
                  isVisible={showSuggestions}
                  onVisibilityChange={setShowSuggestions}
                  farcasterMode={farcasterMode}
                  inputRef={inputRef}
                />
              </div>
              
              {/* Floating particles for enhanced aesthetics */}
              <div className={`absolute -top-2 -right-2 w-3 h-3 rounded-full blur-sm animate-pulse opacity-60 ${
                farcasterMode ? 'bg-blue-400/30 dark:bg-blue-300/25' : 'bg-white/20'
              }`}></div>
              <div className={`absolute -bottom-2 -left-2 w-2 h-2 rounded-full blur-sm animate-pulse opacity-40 ${
                farcasterMode ? 'bg-blue-300/25 dark:bg-blue-200/20' : 'bg-white/20'
              }`} style={{ animationDelay: '1s' }}></div>
              
              {/* Farcaster activation - subtle glow ring */}
              {showFarcasterAnimation && (
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500/20 via-blue-400/10 to-blue-500/20 dark:from-blue-400/15 dark:via-blue-300/8 dark:to-blue-400/15 animate-pulse opacity-60"></div>
              )}
            </div>
            


          {/* Modern Toggle Buttons */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setFarcasterMode(false)}
              className={`
                flex-1 clay-button flex items-center justify-center gap-2 py-4 font-semibold
                ${!farcasterMode ? 'clay-button-base' : ''}
              `}
            >
              🌐 Global
            </button>
            
            <button
              onClick={() => setFarcasterMode(true)}
              className={`
                flex-1 clay-button flex items-center justify-center gap-2 py-4 font-semibold
                ${farcasterMode ? 'clay-button-farcaster' : ''}
              `}
            >
              <SiFarcaster className="w-4 h-4" />
              Farcaster
            </button>
          </div>
            
            {/* Clay Farcaster Beta Notice */}
            {farcasterMode && (
              <div className="flex justify-center mb-4">
                <div className="flex items-center gap-2 px-4 py-2 clay-card-inset border-[#8a63d2]/30 text-[#8a63d2] text-xs font-medium">
                  <span className="w-1.5 h-1.5 bg-[#8a63d2] rounded-full animate-pulse"></span>
                  <span>Experimental Farcaster mode</span>
                </div>
              </div>
            )}
            


          </div>
          

            


          {searchMutation.error && (
            <div className="clay-card-inset p-4 border-red-500/30 text-red-300 text-sm">
              {searchMutation.error.message}
            </div>
          )}
          
          {/* Optimized auto-detection component space */}
          <div className="h-16"></div>

          {/* Built On Ethos Network text at bottom edge */}
          <div className="absolute bottom-3 left-6 right-6">
            <div className="flex items-center justify-center gap-2 text-white/50 text-sm font-medium">
              <span>Built On Ethos Network</span>
              <img 
                src="/ethos-logo.png" 
                alt="Ethos Logo" 
                className="w-5 h-5 opacity-50 rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.outerHTML = '<div class="w-5 h-5 bg-gradient-to-br from-orange-400 to-teal-500 rounded-full opacity-50"></div>';
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <LoadingOverlay 
        isVisible={searchMutation.isPending} 
        message="Loading profile data and analyzing trust patterns..."
      />
    </>
  );
}
