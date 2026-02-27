import { useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import type { User, Profile } from '../lib/types';

export function useAuth() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        let session: any = null;

        // 1) If we arrived via magic link, explicitly set the session from the hash
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
          const params = new URLSearchParams(window.location.hash.slice(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (!error) {
              session = data.session;

              // Clean the URL (remove the hash and ensure we stay on /dashboard for magic-link)
              if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                if (url.pathname === '/') {
                  url.pathname = '/dashboard';
                }
                window.history.replaceState(
                  window.history.state,
                  '',
                  url.pathname + url.search
                );
              }
            } else {
              console.error('Error setting session from magic link:', error);
            }
          }
        }

        // 2) Fallback to the current stored session (non-magic-link loads)
        if (!session) {
          const { data, error } = await supabase.auth.getSession();
          if (!isMounted) return;

          if (error && error.name !== 'AbortError') {
            console.error('Error getting session:', error);
            setLoading(false);
            return;
          }
          session = data.session;
        }

        if (!isMounted) return;

        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setLoading(false);
        }
      } catch (error) {
        if (!isMounted) return;

        const err = error as { name?: string };
        // Supabase auth can throw AbortError from internal locks when a request is superseded.
        // Treat this as non-fatal but still resolve loading so the UI can recover.
        if (err?.name === 'AbortError') {
          setLoading(false);
          return;
        }

        console.error('Error during auth init:', error);
        setLoading(false);
      }
    };

    void initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        // Avoid awaiting async work inside auth callback to prevent lock contention.
        setTimeout(() => {
          if (!isMounted) return;
          void loadUserProfile(session.user);
        }, 0);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);

        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: supabaseUser.id,
            role: 'family',
            display_name: supabaseUser.email?.split('@')[0] || 'User',
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          // Fall back to a basic in-memory user so login still works
          setProfile(null);
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            role: 'family',
            displayName: supabaseUser.email?.split('@')[0] || 'User',
          });
          return;
        }

        setProfile(newProfile);
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          role: newProfile.role,
          displayName: newProfile.display_name,
        });
      } else if (profileData) {
        setProfile(profileData);
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          role: profileData.role,
          displayName: profileData.display_name,
        });
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      // Worst-case fallback: user from session only
      setProfile(null);
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        role: 'family',
        displayName: supabaseUser.email?.split('@')[0] || 'User',
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return {
    user,
    profile,
    loading,
    signOut,
  };
}
