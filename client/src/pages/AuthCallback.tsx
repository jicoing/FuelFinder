import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const supabase = createClient();
  const [message, setMessage] = useState('Starting authentication...');
  const [showRetry, setShowRetry] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    console.log(`AuthCallback: ${msg}`);
    setDebugLog(prev => [...prev.slice(-4), msg]); // Keep last 5 logs for context
  };

  const finishSignIn = useCallback(async () => {
    if (!supabase) {
      addLog('Supabase client missing');
      return;
    }
    
    setIsProcessing(true);
    try {
      addLog('Checking URL for auth data...');
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const authError = params.get('error_description') || params.get('error');

      if (authError) {
        addLog(`Auth error: ${authError}`);
        throw new Error(authError);
      }

      // 0. Check for existing session first
      addLog('Checking existing session...');
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession) {
        addLog('Existing session found, redirecting...');
        setMessage('Welcome back! Redirecting...');
        window.location.href = '/';
        return;
      }

      // 1. Try PKCE Exchange if code is present
      if (code) {
        addLog('Exchanging code for session...');
        setMessage('Verifying secure tokens...');
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          addLog(`Exchange failed: ${error.message}`);
          // If code is already used, we might still have a session
          const { data: { session: afterErrorSession } } = await supabase.auth.getSession();
          if (!afterErrorSession) throw error;
        }
        addLog('Code exchange successful');
      }

      // 2. Final session verification
      addLog('Verifying final session status...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        addLog(`Session error: ${sessionError.message}`);
        throw sessionError;
      }

      if (session) {
        addLog('Authentication complete! Redirecting...');
        setMessage('Success! Taking you to the app...');
        
        try {
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {}
        
        // Use direct location as fallback for wouter
        setTimeout(() => {
          window.location.href = '/';
        }, 800);
      } else {
        addLog('No session after processing');
        setMessage('Could not establish session. Please try again.');
        setShowRetry(true);
      }
    } catch (error: any) {
      addLog(`Catch error: ${error.message}`);
      setMessage(error.message || 'Authentication failed. Please try again.');
      setShowRetry(true);
    } finally {
      setIsProcessing(false);
    }
  }, [supabase]);

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
        addLog('Safety timeout triggered');
        setShowRetry(true);
      }
    }, 10000);

    // Primary listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      addLog(`Auth Event: ${event}`);
      if (session && isMounted) {
        addLog('Session found via listener, redirecting...');
        clearTimeout(timeoutId);
        window.location.href = '/';
      }
    });

    // Run exchange logic
    finishSignIn();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [supabase, finishSignIn]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 text-center text-foreground">
      <div className="max-w-xs w-full space-y-8">
        {!showRetry || isProcessing ? (
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-primary" />
          </div>
        )}
        
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">
            {isProcessing ? 'Verifying...' : 'Sign In'}
          </h2>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground min-h-[20px]">
              {message}
            </p>
            {debugLog.length > 0 && (
              <p className="text-[10px] text-muted-foreground/50 italic truncate">
                Status: {debugLog[debugLog.length - 1]}
              </p>
            )}
          </div>
        </div>

        {showRetry && (
          <div className="pt-4 space-y-4">
            <Button 
              onClick={() => finishSignIn()} 
              disabled={isProcessing}
              className="w-full h-12 text-base font-semibold"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Try Completing Sign In'
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="w-full h-12 text-base"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Page
            </Button>

            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/'}
              className="w-full h-12 text-base text-muted-foreground"
            >
              Cancel & Go Home
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
