# Auth System Migration Analysis

**Date**: February 14, 2026
**Source**: `26_02_07_ZeneWe_Web_App`
**Target**: `zeneme-next`

---

## Overview

The auth system from `26_02_07_ZeneWe_Web_App` provides a complete authentication flow with:
- Social login (WeChat, Google, Apple)
- Phone/Email authentication
- Guest mode with progressive prompts
- Welcome page with animated bubbles
- Login gate for guest users

---

## Components Analysis

### 1. **AuthPage.tsx** (Main Auth UI)
**Location**: `src/components/auth/AuthPage.tsx`

**Features**:
- Tab-based UI: Login / Register
- Social auth buttons: WeChat, Google, Apple (mock implementations)
- Phone login: SMS code with 60s countdown
- Email login: Password-based
- Forgot password flow
- Register: Terms/Privacy checkbox required
- Policy modals (Privacy, Terms)

**Dependencies**:
- `useAuthStore` - Auth state management
- `motion/react` - Animations
- Lucide icons - UI icons

**Mock Auth Logic**:
```typescript
// Phone login: Any 11-digit number + any 6-digit code
// Email login: Any email + any password
// Register: Same as login (no validation)
```

---

### 2. **WelcomePage.tsx** (Landing Page)
**Location**: `src/components/auth/WelcomePage.tsx`

**Features**:
- Hero section with app description
- "开始体验" (Start) button → AuthPage
- "访客模式" (Guest Mode) button → Enter as guest
- Animated bubble background (WelcomeDanmaku)

**Layout**:
- Centered content with gradient background
- Logo + Title + Description
- Two CTA buttons
- Floating bubbles overlay

---

### 3. **WelcomeDanmaku.tsx** (Animated Bubbles)
**Location**: `src/components/auth/WelcomeDanmaku.tsx`

**Features**:
- Floating emotion bubbles: "感觉很累", "想要放松", "压力好大", etc.
- Physics simulation: Upward movement with horizontal sway
- Click interaction: Bubble → Enter guest mode + Send message to chat
- Spawn logic: 6-12 bubbles, spawn from sides (avoid center)
- Fade in/out: Bottom fade in, top fade out

**Configuration**:
```typescript
BUBBLE_TEXTS = 15 phrases
MAX_BUBBLES = 12
MIN_BUBBLES = 6
SPAWN_INTERVAL = 1200ms
SAFE_ZONE_WIDTH_PCT = 40% (center protected)
```

**Animation**:
- RequestAnimationFrame loop for smooth movement
- Framer Motion for spawn/exit transitions
- Sway: Sine wave horizontal movement
- Speed: 0.5-1.3 px/frame

---

### 4. **GuestGate.tsx** (Login Prompt Modal)
**Location**: `src/components/auth/GuestGate.tsx`

**Features**:
- Modal prompting guests to login
- Triggered by: `LOGIN_REQUIRED_EVENT` custom event
- Benefits list: Save progress, sync devices, unlock features
- Two buttons: "立即登录" (Login Now) / "继续访客" (Continue as Guest)

**Trigger Logic**:
```typescript
// From authHelpers.ts
triggerLoginRequired(targetView?: string)
guardGuestAction(targetView?: string) // Returns true if blocked
```

---

## State Management

### **useAuthStore.ts** (Zustand + Persist)

**State**:
```typescript
{
  status: 'idle' | 'guest' | 'authenticated'
  user: User | null
  guestInteractionCount: number
  lastGuestPrompt: number | null
}
```

**Actions**:
- `login(user)` - Set authenticated status
- `logout()` - Clear user, reset to idle
- `enterGuestMode()` - Set guest status
- `incrementGuestAction()` - Track guest interactions, return true if should prompt
- `resetGuestPrompt()` - Reset prompt timer

**Guest Prompt Logic**:
- Prompt every 3 interactions
- Max once per 30 minutes
- Persisted to localStorage

**Persistence**:
- Key: `zeneme-auth-storage`
- Persists: status, user, guestInteractionCount, lastGuestPrompt

---

## Utilities

### **authHelpers.ts**

**Functions**:
- `triggerLoginRequired(targetView?)` - Dispatch custom event
- `checkIsGuest()` - Check if current status is guest
- `guardGuestAction(targetView?)` - Block action if guest, trigger login prompt

**Event**:
- `LOGIN_REQUIRED_EVENT = 'zeneme:require-login'`

---

## Integration Points

### Current `zeneme-next` Structure

**Routing**: Next.js App Router
- Main page: `src/app/page.tsx`
- Layout: `src/app/layout.tsx`
- View switching: Query param `?view=chat|test|sketch|...`

