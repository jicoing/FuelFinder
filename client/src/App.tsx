
import { useState } from "react";
import { Switch, Route, Link, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import TripCalculatorPage from "@/pages/calculator";
import PrivacyPage from "@/pages/privacy";
import TermsPage from "@/pages/terms";
import AboutPage from "@/pages/about";
import 'leaflet/dist/leaflet.css';
import { Button } from "./components/ui/button";
import { queryClient } from "./lib/queryClient";
import { Fuel, Calculator, Menu, Search, Info, FileText, Shield, Heart } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
  } from "@/components/ui/alert-dialog";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/calculator" component={TripCalculatorPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/about" component={AboutPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location, navigate] = useLocation();
  const [isDonateOpen, setIsDonateOpen] = useState(false);

  const handleNewSearch = () => {
    if (location === '/') {
      window.location.reload();
    } else {
      navigate('/');
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <header className="h-16 border-b bg-card/80 backdrop-blur-md flex items-center justify-between px-6 z-50 absolute top-0 left-0 right-0 shadow-sm">
          <Link href="/" className="flex items-center gap-2 text-primary">
            <Fuel className="w-6 h-6" />
            <span className="font-bold text-xl tracking-tight cursor-pointer">
              findmyfuel
            </span>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6 text-primary" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <nav className="flex flex-col h-full mt-8">
                <div className="flex-grow">
                  <SheetClose asChild>
                    <Button variant="ghost" className="w-full justify-start gap-2 text-lg font-sans text-primary" onClick={handleNewSearch}>
                      <Search className="w-6 h-6 text-primary" />
                      New Search
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/calculator">
                      <Button variant="ghost" className="w-full justify-start gap-2 text-lg font-sans text-primary">
                        <Calculator className="w-6 h-6 text-primary" />
                        Calculator
                      </Button>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/privacy">
                      <Button variant="ghost" className="w-full justify-start gap-2 text-lg font-sans text-primary">
                        <Shield className="w-6 h-6 text-primary" />
                        Privacy
                      </Button>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/terms">
                      <Button variant="ghost" className="w-full justify-start gap-2 text-lg font-sans text-primary">
                        <FileText className="w-6 h-6 text-primary" />
                        Terms
                      </Button>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/about">
                      <Button variant="ghost" className="w-full justify-start gap-2 text-lg font-sans text-primary">
                        <Info className="w-6 h-6 text-primary" />
                        About
                      </Button>
                    </Link>
                  </SheetClose>
                </div>
                <div className="mt-auto pb-4">
                    <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white justify-center gap-2 text-lg font-sans" onClick={() => setIsDonateOpen(true)}>
                      <Heart className="w-6 h-6" />
                      Donate
                    </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
      </header>
        <main className="pt-16 h-screen">
          <Router />
        </main>
        <AlertDialog open={isDonateOpen} onOpenChange={setIsDonateOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Support the Project</AlertDialogTitle>
                    <AlertDialogDescription>
                    Choose your preferred donation method:
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex flex-col space-y-2">
                    <Button asChild>
                        <a href="https://paypal.me/jicoing" target="_blank" rel="noopener noreferrer">PayPal</a>
                    </Button>
                    <Button asChild>
                        <a href="https://razorpay.me/@jicoing" target="_blank" rel="noopener noreferrer">Razorpay</a>
                    </Button>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
