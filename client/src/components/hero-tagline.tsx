import { Network, Shield, CheckCircle2 } from 'lucide-react';
import { EthosStatus } from '@/components/ethos-status';

export function HeroTagline() {
  return (
    <div className="w-full max-w-4xl mx-auto mb-8 px-4">
      <div className="text-center relative">
        {/* Main Tagline */}
        <div className="relative mb-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
            <span className="text-white dark:text-gray-100 drop-shadow-2xl" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)' }}>
              Who's Who?
            </span>
            <br />
            <span className="text-cyan-100 dark:text-gray-200" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8), 0 0 15px rgba(0,0,0,0.5)' }}>
              The Network Knows.
            </span>
          </h2>
          
          {/* Verification Badge */}
          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 backdrop-blur-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/15 rounded-full shadow-2xl shadow-black/25 dark:shadow-black/80">
            <Shield className="w-3 h-3 text-green-400 dark:text-gray-300" />
            <span className="text-white dark:text-gray-200 text-xs font-semibold" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>Verified on Ethos</span>
            <CheckCircle2 className="w-3 h-3 text-green-400 dark:text-gray-300" />
          </div>
          
          {/* API Status - positioned below verification badge in a new line */}
          <div className="mt-2">
            <EthosStatus />
          </div>
        </div>



        {/* Static decorative elements - hidden in dark mode for clean appearance */}
        <div className="absolute -top-4 left-8 w-6 h-6 bg-gradient-to-br from-cyan-400/15 to-blue-400/8 rounded-full blur-sm hidden md:block md:animate-pulse dark:hidden"></div>
        <div className="absolute top-12 right-12 w-4 h-4 bg-gradient-to-br from-purple-400/15 to-pink-400/8 rounded-full blur-sm hidden md:block md:animate-pulse dark:hidden" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute bottom-8 left-16 w-3 h-3 bg-gradient-to-br from-green-400/15 to-cyan-400/8 rounded-full blur-sm hidden md:block md:animate-pulse dark:hidden" style={{ animationDelay: '3s' }}></div>
      </div>
    </div>
  );
}