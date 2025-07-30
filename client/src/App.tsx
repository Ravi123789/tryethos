// Core React and routing
import { useEffect } from "react";
import { Switch, Route } from "wouter";

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
      <div className="max-w-6xl mx-auto px-3 py-2">
        <div className="flex items-center justify-between bg-gray-800/90 border border-gray-600/50 rounded-xl px-6 py-3 shadow-lg">
          <div className="flex items-center space-x-3">
            <SimpleRadarLogo className="w-6 h-6 text-white" />
            <h1 className="text-xl font-bold text-white">
              EthosRadar
            </h1>
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
  // Set dark mode on load
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-900">
          <AppHeader />
          <main>
            <Router />
          </main>
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
