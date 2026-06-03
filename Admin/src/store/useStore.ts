import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

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
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  initialize: async () => {
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

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
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

    // Auto-refresh the session every 5 minutes to keep it active
    const refreshInterval = setInterval(async () => {
      try {
        console.log('[AuthStore] Auto-refreshing session...');
        await supabase.auth.getSession();
      } catch (err) {
        console.error('[AuthStore] Auto-refresh session error:', err);
      }
    }, 5 * 60 * 1000);

    // Refresh session on visibility change (tab reactivation)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('[AuthStore] Tab active, refreshing session...');
        try {
          await supabase.auth.getSession();
        } catch (err) {
          console.error('[AuthStore] Session refresh on visibility change error:', err);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up function is not strictly needed for a global store, but good reference
    (window as any).__authCleanup = () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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

  signUp: async (email, password, fullName) => {
    return await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { 
          full_name: fullName,
          role: 'admin' // AUTO-ASSIGN ADMIN ROLE FOR THIS PANEL
        }
      }
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
}));
