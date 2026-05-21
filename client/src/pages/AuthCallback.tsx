import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    console.log("AuthCallback: Component mounted. URL:", window.location.href);
    console.log("AuthCallback: Context state - user:", user ? "exists" : "null", "isLoading:", isLoading);

    if (user) {
      console.log("AuthCallback: User found in context, redirecting to home...");
      setLocation('/');
      return;
    }

    if (!supabase) {
      console.error("AuthCallback: Supabase client is null");
      return;
    }

    console.log("AuthCallback: Setting up local auth state change listener");
    
    // Listen for Supabase to process the hash fragment and set the session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("AuthCallback: Local auth event received:", event, session ? "Session exists" : "No session");
      
      if (event === 'SIGNED_IN' && session) {
        console.log("AuthCallback: Local SIGNED_IN event received, redirecting to home...");
        subscription.unsubscribe();
        setLocation('/');
      }
    });

    // Also handle the case where session is already resolved
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("AuthCallback: Local getSession error:", error);
      }
      
      if (session) {
        console.log("AuthCallback: Local session found, redirecting...");
        setLocation('/');
      }
    });

    // Safety timeout - if we're still here after 5 seconds, try to go home anyway
    const timeout = setTimeout(() => {
      console.warn("AuthCallback: Safety timeout triggered");
      setLocation('/');
    }, 5000);

    return () => {
      console.log("AuthCallback: Cleaning up");
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [user, isLoading, supabase, setLocation]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Signing you in, please wait...</p>
    </div>
  );
}
