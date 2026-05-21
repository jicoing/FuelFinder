import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, Sparkles, Loader2 } from 'lucide-react';
import { PREMIUM_TIER, FREE_TIER } from '@/lib/tiers';

interface PremiumModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PremiumModal({ isOpen, onOpenChange }: PremiumModalProps) {
  const { user, session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    if (!user || !session) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/create-payment-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        // If response is not JSON, read as text for error message
        const text = await response.text();
        throw new Error(text || 'Server returned invalid response');
      }

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to create payment session');
      }

      const { payment_session_id } = data;

      if (!payment_session_id) {
        throw new Error('No payment session ID received from server');
      }

      // Initialize Cashfree Web JS SDK v3
      if (!(window as any).Cashfree) {
        throw new Error('Cashfree SDK failed to load. Please check your internet connection.');
      }

      const cashfree = (window as any).Cashfree({
        mode: import.meta.env.VITE_CASHFREE_ENV === 'production' || import.meta.env.VITE_CASHFREE_ENV === 'prod' ? 'production' : 'sandbox',
      });

      // Redirect user to Cashfree checkout page
      await cashfree.checkout({
        paymentSessionId: payment_session_id,
        redirectTarget: '_self',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const FeatureItem = ({ text }: { text: string }) => (
    <div className="flex items-center gap-3">
      <div className="p-1 bg-green-500/20 rounded-full">
        <Check className="w-3 h-3 text-green-500" />
      </div>
      <span className="text-sm">{text}</span>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        
         <DialogHeader className="relative">
           <div className="flex items-center gap-2 mb-2">
             <Sparkles className="w-5 h-5 text-primary" />
             <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
               Premium
             </Badge>
           </div>
           <DialogTitle className="text-2xl">Get Permanent Premium Access</DialogTitle>
           <DialogDescription className="text-foreground/70">
             One-time payment. No subscription. Cancel anytime.
           </DialogDescription>
         </DialogHeader>

         <div className="relative space-y-6 pt-4">
           <div className="p-6 bg-gradient-to-br from-secondary/50 to-secondary/30 rounded-xl border border-border/30">
             <div className="flex items-baseline gap-1 mb-4">
               <span className="text-4xl font-bold">${PREMIUM_TIER.price}</span>
               <span className="text-muted-foreground">one-time</span>
             </div>

             <div className="space-y-3">
               <p className="text-sm font-medium text-foreground/80 mb-2">Everything in Free, plus:</p>
               {PREMIUM_TIER.features.map((feature, i) => (
                 <FeatureItem key={i} text={feature} />
               ))}
             </div>
           </div>

          <div className="p-4 bg-muted/30 rounded-lg border border-border/30">
            <p className="text-xs text-muted-foreground mb-2">Currently on {FREE_TIER.name} tier:</p>
            <div className="space-y-1 text-sm">
              <p>• Save up to {FREE_TIER.limits.maxSavedStations} stations</p>
              <p>• Store {FREE_TIER.limits.maxTripHistory} trip calculations</p>
              <p>• No data export</p>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

           <Button
             onClick={handleUpgrade}
             disabled={isLoading}
             className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25"
           >
             {isLoading ? (
               <>
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 Processing...
               </>
             ) : (
               <>
                 Get Premium - ${PREMIUM_TIER.price} one-time
               </>
             )}
           </Button>

           <p className="text-xs text-center text-muted-foreground">
             One-time payment. No recurring charges. Secure payment via Cashfree.
           </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}