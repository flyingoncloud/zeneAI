import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AuthStatus = 'idle' | 'guest' | 'authenticated';

interface User {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  isPro?: boolean;
}

interface AuthState {
  status: AuthStatus;
  user: User | null;
  guestInteractionCount: number;
  lastGuestPrompt: number | null;

  login: (user: User) => void;
  logout: () => void;
  enterGuestMode: () => void;
  incrementGuestAction: () => boolean;
  resetGuestPrompt: () => void;
}

// Generate unique guest ID
function generateGuestId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      status: 'idle',
      user: null,
      guestInteractionCount: 0,
      lastGuestPrompt: null,

      login: (user) => set({ status: 'authenticated', user }),

      logout: () => set({
        status: 'idle',
        user: null,
        guestInteractionCount: 0,
        lastGuestPrompt: null
      }),

      enterGuestMode: () => {
        // Generate unique guest user with session-specific ID
        const guestUser: User = {
          id: generateGuestId(),
          name: 'Guest User'
        };

        set({
          status: 'guest',
          user: guestUser,
          guestInteractionCount: 0,
          lastGuestPrompt: null
        });
      },

      incrementGuestAction: () => {
        const { status, guestInteractionCount, lastGuestPrompt } = get();
        if (status !== 'guest') return false;

        const newCount = guestInteractionCount + 1;
        set({ guestInteractionCount: newCount });

        if (newCount > 0 && newCount % 3 === 0) {
          const now = Date.now();
          if (!lastGuestPrompt || (now - lastGuestPrompt > 30 * 60 * 1000)) {
            set({ lastGuestPrompt: now });
            return true;
          }
        }
        return false;
      },

      resetGuestPrompt: () => set({ lastGuestPrompt: Date.now() })
    }),
    {
      name: 'zeneme-next-auth-storage',
      // Use sessionStorage for guest mode, localStorage for authenticated users
      storage: createJSONStorage(() => {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') return localStorage;

        // Use sessionStorage to clear data when browser closes
        return sessionStorage;
      }),
      partialize: (state) => ({
        status: state.status,
        user: state.user,
        guestInteractionCount: state.guestInteractionCount,
        lastGuestPrompt: state.lastGuestPrompt
      }),
    }
  )
);
