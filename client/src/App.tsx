
import { Switch, Route, Link } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import TripCalculatorPage from "@/pages/calculator";
import 'leaflet/dist/leaflet.css';
import { Button } from "./components/ui/button";
import { queryClient } from "./lib/queryClient";
import { Fuel } from "lucide-react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/calculator" component={TripCalculatorPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <header className="h-16 border-b bg-card/80 backdrop-blur-md flex items-center justify-between px-6 z-50 absolute top-0 left-0 right-0 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <Fuel className="w-6 h-6" />
            <Link href="/">
              <span className="font-bold text-xl tracking-tight cursor-pointer">
                Fuel Finder
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/calculator">
              <Button variant="ghost">Calculator</Button>
            </Link>
          </div>
      </header>
        <main className="pt-16 h-screen">
          <Router />
        </main>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
