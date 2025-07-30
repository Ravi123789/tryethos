import { useState } from 'react';
import { Share, ExternalLink, Copy } from 'lucide-react';
import { SiFarcaster } from 'react-icons/si';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface FarcasterShareButtonProps {
  user: {
    displayName?: string;
    username?: string;
    score?: number;
    userkeys?: string[];
  };
  compact?: boolean;
}

export function FarcasterShareButton({ user, compact = false }: FarcasterShareButtonProps) {
  const userkey = user?.userkeys?.[0] || '';
  const displayName = user?.displayName || user?.username || 'Anonymous';
  const score = user?.score || 0;
  
  // Generate frame URL
  const baseUrl = window.location.origin;
  const frameUrl = `${baseUrl}/farcaster/frame/${encodeURIComponent(userkey)}`;
  
  // Generate beautiful cast text with proper tagging
  const castText = `✨ Flexing my trust reputation on @ethos-protocol! 

🏆 Trust Score: ${score} | ${getScoreLevel(score)} Tier
🔥 Building credibility in Web3, one interaction at a time

Check out your trust score using this mini app built by @cookedzera.eth 👇

${frameUrl}`;

  function getScoreLevel(score: number): string {
    if (score >= 2000) return 'Exemplary';
    if (score >= 1600) return 'Reputable';
    if (score >= 1200) return 'Neutral';
    if (score >= 800) return 'Questionable';
    return 'Untrusted';
  }

  // Direct flex function - opens Warpcast immediately
  const handleFlex = () => {
    const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}&embeds[]=${encodeURIComponent(frameUrl)}`;
    window.open(warpcastUrl, '_blank');
  };

  const openWarpcast = () => {
    const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}&embeds[]=${encodeURIComponent(frameUrl)}`;
    window.open(warpcastUrl, '_blank');
  };

  const openFarcaster = () => {
    window.open(frameUrl, '_blank');
  };

  // Direct redirect function without popup
  const handleFlexClick = () => {
    openWarpcast();
  };

  if (compact) {
    return (
      <button 
        onClick={handleFlex}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg backdrop-blur-md bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:text-purple-200 transition-all duration-300 text-xs font-medium group ml-2"
      >
        <SiFarcaster className="w-3 h-3 transition-transform group-hover:scale-110" />
        <span>Flex</span>
      </button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Share className="w-4 h-4" />
          Share on Farcaster
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogTitle>Share Your Trust Score on Farcaster</DialogTitle>
        <DialogDescription>
          Share your trust reputation card as a Farcaster frame
        </DialogDescription>
        
        <div className="space-y-4">
          {/* Preview of the frame */}
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Frame Preview:</div>
            <div className="bg-white dark:bg-gray-700 rounded-md p-3 border">
              <div className="text-lg font-semibold">{displayName}'s Trust Score</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Trust Score: {score} | Check out their reputation on Ethos Protocol
              </div>
              <div className="mt-2 flex gap-2">
                <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                  Check Your Score
                </div>
                <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs">
                  View Profile
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <Button 
              onClick={openWarpcast}
              className="flex items-center justify-center gap-2 w-full"
            >
              <Share className="w-4 h-4" />
              Cast on Warpcast
            </Button>
            
            <Button 
              variant="outline"
              onClick={openFarcaster}
              className="flex items-center justify-center gap-2 w-full"
            >
              <ExternalLink className="w-4 h-4" />
              Preview Frame
            </Button>
            
            <Button 
              variant="outline"
              onClick={copyFrameUrl}
              className="flex items-center justify-center gap-2 w-full"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copied!' : 'Copy Frame URL'}
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Frame URL: {frameUrl}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}