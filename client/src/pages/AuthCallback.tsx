import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { createClient } from '@/lib/supabase';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const supabase = createClient();

  useEffect(() => {
    console.log("AuthCallback: Component mounted. URL:", window.location.href);
    
    if (!supabase) {
      console.error("AuthCallback: Supabase client is null");
      return;
    }

    console.log("AuthCallback: Setting up auth state change listener");
    
    // Listen for Supabase to process the hash fragment and set the session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("AuthCallback: Auth event received:", event, session ? "Session exists" : "No session");
      
      if (event === 'SIGNED_IN' && session) {
        console.log("AuthCallback: SIGNED_IN event received, redirecting to home...");
        subscription.unsubscribe();
        setLocation('/');
      }
    });

    // Also handle the case where session is already resolved
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("AuthCallback: Error getting session:", error);
      }
      
      if (session) {
        console.log("AuthCallback: Existing session found, redirecting...");
        setLocation('/');
      } else {
        console.log("AuthCallback: No session found in getSession");
      }
    });

    // Safety timeout - if we're still here after 5 seconds, try to go home anyway
    // as the session might have been picked up by AuthProvider
    const timeout = setTimeout(() => {
      console.warn("AuthCallback: Safety timeout triggered");
      setLocation('/');
    }, 5000);

    return () => {
      console.log("AuthCallback: Cleaning up");
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [supabase, setLocation]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Signing you in, please wait...</p>
    </div>
  );
}
