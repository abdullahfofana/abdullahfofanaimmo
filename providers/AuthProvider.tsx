import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/backend/supabase';
import type { User, UserRole } from '@/types/property';
import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';

const DEV_STORAGE_KEY = '@immoci_auth_dev_session';

export const DEFAULT_DEV_USER: User = {
  id: 'dev-user-001',
  email: 'dev@immoci.ci',
  name: 'Développeur ImmoCI',
  phone: '+225 07 00 00 00 01',
  role: 'agent',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop',
};

const createMockDevSession = (devUser: User): Session => ({
  access_token: 'dev-access-token-immoci',
  token_type: 'bearer',
  expires_in: 3600 * 24 * 365,
  refresh_token: 'dev-refresh-token-immoci',
  user: {
    id: devUser.id,
    app_metadata: { provider: 'dev' },
    user_metadata: { name: devUser.name, full_name: devUser.name },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: devUser.email,
  } as any,
  expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
});

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;

        const initialSession = data?.session;
        if (initialSession?.user) {
          console.log('[Auth] Initial Supabase session:', initialSession.user.id);
          setSession(initialSession);
          await loadUser(initialSession.user.id);
        } else {
          // Check for saved developer session in AsyncStorage
          const savedDevSession = await AsyncStorage.getItem(DEV_STORAGE_KEY);
          if (savedDevSession && isMounted) {
            try {
              const parsedUser = JSON.parse(savedDevSession) as User;
              setUser(parsedUser);
              setSession(createMockDevSession(parsedUser));
              console.log('[Auth] Restored developer session:', parsedUser.name);
            } catch {
              setUser(DEFAULT_DEV_USER);
              setSession(createMockDevSession(DEFAULT_DEV_USER));
            }
          }
        }
      } catch (err) {
        console.warn('[Auth] Session init warning:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, newSession: Session | null) => {
      if (!isMounted) return;
      console.log('[Auth] Auth state changed:', newSession?.user?.id);
      
      if (newSession?.user) {
        setSession(newSession);
        await loadUser(newSession.user.id);
      } else {
        // If Supabase session is null, check if we have a dev session active
        const savedDev = await AsyncStorage.getItem(DEV_STORAGE_KEY);
        if (savedDev && isMounted) {
          try {
            const parsed = JSON.parse(savedDev) as User;
            setUser(parsed);
            setSession(createMockDevSession(parsed));
          } catch {
            setUser(DEFAULT_DEV_USER);
            setSession(createMockDevSession(DEFAULT_DEV_USER));
          }
        } else if (isMounted) {
          setUser(null);
          setSession(null);
        }
        if (isMounted) setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = row not found

      if (data) {
        setUser(data as User);
      } else {
        // Row doesn't exist yet (e.g. first OAuth sign-in) — auto-create it
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const newUser: User = {
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            phone: authUser.user_metadata?.phone || '',
            role: 'renter',
          };
          const { error: insertError } = await supabase.from('users').upsert(newUser, { onConflict: 'id' });
          if (!insertError) setUser(newUser);
        }
      }
    } catch (err) {
      console.error('[Auth] Error loading user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const skipAuth = async (customUser?: Partial<User>): Promise<User> => {
    try {
      setError(null);
      const devUser: User = {
        ...DEFAULT_DEV_USER,
        ...customUser,
      };

      await Promise.all([
        AsyncStorage.setItem(DEV_STORAGE_KEY, JSON.stringify(devUser)),
        AsyncStorage.setItem('@immoci_onboarding_completed', 'true'),
      ]);

      setUser(devUser);
      setSession(createMockDevSession(devUser));
      console.log('[Auth] Dev mode skip activated:', devUser.id);
      return devUser;
    } catch (err: any) {
      console.error('[Auth] Error setting dev mode:', err);
      setUser(DEFAULT_DEV_USER);
      return DEFAULT_DEV_USER;
    }
  };

  const signInAsDev = skipAuth;

  const signUp = async (
    email: string,
    password: string,
    name: string,
    phone: string,
    role: UserRole
  ) => {
    try {
      setError(null);
      console.log('[Auth] Creating user account...');
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error('No user returned');

      const newUser: User = {
        id: data.user.id,
        email,
        name,
        phone,
        role,
      };

      const { error: insertError } = await supabase
        .from('users')
        .insert(newUser);

      if (insertError) throw insertError;
      
      console.log('[Auth] User created successfully:', data.user.id);
      setUser(newUser);
      return newUser;
    } catch (err: any) {
      console.error('[Auth] Sign up error:', err);
      const errorMessage = err.message?.includes('already registered')
        ? 'Cet email est déjà utilisé'
        : err.message?.includes('password')
        ? 'Le mot de passe doit contenir au moins 6 caractères'
        : err.message?.includes('email')
        ? 'Email invalide'
        : 'Erreur lors de l\'inscription';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      console.log('[Auth] Signing in...');
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      if (!data.user) throw new Error('No user returned');

      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (fetchError) throw fetchError;
      if (!userData) throw new Error('User data not found');

      setUser(userData as User);
      console.log('[Auth] User signed in:', userData.id);
      return userData as User;
    } catch (err: any) {
      console.error('[Auth] Sign in error:', err);
      const errorMessage = err.message?.includes('Invalid')
        ? 'Email ou mot de passe incorrect'
        : err.message?.includes('email')
        ? 'Email invalide'
        : 'Erreur lors de la connexion';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signInWithGoogle = async () => {
    if (Platform.OS !== 'web') {
      throw new Error('Google Sign-In is only available on web');
    }

    try {
      setError(null);
      console.log('[Auth] Signing in with Google...');
      
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });

      if (signInError) throw signInError;
      console.log('[Auth] Google OAuth initiated');
      return null;
    } catch (err: any) {
      console.error('[Auth] Google sign-in error:', err);
      setError('Erreur lors de la connexion avec Google');
      throw err;
    }
  };

  const signInWithFacebook = async () => {
    if (Platform.OS !== 'web') {
      throw new Error('Facebook Sign-In is only available on web');
    }

    try {
      setError(null);
      console.log('[Auth] Signing in with Facebook...');
      
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
      });

      if (signInError) throw signInError;
      console.log('[Auth] Facebook OAuth initiated');
      return null;
    } catch (err: any) {
      console.error('[Auth] Facebook sign-in error:', err);
      setError('Erreur lors de la connexion avec Facebook');
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      console.log('[Auth] Password reset email sent');
    } catch (err: any) {
      console.error('[Auth] Password reset error:', err);
      const errorMessage = err.message?.includes('not found')
        ? 'Aucun compte trouvé avec cet email'
        : 'Erreur lors de l\'envoi de l\'email';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signOut = async () => {
    try {
      console.log('[Auth] Signing out...');
      await AsyncStorage.removeItem(DEV_STORAGE_KEY);
      try {
        await supabase.auth.signOut();
      } catch {}
      setUser(null);
      setSession(null);
      console.log('[Auth] User signed out');
    } catch (err) {
      console.error('[Auth] Sign out error:', err);
      setUser(null);
      setSession(null);
    }
  };

  return {
    user,
    session,
    isLoading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithFacebook,
    resetPassword,
    signOut,
    skipAuth,
    signInAsDev,
  };
});
