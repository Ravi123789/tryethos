import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useSearchUser, useSearchUserByFarcaster, useUserProfile } from "@/hooks/use-ethos-api";
import { SiFarcaster } from "react-icons/si";

export function ModernWalletScanner() {
  const [query, setQuery] = useState("");
  const [farcasterMode, setFarcasterMode] = useState(false);
  const searchMutation = useSearchUser();
  const farcasterSearchMutation = useSearchUserByFarcaster();
  const { setUser } = useUserProfile();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    let result;
    
    if (farcasterMode) {
      result = await farcasterSearchMutation.mutateAsync({
        farcasterUsername: query.trim(),
      });
    } else {
      result = await searchMutation.mutateAsync({
        query: query.trim(),
      });
    }

    if (result.success && result.data) {
      const searchMode = farcasterMode ? 'farcaster' : 'global';
      setUser(result.data, searchMode);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1419] via-[#1a1f2e] to-[#0f1419] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="clay-card p-6 space-y-6">
          
          {/* Modern Logo Header */}
          <div className="text-center">
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

          {/* Modern Search Input */}
          <div className="space-y-4">
            <div className="clay-card-inset p-4">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Enter @username to search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full bg-transparent border-0 text-white text-lg placeholder:text-white/50 focus:outline-none focus:ring-0"
              />
            </div>

            {/* Modern Toggle Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFarcasterMode(false)}
                className={`
                  flex-1 clay-button flex items-center justify-center gap-2 py-4 font-semibold text-sm
                  ${!farcasterMode ? 'clay-button-base' : ''}
                `}
              >
                🌐 Global
              </button>
              
              <button
                onClick={() => setFarcasterMode(true)}
                className={`
                  flex-1 clay-button flex items-center justify-center gap-2 py-4 font-semibold text-sm
                  ${farcasterMode ? 'clay-button-farcaster' : ''}
                `}
              >
                <SiFarcaster className="w-4 h-4" />
                Farcaster
              </button>
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={!query.trim() || searchMutation.isPending || farcasterSearchMutation.isPending}
              className="w-full clay-button clay-button-base py-4 font-semibold text-lg disabled:opacity-50"
            >
              {(searchMutation.isPending || farcasterSearchMutation.isPending) ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Scanning...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Search className="w-5 h-5" />
                  Search
                </div>
              )}
            </button>

            {/* Footer Text */}
            <div className="text-center pt-4">
              <p className="text-white/50 text-sm">
                Built On Ethos Network
              </p>
              <div className="flex items-center justify-center mt-2">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <span className="text-green-400 text-xs font-medium">All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}