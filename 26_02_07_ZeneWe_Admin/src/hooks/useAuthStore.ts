import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  lastGuestPrompt: number | null; // Timestamp
  
  // Actions
  login: (user: User) => void;
  logout: () => void;
  enterGuestMode: () => void;
  incrementGuestAction: () => boolean; // Returns true if should prompt login
  resetGuestPrompt: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      status: 'idle',
      user: null,
      guestInteractionCount: 0,
      lastGuestPrompt: null,

      login: (user) => set({ status: 'authenticated', user }),
      
      logout: () => set({ status: 'idle', user: null }),
      
      enterGuestMode: () => set({ status: 'guest' }),
      
      incrementGuestAction: () => {
        const { status, guestInteractionCount, lastGuestPrompt } = get();
        if (status !== 'guest') return false;

        const newCount = guestInteractionCount + 1;
        set({ guestInteractionCount: newCount });

        // Logic: Prompt every 3 significant actions, but max once per 30 mins
        // Actually, prompt requirement: "After 3rd interaction" or "Finish training"
        // Let's keep it simple: if count % 3 == 0, check time
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
      name: 'zeneme-auth-storage',
      partialize: (state) => ({ 
        status: state.status, 
        user: state.user,
        guestInteractionCount: state.guestInteractionCount,
        lastGuestPrompt: state.lastGuestPrompt
      }),
    }
  )
);
