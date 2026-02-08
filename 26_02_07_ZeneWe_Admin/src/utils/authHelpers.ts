import { useAuthStore } from '../hooks/useAuthStore';

// Event name for login requirement
export const LOGIN_REQUIRED_EVENT = 'zeneme:require-login';

export const triggerLoginRequired = (targetView?: string) => {
  window.dispatchEvent(new CustomEvent(LOGIN_REQUIRED_EVENT, { detail: { targetView } }));
};

export const checkIsGuest = () => {
  return useAuthStore.getState().status === 'guest';
};

// Helper to check and trigger if guest
// Returns true if action is BLOCKED (i.e. is guest), false if allowed
export const guardGuestAction = (targetView?: string) => {
  if (checkIsGuest()) {
    triggerLoginRequired(targetView);
    return true;
  }
  return false;
};
