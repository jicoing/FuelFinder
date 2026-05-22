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
import SavedStationsPage from "@/pages/saved-stations";
import PaymentSuccessPage from "@/pages/payment-success";
import ContactPage from "@/pages/contact";
import AuthCallback from "@/pages/AuthCallback";
import 'leaflet/dist/leaflet.css';
import { Button } from "./components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "./lib/queryClient";
 import { Fuel, Calculator, Menu, Search, Info, FileText, Shield, User, LogOut, Crown, Bookmark, Download, MessageCircle } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
 import {
     AlertDialog,
     AlertDialogAction,
     AlertDialogCancel,
     AlertDialogContent,
     AlertDialogDescription,
     AlertDialogFooter,
     AlertDialogHeader,
     AlertDialogTitle,
   } from "@/components/ui/alert-dialog";
 import { useDataExport } from "./lib/useDataExport";
 import { AuthProvider, useAuth } from "./lib/auth-context";
 import { AuthModal } from "./components/auth-modal";
 import { PremiumModal } from "./components/premium-modal";
 import { Badge } from "./components/ui/badge";
 import { Avatar, AvatarFallback } from "./components/ui/avatar";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/calculator" component={TripCalculatorPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/saved-stations" component={SavedStationsPage} />
      <Route path="/payment-success" component={PaymentSuccessPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function HeaderContent() {
  const [, navigate] = useLocation();
  const { user, isLoading, isPremium, signOut } = useAuth();
  const { toast } = useToast();
  const { exportData } = useDataExport();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);

  const handleNewSearch = () => {
    queryClient.invalidateQueries({ queryKey: ['stations'] });
    navigate('/');
  };

  const handleSignOut = async () => {
    const result = await signOut();
    if (result?.error) {
      toast({
        title: "Sign out failed",
        description: result.error.message,
        variant: "destructive",
      });
    } else {
      navigate('/');
    }
  };

  const getUserInitials = () => {
    if (!user) return '';
    const name = user.user_metadata?.full_name || user.email || '';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      <header className="h-16 border-b border-border/50 bg-card/60 backdrop-blur-xl flex items-center justify-between px-6 z-50 shrink-0">
        <Link href="/" className="flex items-center gap-3 group" onClick={() => window.dispatchEvent(new Event('findmyfuel:go-home'))}>
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 rounded-xl blur-md group-hover:bg-primary/50 transition-colors duration-300"></div>
            <div className="relative bg-gradient-to-br from-primary to-primary/80 rounded-xl p-2">
              <Fuel className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            findmyfuel
          </span>
          {isPremium && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 ml-1">
              <Crown className="w-3 h-3 mr-1" />
              Pro
            </Badge>
          )}
        </Link>
        
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="h-9 w-24 rounded-md bg-muted/50" aria-hidden="true" />
          ) : user ? (
            <>
              {!isPremium && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsPremiumOpen(true)}
                  className="hidden sm:flex border-primary/30 text-primary hover:bg-primary/10"
                >
                  <Crown className="w-4 h-4 mr-1" />
                  Upgrade
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="hover:bg-accent/50">
                <LogOut className="w-5 h-5 text-foreground/70" />
              </Button>
              <Avatar className="h-8 w-8 cursor-pointer" onClick={() => setIsAuthOpen(true)}>
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAuthOpen(true)}
              className="gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary transition-all duration-300 font-medium px-4 shadow-sm"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Button>
          )}
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-accent/50 transition-colors">
                <Menu className="w-5 h-5 text-primary" />
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-card/95 backdrop-blur-xl border-border">
              <nav className="flex flex-col h-full mt-8">
                <div className="flex-grow space-y-1">
                  <SheetClose asChild>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-base font-medium h-12 text-foreground/80 hover:text-foreground hover:bg-accent/50 transition-all" onClick={handleNewSearch}>
                      <Search className="w-5 h-5 text-primary" />
                      New Search
                    </Button>
                  </SheetClose>
                   <SheetClose asChild>
                     <Link href="/calculator">
                       <Button variant="ghost" className="w-full justify-start gap-3 text-base font-medium h-12 text-foreground/80 hover:text-foreground hover:bg-accent/50 transition-all">
                         <Calculator className="w-5 h-5 text-primary" />
                         Calculator
                       </Button>
                     </Link>
                   </SheetClose>
                   <SheetClose asChild>
                     <Link href="/saved-stations">
                       <Button variant="ghost" className="w-full justify-start gap-3 text-base font-medium h-12 text-foreground/80 hover:text-foreground hover:bg-accent/50 transition-all">
                         <Bookmark className="w-5 h-5 text-primary" />
                         Saved Stations
                       </Button>
                     </Link>
                   </SheetClose>
                   <SheetClose asChild>
                    <Link href="/privacy">
                      <Button variant="ghost" className="w-full justify-start gap-3 text-base font-medium h-12 text-foreground/80 hover:text-foreground hover:bg-accent/50 transition-all">
                        <Shield className="w-5 h-5 text-primary" />
                        Privacy
                      </Button>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/terms">
                      <Button variant="ghost" className="w-full justify-start gap-3 text-base font-medium h-12 text-foreground/80 hover:text-foreground hover:bg-accent/50 transition-all">
                        <FileText className="w-5 h-5 text-primary" />
                        Terms
                      </Button>
                    </Link>
                  </SheetClose>
                    <SheetClose asChild>
                      <Link href="/about">
                        <Button variant="ghost" className="w-full justify-start gap-3 text-base font-medium h-12 text-foreground/80 hover:text-foreground hover:bg-accent/50 transition-all">
                          <Info className="w-5 h-5 text-primary" />
                          About
                        </Button>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/contact">
                        <Button variant="ghost" className="w-full justify-start gap-3 text-base font-medium h-12 text-foreground/80 hover:text-foreground hover:bg-accent/50 transition-all">
                          <MessageCircle className="w-5 h-5 text-primary" />
                          Contact Us
                        </Button>
                      </Link>
                    </SheetClose>
                </div>
                 <div className="mt-auto pt-4 border-t border-border/50 space-y-2">
                  {!isLoading && !user && (
                    <Button 
                      variant="outline" 
                      className="w-full h-12 text-base font-medium bg-transparent hover:bg-primary/10 border-primary/30 text-primary hover:text-primary transition-all duration-300 shadow-sm"
                      onClick={() => setIsAuthOpen(true)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Sign In / Sign Up
                    </Button>
                  )}
                  {!isLoading && !isPremium && user && (
                    <Button 
                      className="w-full h-12 text-base font-medium bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/25 transition-all duration-300"
                      onClick={() => setIsPremiumOpen(true)}
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Premium
                    </Button>
                  )}
                  {isPremium && (
                    <>
                      <Button 
                        variant="outline"
                        className="w-full h-12 text-base font-medium bg-transparent hover:bg-accent/50 border-border/50 transition-all duration-300"
                        onClick={exportData}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export Data
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      
      <AuthModal isOpen={isAuthOpen} onOpenChange={setIsAuthOpen} />
       <PremiumModal isOpen={isPremiumOpen} onOpenChange={setIsPremiumOpen} />
       
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <div className="h-screen flex flex-col">
            <HeaderContent />
            <main className="flex-1 overflow-y-auto">
              <Router />
            </main>
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
