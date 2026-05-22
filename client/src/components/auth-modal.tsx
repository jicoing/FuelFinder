import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ isOpen, onOpenChange }: AuthModalProps) {
  const { signIn, signUp, resetPassword, signInWithGoogle } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);
    const normalizedEmail = email.trim();

    try {
      if (mode === 'reset') {
        const { error } = await resetPassword(normalizedEmail);
        if (error) throw error;
        setSuccessMessage('Password reset email sent! Check your inbox.');
      } else if (mode === 'signup') {
        const { error } = await signUp(normalizedEmail, password, fullName);
        if (error) throw error;
        setSuccessMessage('Account created! Check your email to confirm your account.');
      } else {
        const { error } = await signIn(normalizedEmail, password);
        if (error) throw error;
        onOpenChange(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

   const handleGoogleSignIn = async () => {
     setError(null);
     setSuccessMessage(null);
     setIsLoading(true);
     try {
       const { error } = await signInWithGoogle();
       if (error) throw error;
       // On success, close the modal (web redirects away, mobile returns from browser)
       setIsLoading(false);
       onOpenChange(false);
     } catch (err: any) {
       setError(err.message || 'An error occurred during Google Sign In');
       setIsLoading(false);
     }
   };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[calc(100vw-1.5rem)] overflow-y-auto bg-card/95 p-4 backdrop-blur-xl border-border sm:max-w-md sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {mode === 'signup' ? 'Create an account' : mode === 'reset' ? 'Reset password' : 'Welcome back'}
          </DialogTitle>
          <DialogDescription className="text-xs text-foreground/70 sm:text-sm">
            {mode === 'signup' 
              ? 'Sign up to sync your data across devices' 
              : mode === 'reset'
              ? 'Enter your email to receive reset instructions'
              : 'Sign in to access your saved data'}
          </DialogDescription>
        </DialogHeader>

        {mode !== 'reset' && (
          <div className="space-y-3 sm:space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-10 sm:h-11 flex items-center justify-center gap-2 border-border/50 bg-secondary/30 hover:bg-secondary/60 hover:text-foreground text-sm font-medium transition-all duration-300"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <span className="relative px-3 text-[11px] uppercase bg-card text-foreground/50 font-medium sm:text-xs">
                Or continue with email
              </span>
            </div>
          </div>
        )}

        <Tabs value={mode} onValueChange={(v) => { setMode(v as any); setError(null); setSuccessMessage(null); }} className="w-full">
          <TabsList className="grid h-9 w-full grid-cols-3">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger value="reset">Reset</TabsTrigger>
          </TabsList>

          <TabsContent value={mode} className="mt-3 sm:mt-4">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert className="bg-green-500/10 border-green-500/20">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-500">{successMessage}</AlertDescription>
                </Alert>
              )}

              {mode === 'signup' && (
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoComplete="name"
                    className="h-10 bg-secondary/50 border-border/50 text-base sm:h-11"
                  />
                </div>
              )}

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10 bg-secondary/50 border-border/50 text-base sm:h-11"
                />
              </div>

              {mode !== 'reset' && (
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="h-10 bg-secondary/50 border-border/50 text-base sm:h-11"
                />
              </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary sm:h-12 sm:text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait...
                  </>
                ) : (
                  <>
                    {mode === 'signup' ? 'Create Account' : mode === 'reset' ? 'Send Reset Email' : 'Sign In'}
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
