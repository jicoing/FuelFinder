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

    const finishSignIn = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const authError = params.get('error_description') || params.get('error');

        if (authError) {
          throw new Error(authError);
        }

        if (code) {
          setMessage('Completing secure sign in...');
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!session) {
          throw new Error('No session was created. Please try signing in again.');
        }

        if (isMounted) {
          window.history.replaceState({}, document.title, '/auth/callback');
          setLocation('/');
        }
      } catch (error: any) {
        console.error('AuthCallback error:', error);
        if (isMounted) {
          setMessage(error.message || 'Sign in failed. Please try again.');
        }
      }
    };

    finishSignIn();

    return () => {
      isMounted = false;
    };
  }, [supabase, setLocation]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 text-center text-foreground">
      <p>{message}</p>
    </div>
  );
}
