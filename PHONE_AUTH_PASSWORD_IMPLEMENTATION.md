# Phone Authentication with Password - Implementation Plan

**Date**: February 27, 2026
**Status**: Planning

---

## Current Behavior (Problems)

### Phone Registration
- ❌ Only uses verification code
- ❌ No password field
- ❌ User cannot set a password during registration

### Phone Login
- ❌ Requires sending verification code every time
- ❌ No password login option
- ❌ Inconvenient for returning users

---

## Desired Behavior

### Phone Registration
1. User enters phone number
2. User clicks "Get Code" → receives SMS verification code
3. User enters verification code
4. ✅ **NEW**: User sets a password
5. User enters username (optional)
6. User clicks "Register" → account created with password

### Phone Login
1. User enters phone number
2. ✅ **NEW**: User enters password (no code needed)
3. User clicks "Login" → logged in immediately

### Alternative: "Forgot Password" Flow
1. User clicks "Forgot Password"
2. User enters phone number
3. User clicks "Get Code" → receives SMS verification code
4. User enters verification code
5. User sets new password
6. Password reset complete

---

## Implementation Changes

### Frontend Changes

#### 1. Update `AuthPage.tsx`

**Phone Registration Form** - Add password field:
```tsx
{method === 'phone' && view === 'register' && (
  <>
    {/* Phone number field */}
    {/* Verification code field */}
    {/* Username field */}

    {/* NEW: Password field */}
    <div className="space-y-1.5">
      <label className="text-xs text-white/80 pl-1">设置密码</label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          className="w-full h-11 rounded-xl bg-purple-900/30 border border-white/20 px-4 pr-12 text-white text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all placeholder:text-white/40"
          placeholder="请设置登录密码（至少6位）"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  </>
)}
```

**Phone Login Form** - Replace code with password:
```tsx
{method === 'phone' && view === 'login' && (
  <>
    {/* Phone number field */}

    {/* NEW: Password field (instead of verification code) */}
    <div className="space-y-1.5">
      <label className="text-xs text-white/80 pl-1">密码</label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          className="w-full h-11 rounded-xl bg-purple-900/30 border border-white/20 px-4 pr-12 text-white text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all placeholder:text-white/40"
          placeholder="请输入密码"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>

    {/* NEW: Forgot password link */}
    <div className="text-right">
      <button
        type="button"
        onClick={() => setView('forgot-password')}
        className="text-xs text-white/60 hover:text-white transition-colors"
      >
        忘记密码？
      </button>
    </div>
  </>
)}
```

#### 2. Update API calls in `handleSubmit()`

**Phone Registration**:
```tsx
if (view === 'register') {
  // Validate password
  if (!password || password.length < 6) {
    toast.error('密码至少需要6位');
    return;
  }

  const result = await registerWithPhone({
    phone,
    country_code: '+61',
    code,
    password,  // NEW: Include password
    username: username || undefined
  });
}
```

**Phone Login**:
```tsx
if (view === 'login') {
  // No code needed, use password
  const result = await loginWithPhonePassword({
    phone,
    country_code: '+61',
    password  // NEW: Use password instead of code
  });
}
```

#### 3. Add new API functions in `lib/api.ts`

```typescript
export interface PhoneRegisterRequest {
  phone: string;
  country_code?: string;
  code: string;
  password: string;
  username?: string;
}

export interface PhonePasswordLoginRequest {
  phone: string;
  country_code?: string;
  password: string;
}

/**
 * Register with phone number, verification code, and password
 */
export async function registerWithPhone(
  request: PhoneRegisterRequest
): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/phone/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error registering with phone:', error);
    throw error;
  }
}

/**
 * Login with phone number and password (no verification code needed)
 */
export async function loginWithPhonePassword(
  request: PhonePasswordLoginRequest
): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/phone/login-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error logging in with phone password:', error);
    throw error;
  }
}
```

---

### Backend Changes

#### 1. Add new request models in `auth_routes.py`

```python
class PhoneRegisterRequest(BaseModel):
    """Phone registration with verification code and password"""
    phone: str
    country_code: str = "+61"
    code: str
    password: str
    username: Optional[str] = None

    @validator('code')
    def validate_code(cls, v):
        if not re.match(r'^\d{6}$', v):
            raise ValueError('Verification code must be 6 digits')
        return v

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v


class PhonePasswordLoginRequest(BaseModel):
    """Phone login with password (no verification code)"""
    phone: str
    country_code: str = "+61"
    password: str

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v
```

#### 2. Add new endpoints

