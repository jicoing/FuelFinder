import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { createClient } from '@/lib/supabase';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const supabase = createClient();

  useEffect(() => {
    if (!supabase) return;

    // Listen for Supabase to process the hash fragment and set the session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        subscription.unsubscribe();
        window.location.href = '/';
      }
    });

    // Also handle the case where session is already resolved
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = '/';
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Signing you in, please wait...</p>
    </div>
  );
}
