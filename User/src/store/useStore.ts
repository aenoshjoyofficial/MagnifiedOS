import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Subscription } from '@supabase/supabase-js';

// Module-level variable to hold the auth subscription — lives outside the store
// so it persists across renders and can be properly unsubscribed
let authSubscription: Subscription | null = null;

interface UIState {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));

interface AuthState {
  user: any | null;
  profile: any | null;
  loading: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
  setProfileField: (field: string, value: any) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  setProfileField: (field, value) => {
    const currentProfile = get().profile;
    if (currentProfile) {
      set({ profile: { ...currentProfile, [field]: value } });
    }
  },

  initialize: async () => {
    if (get().initialized) return;
    set({ initialized: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        set({ user: session.user });
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        set({ profile });
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
    } finally {
      set({ loading: false });
    }

    // Unsubscribe any previous listener before registering a new one
    // (guards against React Strict Mode double-invocation and HMR re-registration)
    if (authSubscription) {
      authSubscription.unsubscribe();
      authSubscription = null;
    }

    // Listen for auth changes — store the returned subscription so it can be cleaned up
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        set({ user: session.user });
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        set({ profile });
      } else {
        set({ user: null, profile: null });
      }
      set({ loading: false });
    });

    authSubscription = subscription;
  },

  signIn: async (email, password) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    
    if (result.data?.user) {
      set({ user: result.data.user });
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', result.data.user.id)
        .single();
      set({ profile, loading: false });
    }
    
    return result;
  },

  signOut: async () => {
    // Unsubscribe the auth listener when the user explicitly signs out
    if (authSubscription) {
      authSubscription.unsubscribe();
      authSubscription = null;
    }
    await supabase.auth.signOut();
    set({ user: null, profile: null, initialized: false });
  },
}));