**Phone Registration** (`/auth/phone/register`):
```python
@router.post("/phone/register", response_model=AuthResponse)
async def phone_register(
    request: PhoneRegisterRequest,
    db: Session = Depends(get_db)
):
    """Register with phone number, verification code, and password"""
    try:
        phone_key = f"{request.country_code}{request.phone}"

        # Verify code first
        if phone_key not in verification_codes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No verification code found. Please request a new code."
            )

        code_data = verification_codes[phone_key]

        # Check expiration
        if datetime.utcnow() > code_data['expires_at']:
            del verification_codes[phone_key]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code expired. Please request a new code."
            )

        # Verify code
        if request.code != code_data['code']:
            code_data['attempts'] += 1
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid verification code. {3 - code_data['attempts']} attempts remaining."
            )

        # Code verified, remove from storage
        del verification_codes[phone_key]

        # Check if phone already registered
        user_id = f"phone_{hashlib.md5(phone_key.encode()).hexdigest()}"
        existing_user = db.query(UserProfile).filter(
            UserProfile.user_id == user_id
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered. Please login instead."
            )

        # Create new user with password
        username = request.username or f"User {request.phone[-4:]}"

        # Check username uniqueness
        existing_username = db.query(UserProfile).filter(
            UserProfile.username == username
        ).first()

        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken. Please choose a different username."
            )

        user_data = {
            'user_id': user_id,
            'username': username,
            'phone_number': request.phone,
            'phone_country_code': request.country_code,
            'password_hash': hash_password(request.password),  # NEW: Store password
            'auth_provider': 'phone',
            'provider_id': phone_key,
        }

        user = create_or_update_user(db, user_data)

        # Generate token
        token = generate_token()

        logger.info(f"[Auth] Phone registration successful for {phone_key}")

        return AuthResponse(
            success=True,
            message="Registration successful",
            user={
                'id': user.user_id,
                'name': user.username,
                'phone': phone_key,
            },
            token=token
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Auth] Error in phone registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
```

**Phone Password Login** (`/auth/phone/login-password`):
```python
@router.post("/phone/login-password", response_model=AuthResponse)
async def phone_login_password(
    request: PhonePasswordLoginRequest,
    db: Session = Depends(get_db)
):
    """Login with phone number and password (no verification code needed)"""
    try:
        phone_key = f"{request.country_code}{request.phone}"

        # Find user by phone
        user_id = f"phone_{hashlib.md5(phone_key.encode()).hexdigest()}"
        user = db.query(UserProfile).filter(
            UserProfile.user_id == user_id
        ).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid phone number or password"
            )

        # Verify password
        if not user.password_hash or not verify_password(request.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid phone number or password"
            )

        # Update last login
        user.last_login_at = datetime.utcnow()
        db.commit()

        # Generate token
        token = generate_token()

        logger.info(f"[Auth] Phone password login successful for {phone_key}")

        return AuthResponse(
            success=True,
            message="Login successful",
            user={
                'id': user.user_id,
                'name': user.username,
                'phone': phone_key,
            },
            token=token
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Auth] Error in phone password login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
```

#### 3. Keep existing `/auth/phone/login` for "Forgot Password" flow
- Rename to `/auth/phone/reset-password` or keep as-is
- This endpoint uses verification code (for password reset)

---

## Migration Strategy

### For Existing Users (No Password)
- Existing phone users don't have passwords
- On first login attempt with password, show error: "Please use 'Forgot Password' to set a password"
- Or: Auto-prompt to set password on next login

### Database
- `password_hash` column already exists in `UserProfile`
- No migration needed

---

## Summary of Changes

### Frontend (`zeneme-next/src/components/auth/AuthPage.tsx`)
- ✅ Add password field to phone registration form
- ✅ Replace verification code with password in phone login form
- ✅ Add "Forgot Password" link
- ✅ Update `handleSubmit()` logic for phone auth
- ✅ Add new API calls: `registerWithPhone()`, `loginWithPhonePassword()`

### Backend (`ai-chat-api/src/api/auth_routes.py`)
- ✅ Add `PhoneRegisterRequest` model (with password)
- ✅ Add `PhonePasswordLoginRequest` model
- ✅ Add `/auth/phone/register` endpoint
- ✅ Add `/auth/phone/login-password` endpoint
- ✅ Keep `/auth/phone/login` for password reset flow

### API (`zeneme-next/src/lib/api.ts`)
- ✅ Add `registerWithPhone()` function
- ✅ Add `loginWithPhonePassword()` function
- ✅ Keep `loginWithPhone()` for password reset

---

## Testing Checklist

- [ ] Phone registration with password works
- [ ] Phone login with password works
- [ ] Verification code still works for registration
- [ ] "Forgot Password" flow works (using verification code)
- [ ] Error messages are clear
- [ ] Existing email auth still works
- [ ] Password validation (min 6 characters) works

---

**Next Steps**: Implement these changes in the codebase
