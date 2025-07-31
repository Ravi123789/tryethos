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
        <div className="clay-card p-5 space-y-4">
          
          {/* Compact Header */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
              Who's Who?
            </h2>
            <p className="text-sm text-white/70 mb-4">
              The Network Knows.
            </p>
            
            {/* Compact verification badge */}
            <div className="flex items-center justify-center mb-4">
              <div className="clay-card-inset flex items-center gap-2 px-3 py-1.5 border-emerald-500/30">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-emerald-300 text-xs font-medium">Verified on Ethos</span>
              </div>
            </div>
          </div>

          {/* Compact Search Input */}
          <div className="space-y-3">
            <div className="clay-card-inset p-3">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Enter @username to search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full bg-transparent border-0 text-white text-base placeholder:text-white/50 focus:outline-none focus:ring-0"
              />
            </div>

            {/* Compact Toggle Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFarcasterMode(false)}
                className={`
                  flex-1 clay-button flex items-center justify-center gap-2 py-3 font-semibold text-sm
                  ${!farcasterMode ? 'clay-button-base' : ''}
                `}
              >
                🌐 Global
              </button>
              
              <button
                onClick={() => setFarcasterMode(true)}
                className={`
                  flex-1 clay-button flex items-center justify-center gap-2 py-3 font-semibold text-sm
                  ${farcasterMode ? 'clay-button-farcaster' : ''}
                `}
              >
                <SiFarcaster className="w-3 h-3" />
                Farcaster
              </button>
            </div>

            {/* Compact Search Button */}
            <button
              onClick={handleSearch}
              disabled={!query.trim() || searchMutation.isPending || farcasterSearchMutation.isPending}
              className="w-full clay-button clay-button-base py-3 font-semibold disabled:opacity-50"
            >
              {(searchMutation.isPending || farcasterSearchMutation.isPending) ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Scanning...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Search className="w-4 h-4" />
                  Search
                </div>
              )}
            </button>

            {/* Compact Footer */}
            <div className="text-center pt-2">
              <p className="text-white/50 text-xs">
                Built On Ethos Network
              </p>
              <div className="flex items-center justify-center mt-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></div>
                <span className="text-green-400 text-xs">All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}