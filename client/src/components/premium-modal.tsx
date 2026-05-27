import { useState, useEffect } from 'react';
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
import { Check, Sparkles, Loader2, ArrowLeft, Phone } from 'lucide-react';
import { PREMIUM_TIER, FREE_TIER } from '@/lib/tiers';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PremiumModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const countries = [
  { name: 'India', code: '+91', flag: '🇮🇳', placeholder: '98765 43210', validate: (val: string) => /^[6-9]\d{9}$/.test(val) ? null : 'Please enter a valid 10-digit Indian mobile number.' },
  { name: 'United States', code: '+1', flag: '🇺🇸', placeholder: '201 555 0123', validate: (val: string) => /^\d{10}$/.test(val) ? null : 'Please enter a valid 10-digit US phone number.' },
  { name: 'Canada', code: '+1', flag: '🇨🇦', placeholder: '604 555 0123', validate: (val: string) => /^\d{10}$/.test(val) ? null : 'Please enter a valid 10-digit Canadian phone number.' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧', placeholder: '7911 123456', validate: (val: string) => /^\d{10}$/.test(val) ? null : 'Please enter a valid 10-digit UK phone number.' },
  { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪', placeholder: '50 123 4567', validate: (val: string) => /^\d{9}$/.test(val) ? null : 'Please enter a valid 9-digit UAE phone number.' },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦', placeholder: '50 123 4567', validate: (val: string) => /^\d{9}$/.test(val) ? null : 'Please enter a valid 9-digit Saudi phone number.' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬', placeholder: '8123 4567', validate: (val: string) => /^\d{8}$/.test(val) ? null : 'Please enter a valid 8-digit Singapore phone number.' },
  { name: 'Australia', code: '+61', flag: '🇦🇺', placeholder: '412 345 678', validate: (val: string) => /^\d{9}$/.test(val) ? null : 'Please enter a valid 9-digit Australian phone number.' },
];

export function PremiumModal({ isOpen, onOpenChange }: PremiumModalProps) {
  const { user, session, isLoading: isAuthLoading } = useAuth();
  const [step, setStep] = useState<'benefits' | 'phone'>('benefits');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Phone form states
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Reset steps and error states on dialog open
  useEffect(() => {
    if (isOpen) {
      setStep('benefits');
      setError(null);
      setPhoneError(null);
    }
  }, [isOpen]);

  // Pre-fill phone fields from user auth context
  useEffect(() => {
    if (user) {
      const rawPhone = user.phone || user.user_metadata?.phone || '';
      if (rawPhone) {
        // Find matching country code from our supported list
        const matched = countries.find(c => rawPhone.startsWith(c.code));
        if (matched) {
          setCountryCode(matched.code);
          setPhoneNumber(rawPhone.slice(matched.code.length).replace(/[^0-9]/g, ''));
        } else if (rawPhone.startsWith('+')) {
          const codeMatch = rawPhone.match(/^\+\d{1,4}/);
          if (codeMatch) {
            const code = codeMatch[0];
            setCountryCode(code);
            setPhoneNumber(rawPhone.slice(code.length).replace(/[^0-9]/g, ''));
          } else {
            setPhoneNumber(rawPhone.replace(/[^0-9]/g, ''));
          }
        } else if (rawPhone.length === 10 && !rawPhone.startsWith('999999')) {
          setCountryCode('+91');
          setPhoneNumber(rawPhone.replace(/[^0-9]/g, ''));
        }
      }
    }
  }, [user]);

  const activeCountry = countries.find(c => c.code === countryCode) || countries[0];

  const handleGetPremiumClick = () => {
    if (isAuthLoading) {
      setError('Still restoring your session. Please try again in a moment.');
      return;
    }

    if (!user || !session) {
      setError('Please sign in before upgrading.');
      return;
    }

    setStep('phone');
  };

  const handleUpgrade = async () => {
    setPhoneError(null);
    setError(null);

    // Validate phone number
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    const validationError = activeCountry.validate(cleanNumber);
    if (validationError) {
      setPhoneError(validationError);
      return;
    }

    // Format for Cashfree customer_phone parameter
    // - Indian number: 10 digits without leading 0 or +91
    // - International number: must include the '+' prefix (e.g. +12015550123) as required by Cashfree
    const formattedPhone = countryCode === '+91'
      ? cleanNumber
      : `${countryCode}${cleanNumber}`;

    setIsLoading(true);

    try {
      const response = await fetch('/api/create-payment-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          phone: formattedPhone,
        }),
      });

      const responseText = await response.text();
      let data: any = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        throw new Error(responseText || 'Server returned invalid response');
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
      <span className="text-sm text-foreground/90">{text}</span>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[calc(100vw-1.5rem)] overflow-y-auto bg-card/95 p-4 backdrop-blur-xl border-border sm:max-w-md sm:p-6 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        {step === 'benefits' ? (
          <>
            <DialogHeader className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  Premium
                </Badge>
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight">Get Permanent Premium Access</DialogTitle>
              <DialogDescription className="text-foreground/70">
                One-time payment. No subscription. Cancel anytime.
              </DialogDescription>
            </DialogHeader>

            <div className="relative space-y-6 pt-4">
              <div className="p-6 bg-gradient-to-br from-secondary/50 to-secondary/30 rounded-xl border border-border/30">
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-extrabold text-foreground">${PREMIUM_TIER.price}</span>
                  <span className="text-muted-foreground font-medium">one-time</span>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground/80 mb-2">Everything in Free, plus:</p>
                  {PREMIUM_TIER.features.map((feature, i) => (
                    <FeatureItem key={i} text={feature} />
                  ))}
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg border border-border/30">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Currently on {FREE_TIER.name} tier:</p>
                <div className="space-y-1 text-sm text-foreground/80">
                  <p>• Save up to {FREE_TIER.limits.maxSavedStations} stations</p>
                  <p>• Store {FREE_TIER.limits.maxTripHistory} trip calculations</p>
                  <p>• No data export</p>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive text-center font-medium">{error}</p>
              )}

              <Button
                onClick={handleGetPremiumClick}
                disabled={isAuthLoading}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 rounded-xl cursor-pointer"
              >
                Get Premium - ${PREMIUM_TIER.price} one-time
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                One-time payment. No recurring charges. Secure payment via Cashfree.
              </p>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setStep('benefits')}
                  className="w-8 h-8 -ml-2 rounded-full text-foreground/75 hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 ml-1">
                  Secure Checkout
                </Badge>
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" /> Confirm Mobile Number
              </DialogTitle>
              <DialogDescription className="text-foreground/70">
                Enter your actual phone number so Cashfree can securely process your order and send transaction updates.
              </DialogDescription>
            </DialogHeader>

            <div className="relative space-y-6 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-semibold text-foreground/90">Country / Region</Label>
                  <Select value={countryCode} onValueChange={(val) => {
                    setCountryCode(val);
                    setPhoneError(null);
                  }}>
                    <SelectTrigger id="country" className="h-11 bg-background/50 border-border/50 rounded-xl focus:ring-ring focus:ring-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border max-h-[300px]">
                      {countries.map((c) => (
                        <SelectItem key={c.name + c.code} value={c.code} className="hover:bg-accent rounded-lg py-2.5">
                          <span className="mr-2 text-base">{c.flag}</span>
                          <span className="font-medium">{c.name}</span>
                          <span className="text-muted-foreground ml-2 font-mono">{c.code}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold text-foreground/90">Mobile Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center h-11 px-3 bg-muted/40 border border-border/50 rounded-xl font-mono text-sm select-none">
                      {countryCode}
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''));
                        setPhoneError(null);
                      }}
                      placeholder={activeCountry.placeholder}
                      className="h-11 bg-background/50 border-border/50 rounded-xl font-mono focus-visible:ring-ring focus-visible:ring-1"
                    />
                  </div>
                  {phoneError && (
                    <p className="text-xs text-destructive font-semibold mt-1 pl-1">{phoneError}</p>
                  )}
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive text-center font-medium">{error}</p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('benefits')}
                  disabled={isLoading}
                  className="h-12 border-border/50 hover:bg-muted/30 rounded-xl font-semibold cursor-pointer"
                >
                  Back
                </Button>
                <Button
                  onClick={handleUpgrade}
                  disabled={isLoading || !phoneNumber}
                  className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 rounded-xl cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    <>Proceed to Payment</>
                  )}
                </Button>
              </div>

              <div className="p-3.5 bg-muted/20 border border-border/20 rounded-xl flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your number will be safely stored in your account metadata and sent securely to Cashfree for official payment receipts only.
                </p>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
