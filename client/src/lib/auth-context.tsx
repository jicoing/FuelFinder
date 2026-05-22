import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import { type User, type Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import type { Profile } from '@/lib/database.types';
import { isCapacitor } from '@/lib/capacitor';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isPremium: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchProfile = async (userId: string, email?: string, fullName?: string) => {
    try {
      console.log('Fetching/Ensuring profile for:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Profile not found, creating one...');
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: userId, 
              email: email || '', 
              full_name: fullName || '',
              subscription_tier: 'free'
            }
          ])
          .select()
          .single();

        if (createError) {
          if (createError.code === '42501') {
            console.error('Permission denied: Cannot create profile. Please ensure you have an INSERT policy for the "profiles" table in Supabase or run the handle_new_user trigger script.');
          } else if (createError.code === '23505') {
            // Duplicate key, profile already exists - this is fine, it means a concurrent call won
            console.log('Profile already exists (duplicate key), fetching existing profile...');
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single();
            setProfile(existingProfile);
          } else {
            console.error('Error creating profile:', createError);
          }
        } else {
          setProfile(newProfile);
        }
      } else if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data || null);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setProfile(null);
    }
  };

  const refetch = async () => {
    if (user) {
      await fetchProfile(user.id, user.email);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    const cleanUrl = () => {
      try {
        if (window.location.pathname === '/auth/callback') {
          return;
        }

        if (window.location.search.includes('code=') || window.location.search.includes('error=')) {
          const url = new URL(window.location.href);
          url.searchParams.delete('code');
          url.searchParams.delete('error');
          url.searchParams.delete('error_code');
          url.searchParams.delete('error_description');
          window.history.replaceState({}, document.title, url.pathname + url.search);
        }
      } catch (e) {
        console.error('Error cleaning URL:', e);
      }
    };

    const applySession = async (session: Session | null) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(
          currentUser.id,
          currentUser.email,
          currentUser.user_metadata?.full_name || currentUser.user_metadata?.name
        );
      } else {
        setProfile(null);
      }
    };

    // Timeout safety fallback: avoid a permanent loading state if storage/network hangs.
    const timeoutId = setTimeout(() => {
      console.warn('Session restoration timed out. Proceeding...');
      setIsLoading(false);
      cleanUrl();
    }, 10000);

    supabase.auth.getSession().then(async ({ data, error }) => {
      clearTimeout(timeoutId);
      if (error) {
        console.error('Error getting session:', error);
      }
      await applySession(data?.session || null);
      setIsLoading(false);
      cleanUrl();
    }).catch((err) => {
      clearTimeout(timeoutId);
      console.error('Error getting session catch:', err);
      setIsLoading(false);
      cleanUrl();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change event:', event);
        if (!session && event !== 'SIGNED_OUT') {
          setIsLoading(false);
          return;
        }

        await applySession(session);
        setIsLoading(false);
      }
    );

     return () => {
       clearTimeout(timeoutId);
       subscription?.unsubscribe();
     };
   }, []);

   // Handle deep link callbacks for mobile
   useEffect(() => {
     if (!supabase) return;

     const sb = supabase; // capture non-null reference

     const handleDeepLink = async (url: string) => {
       try {
         const parsedUrl = new URL(url);
         const code = parsedUrl.searchParams.get('code');
         const errorDesc = parsedUrl.searchParams.get('error_description') || parsedUrl.searchParams.get('error');

         if (errorDesc) {
           console.error('Deep link auth error:', errorDesc);
           return;
         }

         if (code) {
           // Close the browser window if on native
           if (isCapacitor()) {
             try {
               await Browser.close();
             } catch (e) {
               console.warn('Browser.close failed (maybe not open):', e);
             }
           }
           const { error } = await sb.auth.exchangeCodeForSession(code);
           if (error) throw error;
         }
       } catch (err: any) {
         console.error('Failed to handle deep link:', err);
       }
     };

     let isMounted = true;

     if (isCapacitor()) {
       // Handle app opened via deep link (warm start)
       App.addListener('appUrlOpen', (event: { url: string }) => {
         if (isMounted) {
           handleDeepLink(event.url);
         }
       });

       // Handle app launched from deep link (cold start)
       App.getLaunchUrl()
         .then((result) => {
           if (isMounted && result?.url) {
             handleDeepLink(result.url);
           }
         })
         .catch(console.error);
     }

     return () => {
       isMounted = false;
       if (isCapacitor()) {
         App.removeAllListeners();
       }
     };
   }, [supabase]);

   const signUp = async (email: string, password: string, fullName?: string) => {
    if (!supabase) return { error: new Error('Supabase is not configured') };
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || '',
          },
        },
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase is not configured') };
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    if (!supabase) return { error: new Error('Supabase is not configured') };
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const resetPassword = async (email: string) => {
    if (!supabase) return { error: new Error('Supabase is not configured') };
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

   const signInWithGoogle = async () => {
     if (!supabase) return { error: new Error('Supabase is not configured') };
     try {
       const isNative = isCapacitor();
       const redirectUri = isNative
         ? 'com.example.findmyfuel://auth/callback'
         : `${window.location.origin}/auth/callback`;

       const { data, error } = await supabase.auth.signInWithOAuth({
         provider: 'google',
         options: {
           redirectTo: redirectUri,
         },
       });

       if (error) throw error;

       if (isNative && data?.url) {
         await Browser.open({ url: data.url });
       }

       return { error: null };
     } catch (error) {
       return { error: error as Error };
     }
   };

  const isPremium = profile?.subscription_tier === 'premium' && profile?.subscription_status === 'active';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isPremium,
        signUp,
        signIn,
        signOut,
        resetPassword,
        signInWithGoogle,
        refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export a helper to check if auth is configured
export function isAuthConfigured() {
  return !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
}
