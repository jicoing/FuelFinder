import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { createClient } from '@/lib/supabase';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const supabase = createClient();

  useEffect(() => {
    if (!supabase) {
      console.error("AuthCallback: Supabase client is null");
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("AuthCallback: getSession error:", error);
      }

      if (isMounted && session) {
        setLocation('/');
      }
    });

    const timeout = setTimeout(() => {
      if (isMounted) {
        setLocation('/');
      }
    }, 10000);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [supabase, setLocation]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Signing you in, please wait...</p>
    </div>
  );
}
