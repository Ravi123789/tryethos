// Core React and routing
import { useEffect } from "react";
import { Switch, Route } from "wouter";

// Farcaster SDK
import { sdk } from "@farcaster/miniapp-sdk";

// External libraries
import { QueryClientProvider } from "@tanstack/react-query";

// Internal utilities and configs
import { queryClient } from "./lib/queryClient";

// UI Components
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SimpleRadarLogo } from "@/components/holographic-logo";


// Pages
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";

// Theme toggle removed - dark mode only



function AppHeader() {
  return (
    <header className="relative">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="clay-card flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <SimpleRadarLogo className="w-7 h-7 text-white" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              EthosRadar
            </h1>
          </div>
          <div className="text-xs font-medium text-white/60 hidden sm:block">
            Base Mini App
          </div>
        </div>
      </div>
    </header>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Set dark mode on load and initialize Farcaster SDK
  useEffect(() => {
    document.documentElement.classList.add('dark');
    
    // Initialize Farcaster Mini App SDK
    const initializeSdk = async () => {
      try {
        // Wait for the app to be fully rendered
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Signal to Farcaster that the app is ready
        await sdk.actions.ready();
        console.log('Farcaster SDK initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error);
        // Still call ready to hide splash screen even if there's an error
        try {
          await sdk.actions.ready();
        } catch (readyError) {
          console.error('Failed to call ready():', readyError);
        }
      }
    };
    
    initializeSdk();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-[#0f1419] via-[#1a1f2e] to-[#0f1419]">
          <AppHeader />
          <main className="pb-safe-bottom">
            <Router />
          </main>
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
