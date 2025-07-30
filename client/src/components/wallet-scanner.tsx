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

  // Compact glass search bar for when user is loaded
  if (isCompactMode) {
    return (
      <>
        <div className="glass-compact-search relative">
          {/* Floating orbs for compact search */}
          <div className="absolute top-1 right-2 w-4 h-4 bg-gradient-to-r from-emerald-400/30 to-teal-400/20 dark:from-gray-400/30 dark:to-gray-500/20 rounded-full floating-orb floating-orb-1"></div>
          <div className="absolute bottom-1 left-16 w-3 h-3 bg-gradient-to-r from-rose-400/25 to-pink-400/15 dark:from-gray-500/25 dark:to-gray-600/15 rounded-full floating-orb floating-orb-2"></div>
          
          <div className="glass-search-wrapper">
            <div className="glass-search-icon">
              {searchMutation.isPending ? (
                <div className="glass-spinner"></div>
              ) : (
                <Search className="w-4 h-4 text-white/70" />
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
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
              }}
              className="glass-search-input flex-1 border-none text-white/90 placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl"
            />
            
            <button
              onClick={handleSearch}
              disabled={!query.trim() || searchMutation.isPending}
              className="glass-search-button"
            >
              <Zap className="w-3.5 h-3.5" />
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

  // Full modern search interface for initial state
  return (
    <>
      <div className="w-full">
        <div className="relative backdrop-blur-xl bg-white/10 dark:bg-white/5 border border-gray-700 rounded-2xl p-6 md:p-6 p-4 hover:bg-gray-700/50 transition-all duration-500 w-full pb-10 shadow-2xl shadow-black/25 dark:shadow-black/80">
          {/* Floating background elements */}
          <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 dark:from-gray-600/10 dark:to-gray-700/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-gradient-to-br from-purple-400/10 to-pink-400/10 dark:from-gray-500/10 dark:to-gray-600/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            
          {/* Redesigned Search Bar */}
          <div className="relative mb-4 z-[100]">
            <div className="group relative">
              {/* Main search container with enhanced glassmorphism + Farcaster mode */}
              <div className={`
                relative backdrop-blur-xl bg-white/10 dark:bg-white/5
                border border-gray-700 rounded-2xl overflow-hidden 
                transition-all duration-500 ease-out
                shadow-2xl shadow-black/25 dark:shadow-black/80
                ${farcasterMode 
                  ? 'border-purple-500/70 shadow-lg shadow-purple-500/20 bg-gradient-to-r from-purple-900/30 via-purple-800/15 to-purple-900/30' + 
                    (showFarcasterAnimation ? ' shadow-xl shadow-purple-500/30' : '')
                  : isFocused 
                    ? 'border-gray-600 bg-gray-700/20' 
                    : 'hover:border-gray-600 hover:bg-gray-700/30'
                }
              `}>
                
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50"></div>
                
                {/* Input field */}
                <div className="relative">
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder={farcasterMode ? "Enter Farcaster username (e.g., vitalik.eth)" : "Enter @username to search"}
                    value={query}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    style={{
                      background: 'transparent',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      textShadow: '1px 1px 3px rgba(0,0,0,0.7)'
                    }}
                    className={`
                      w-full px-6 py-5 md:px-6 md:py-5 px-4 py-4 pr-12 md:pr-12 pr-10 border-none 
                      text-white text-lg md:text-lg text-base font-semibold
                      placeholder:font-medium placeholder:text-white/90
                      focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none
                      transition-all duration-300 rounded-2xl min-h-[44px]
                      ${farcasterMode 
                        ? 'placeholder:text-purple-200/90' 
                        : 'placeholder:text-white/90'
                      }
                      ${isFocused ? 'placeholder:text-white/95' : ''}
                    `}
                  />
                  
                  {/* Loading indicator */}
                  {searchMutation.isPending && (
                    <div className="absolute right-4 md:right-4 right-3 top-1/2 transform -translate-y-1/2">
                      <div className={`w-5 h-5 md:w-5 md:h-5 w-4 h-4 border-2 rounded-full animate-spin ${
                        farcasterMode 
                          ? 'border-purple-400/20 border-t-purple-300/80 dark:border-purple-600/20 dark:border-t-purple-400/80' 
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
                          ? 'text-purple-200/60 hover:text-purple-100/80' 
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
                farcasterMode ? 'bg-purple-400/30 dark:bg-purple-300/25' : 'bg-white/20'
              }`}></div>
              <div className={`absolute -bottom-2 -left-2 w-2 h-2 rounded-full blur-sm animate-pulse opacity-40 ${
                farcasterMode ? 'bg-purple-300/25 dark:bg-purple-200/20' : 'bg-white/20'
              }`} style={{ animationDelay: '1s' }}></div>
              
              {/* Farcaster activation - subtle glow ring */}
              {showFarcasterAnimation && (
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500/20 via-purple-400/10 to-purple-500/20 dark:from-purple-400/15 dark:via-purple-300/8 dark:to-purple-400/15 animate-pulse opacity-60"></div>
              )}
            </div>
            
            {/* Farcaster Search Toggle Button */}
            <div className="flex justify-center mt-4 mb-2">
              <button
                onClick={toggleFarcasterMode}
                className={`
                  group relative px-6 py-3 rounded-2xl backdrop-blur-xl 
                  border border-gray-700 transition-all duration-300 hover:scale-105
                  shadow-2xl shadow-black/25 dark:shadow-black/80 min-h-[44px]
                  ${farcasterMode 
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-100 shadow-lg shadow-purple-500/20' +
                      (showFarcasterAnimation ? ' shadow-xl shadow-purple-500/30' : '')
                    : 'bg-white/10 hover:bg-gray-700/50 hover:border-gray-600 text-white'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <SiFarcaster className={`w-5 h-5 transition-all duration-300 ${farcasterMode ? 'text-purple-300' : 'text-white/80'}`} />
                  <span className="text-base font-semibold transition-all duration-300" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }}>
                    {farcasterMode ? 'Farcaster Mode' : 'Search via Farcaster'}
                  </span>
                  {farcasterMode && (
                    <>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-purple-500/20 dark:bg-purple-400/20 text-purple-300 dark:text-purple-200 rounded-full border border-purple-400/30 dark:border-purple-300/30">
                        BETA
                      </span>
                      <div className={`w-2 h-2 bg-purple-400 dark:bg-purple-300 rounded-full ml-1 animate-pulse ${
                        showFarcasterAnimation ? 'opacity-100' : 'opacity-70'
                      }`}></div>
                    </>
                  )}
                </div>
                
                {/* Subtle hover glow effect */}
                <div className={`
                  absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
                  ${farcasterMode ? 'bg-purple-500/10' : 'bg-white/5'}
                `}></div>
              </button>
            </div>
            
            {/* Farcaster Beta Warning - Cool Wavy Design */}
            {farcasterMode && (
              <div className="relative mt-4 mb-2">
                <div className="relative backdrop-blur-md bg-gradient-to-r from-purple-900/20 via-purple-800/15 to-purple-900/20 dark:from-purple-800/15 dark:via-purple-700/10 dark:to-purple-800/15 border border-purple-500/30 dark:border-purple-400/25 rounded-2xl px-4 py-3 overflow-hidden">
                  {/* Wavy Background Pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <svg viewBox="0 0 400 40" className="w-full h-full">
                      <path 
                        d="M0,20 Q100,10 200,20 T400,20 V40 H0 Z" 
                        fill="url(#purple-wave)" 
                        className="animate-pulse"
                      />
                      <defs>
                        <linearGradient id="purple-wave" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="rgb(168, 85, 247)" stopOpacity="0.3"/>
                          <stop offset="50%" stopColor="rgb(147, 51, 234)" stopOpacity="0.5"/>
                          <stop offset="100%" stopColor="rgb(168, 85, 247)" stopOpacity="0.3"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400/30 to-purple-600/30 flex items-center justify-center border border-purple-400/40">
                        <span className="text-purple-300 dark:text-purple-200 text-xs font-bold">β</span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-purple-300 dark:text-purple-200 text-xs leading-relaxed">
                        <span className="font-semibold">Beta Feature:</span> Farcaster mode is experimental and results may vary or be incomplete :)
                      </p>
                    </div>
                  </div>
                  
                  {/* Floating Particles */}
                  <div className="absolute top-1 right-4 w-1 h-1 bg-purple-400/60 rounded-full animate-ping"></div>
                  <div className="absolute bottom-2 right-8 w-1.5 h-1.5 bg-purple-300/40 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>
              </div>
            )}
            


          </div>
          

            


          {searchMutation.error && (
            <div className="glass-error-message">
              {searchMutation.error.message}
            </div>
          )}
          
          {/* Built On Ethos Network text at very bottom edge */}
          <div className="absolute bottom-3 left-6 right-6">
            <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
              <span>Built On Ethos Network</span>
              <img 
                src="/ethos-logo.png" 
                alt="Ethos Logo" 
                className="w-5 h-5 opacity-60 rounded-full"
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
