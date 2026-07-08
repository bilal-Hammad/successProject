import * as AppleAuthentication from 'expo-apple-authentication';
import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { startSyncSubscription, syncOnLogin } from '../services/templateSectionSync';
import { supabase } from '../services/supabaseClient';

type AuthStore = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  _initListener: () => () => void;
};

// Module-level so it survives store re-renders
let stopSync: (() => void) | null = null;

function activateSync(userId: string) {
  if (stopSync) stopSync();
  // Fire-and-forget; errors are non-fatal
  syncOnLogin(userId).catch(() => {});
  stopSync = startSyncSubscription(userId);
}

function deactivateSync() {
  if (stopSync) { stopSync(); stopSync = null; }
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  user: null,
  loading: true,

  signInWithApple: async () => {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) throw new Error('No identity token from Apple');
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    if (error) throw error;
    set({ session: data.session, user: data.user ?? null });
    if (data.user) activateSync(data.user.id);
  },

  signOut: async () => {
    deactivateSync();
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },

  _initListener: () => {
    supabase.auth.getSession().then(({ data }) => {
      set({
        session: data.session,
        user: data.session?.user ?? null,
        loading: false,
      });
      if (data.session?.user) activateSync(data.session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, loading: false });
      if (session?.user) {
        activateSync(session.user.id);
      } else {
        deactivateSync();
      }
    });

    return () => subscription.unsubscribe();
  },
}));
