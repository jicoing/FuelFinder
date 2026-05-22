import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { createClient } from '@/lib/supabase';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const supabase = createClient();
  const [message, setMessage] = useState('Signing you in, please wait...');

  useEffect(() => {
    if (!supabase) {
      console.error("AuthCallback: Supabase client is null");
      setMessage('Authentication is not configured.');
      return;
    }

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    console.log('AuthCallback: Component mounted. URL:', window.location.href);

    // Set a safety timeout - if nothing happens in 15 seconds, something is wrong
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('AuthCallback: Safety timeout triggered');
        setMessage('Sign in is taking longer than expected. Attempting to redirect...');
        
        // Final check for session before giving up
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            console.log('AuthCallback: Session found after timeout, redirecting...');
            setLocation('/');
          } else {
            console.error('AuthCallback: Sign in timed out with no session');
            setMessage('Sign in timed out. Please try again or check your internet connection.');
          }
        });
      }
    }, 15000);

    // Use onAuthStateChange as the primary listener for session establishment.
    // This is more robust than getSession() as it handles both PKCE (code) and 
    // implicit (fragment) flows automatically.
    console.log('AuthCallback: Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthCallback: Auth event received:', event, session ? 'Session established' : 'No session yet');
      
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        if (isMounted) {
          console.log('AuthCallback: Valid session detected, finalizing sign in...');
          clearTimeout(timeoutId);
          
          // Clean up the URL fragment/query if possible, then redirect
          try {
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (e) {
            console.warn('AuthCallback: Failed to clean URL state:', e);
          }
          
          setLocation('/');
        }
      }
    });

    // Manually trigger PKCE code exchange if present
    const finishSignIn = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const authError = params.get('error_description') || params.get('error');

        if (authError) {
          console.error('AuthCallback: Auth error from URL:', authError);
          throw new Error(authError);
        }

        if (code) {
          console.log('AuthCallback: PKCE code detected, exchanging for session...');
          setMessage('Completing secure sign in...');
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('AuthCallback: Code exchange failed:', error);
            throw error;
          }
          console.log('AuthCallback: Code exchange successful');
        } else {
          console.log('AuthCallback: No PKCE code in URL, waiting for listener or getSession...');
          // For implicit flow (hash fragment), Supabase handles it internally 
          // but we can try to nudge it with getSession
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            console.error('AuthCallback: getSession error:', sessionError);
          }
          if (session && isMounted) {
            console.log('AuthCallback: Session found via getSession, redirecting...');
            clearTimeout(timeoutId);
            setLocation('/');
          }
        }
      } catch (error: any) {
        console.error('AuthCallback: finishSignIn error:', error);
        if (isMounted) {
          clearTimeout(timeoutId);
          setMessage(error.message || 'Sign in failed. Please try again.');
        }
      }
    };

    finishSignIn();

    return () => {
      console.log('AuthCallback: Cleaning up');
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [supabase, setLocation]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 text-center text-foreground">
      <div className="max-w-xs w-full space-y-6">
        <div className="relative mx-auto w-12 h-12">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">Authenticating</h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}
