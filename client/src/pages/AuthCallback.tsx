import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const supabase = createClient();
  const [message, setMessage] = useState('Signing you in, please wait...');
  const [showRetry, setShowRetry] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const finishSignIn = useCallback(async () => {
    if (!supabase) return;
    
    setIsProcessing(true);
    try {
      console.log('AuthCallback: Starting finishSignIn. URL:', window.location.href);
      
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const authError = params.get('error_description') || params.get('error');

      if (authError) {
        console.error('AuthCallback: Auth error from URL:', authError);
        throw new Error(authError);
      }

      // 1. Try PKCE Exchange if code is present
      if (code) {
        console.log('AuthCallback: PKCE code detected, exchanging...');
        setMessage('Exchanging secure code for session...');
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('AuthCallback: Code exchange failed:', error);
          throw error;
        }
        console.log('AuthCallback: Code exchange successful');
      }

      // 2. Double check for session (works for both PKCE and Hash fragments)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('AuthCallback: getSession error:', sessionError);
        throw sessionError;
      }

      if (session) {
        console.log('AuthCallback: Session established, redirecting...');
        setMessage('Session verified. Redirecting you home...');
        
        // Clean URL
        try {
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {}
        
        // Brief delay for visual feedback
        setTimeout(() => setLocation('/'), 500);
      } else {
        console.warn('AuthCallback: No session found after processing');
        if (code || window.location.hash.includes('access_token')) {
          setMessage('Almost there! Please click the button below to finish signing in.');
          setShowRetry(true);
        } else {
          setMessage('No sign-in data found. Please try signing in again.');
          setShowRetry(true);
        }
      }
    } catch (error: any) {
      console.error('AuthCallback: Error in finishSignIn:', error);
      setMessage(error.message || 'Sign in failed. Please try again.');
      setShowRetry(true);
    } finally {
      setIsProcessing(false);
    }
  }, [supabase, setLocation]);

  useEffect(() => {
    if (!supabase) {
      setMessage('Authentication is not configured.');
      return;
    }

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    // Safety timeout to show retry button
    timeoutId = setTimeout(() => {
      if (isMounted) {
        setShowRetry(true);
        setMessage('Sign in is taking longer than expected.');
      }
    }, 8000);

    // Primary listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthCallback: Auth event:', event, session ? 'Session found' : 'No session');
      if (session && isMounted) {
        clearTimeout(timeoutId);
        setLocation('/');
      }
    });

    // Run exchange logic
    finishSignIn();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [supabase, setLocation, finishSignIn]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 text-center text-foreground">
      <div className="max-w-xs w-full space-y-6">
        {!showRetry || isProcessing ? (
          <div className="relative mx-auto w-12 h-12">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-primary" />
          </div>
        )}
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">
            {isProcessing ? 'Verifying...' : 'Authenticating'}
          </h2>
          <p className="text-sm text-muted-foreground min-h-[40px] flex items-center justify-center">
            {message}
          </p>
        </div>

        {showRetry && (
          <div className="pt-4 space-y-3">
            <Button 
              onClick={() => finishSignIn()} 
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Complete Sign In'
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/')}
              className="w-full"
            >
              Go Back Home
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