**State**: Zustand stores
- `useZenemeStore` - Main app state (messages, currentView, etc.)
- `useAdminStore` - Admin panel state
- **Missing**: `useAuthStore` (needs to be created)

**Components**:
- `ClientLayout` - Wraps app with providers
- `Sidebar` - Navigation
- `TopBar` - Header
- No auth components yet

---

## Migration Plan

### Phase 1: Core Auth Infrastructure
1. Create `zeneme-next/src/hooks/useAuthStore.ts`
   - Copy from source with minimal changes
   - Keep Zustand + persist setup
   - Ensure localStorage key doesn't conflict

2. Create `zeneme-next/src/utils/authHelpers.ts`
   - Copy helper functions
   - Ensure event names don't conflict

### Phase 2: Auth Components
3. Create `zeneme-next/src/components/auth/` directory
   - `AuthPage.tsx` - Main auth UI
   - `WelcomePage.tsx` - Landing page
   - `WelcomeDanmaku.tsx` - Animated bubbles
   - `GuestGate.tsx` - Login prompt modal

4. Adapt components for Next.js:
   - Replace `motion/react` with `framer-motion` if needed
   - Ensure all imports use `@/` alias
   - Check icon library compatibility (Lucide)

### Phase 3: Routing Integration
5. Update `zeneme-next/src/app/page.tsx`:
   - Add auth status check
   - Redirect to welcome page if not authenticated
   - Show GuestGate when needed

6. Create welcome route (optional):
   - `zeneme-next/src/app/welcome/page.tsx`
   - Or handle in main page with conditional rendering

### Phase 4: Backend Integration
7. Connect to real auth APIs:
   - Check if `ai-chat-api` has auth endpoints
   - Replace mock login with real API calls
   - Add JWT token management
   - Add refresh token logic

8. Update `zeneme-next/src/lib/api.ts`:
   - Add auth API functions
   - Add token interceptors
   - Handle 401 responses

### Phase 5: Feature Integration
9. Add guest mode tracking:
   - Call `incrementGuestAction()` on key interactions
   - Show GuestGate when threshold reached

10. Add auth guards:
    - Protect premium features
    - Show login prompt for save/sync actions
    - Use `guardGuestAction()` helper

---

## Key Differences: Source vs Target

| Aspect | 26_02_07_ZeneWe_Web_App | zeneme-next |
|--------|-------------------------|-------------|
| Framework | Vite + React | Next.js 14 (App Router) |
| Routing | React Router (assumed) | Next.js routing |
| State | Zustand | Zustand |
| Styling | Tailwind | Tailwind |
| Animation | motion/react | framer-motion (check) |
| Icons | Lucide | Lucide |
| Auth Backend | Mock | Needs real API |

---

## Backend Auth API Requirements

**Needed Endpoints** (to be checked in `ai-chat-api`):
- `POST /api/auth/login/phone` - Phone + SMS code
- `POST /api/auth/login/email` - Email + password
- `POST /api/auth/register` - User registration
- `POST /api/auth/send-sms` - Send SMS code
- `POST /api/auth/forgot-password` - Password reset
- `POST /api/auth/social/wechat` - WeChat OAuth
- `POST /api/auth/social/google` - Google OAuth
- `POST /api/auth/social/apple` - Apple OAuth
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

---

## Testing Checklist

- [ ] Auth store persists to localStorage
- [ ] Login flow works (phone/email)
- [ ] Register flow works
- [ ] Social login buttons trigger correct flows
- [ ] Guest mode activates correctly
- [ ] Guest prompt shows after 3 interactions
- [ ] Guest prompt respects 30min cooldown
- [ ] Welcome bubbles animate smoothly
- [ ] Bubble click enters guest mode + sends message
- [ ] GuestGate modal shows on protected actions
- [ ] Logout clears state correctly
- [ ] Page refresh maintains auth state
- [ ] Auth guards block guest users appropriately

---

## Next Steps

1. ✅ Analysis complete
2. ⏳ Create auth store in zeneme-next
3. ⏳ Create auth components
4. ⏳ Integrate with routing
5. ⏳ Connect to backend APIs
6. ⏳ Test complete auth flow

---

## Notes

- Mock auth is fine for initial migration
- Real backend integration is Phase 4
- Guest mode is a key feature - prioritize it
- Welcome bubbles are a nice UX touch - keep them
- Consider adding loading states for API calls
- Add error handling for network failures
- Consider adding "Remember me" checkbox
- Consider adding biometric auth (future)

