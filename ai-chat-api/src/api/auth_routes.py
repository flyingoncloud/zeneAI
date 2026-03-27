"""
Authentication Routes

Handles user registration and login with:
- Email/password authentication
- Phone/SMS verification
- Google OAuth (placeholder for future implementation)
- WeChat OAuth (placeholder for future implementation)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime, timedelta
import secrets
import hashlib
import re
import logging

from src.database.database import get_db
from src.database.psychology_models import UserProfile
from src.services.sms_service import send_sms
from src.services.email_service import send_verification_email, generate_verification_code as generate_email_code

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])

# In-memory storage for verification codes (in production, use Redis)
verification_codes = {}
email_verification_codes = {}


# ============================================================================
# Request/Response Models
# ============================================================================

class PhoneVerificationRequest(BaseModel):
    phone: str
    country_code: str = "+61"

    @validator('phone')
    def validate_phone(cls, v):
        # Remove spaces and dashes
        v = re.sub(r'[\s-]', '', v)
        if not re.match(r'^\d{8,15}$', v):
            raise ValueError('Invalid phone number format')
        return v


class PhoneVerificationResponse(BaseModel):
    success: bool
    message: str
    expires_in: int = 60


class PhoneLoginRequest(BaseModel):
    phone: str
    country_code: str = "+61"
    code: str
    username: Optional[str] = None  # Optional for login, required for first-time registration

    @validator('code')
    def validate_code(cls, v):
        if not re.match(r'^\d{6}$', v):
            raise ValueError('Verification code must be 6 digits')
        return v


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


class EmailVerificationRequest(BaseModel):
    email: EmailStr


class EmailRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    code: str  # 6-digit verification code
    username: Optional[str] = None

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v

    @validator('code')
    def validate_code(cls, v):
        if not re.match(r'^\d{6}$', v):
            raise ValueError('Verification code must be 6 digits')
        return v


class EmailLoginRequest(BaseModel):
    email: EmailStr
    password: str


class SocialLoginRequest(BaseModel):
    provider: str  # 'google' or 'wechat'
    token: str
    user_info: Optional[dict] = None


class AuthResponse(BaseModel):
    success: bool
    message: str
    user: Optional[dict] = None
    token: Optional[str] = None


# ============================================================================
# Helper Functions
# ============================================================================

def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == hashed


def generate_verification_code() -> str:
    """Generate 6-digit verification code"""
    return ''.join([str(secrets.randbelow(10)) for _ in range(6)])


def generate_token() -> str:
    """Generate authentication token"""
    return secrets.token_urlsafe(32)


def create_or_update_user(db: Session, user_data: dict) -> UserProfile:
    """Create or update user profile"""
    user_id = user_data.get('user_id')

    # Check if user exists
    user = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()

    if user:
        # Update existing user
        for key, value in user_data.items():
            if hasattr(user, key) and value is not None:
                setattr(user, key, value)
        user.updated_at = datetime.utcnow()
        user.last_login_at = datetime.utcnow()
    else:
        # Create new user
        user_data['last_login_at'] = datetime.utcnow()
        user = UserProfile(**user_data)
        db.add(user)

    db.commit()
    db.refresh(user)
    return user


# ============================================================================
# Phone Authentication Endpoints
# ============================================================================

@router.post("/phone/send-code", response_model=PhoneVerificationResponse)
async def send_phone_verification_code(
    request: PhoneVerificationRequest,
    db: Session = Depends(get_db)
):
    """Send verification code to phone number for registration"""
    try:
        phone_key = f"{request.country_code}{request.phone}"

        # Check if phone number already registered
        user_id = f"phone_{hashlib.md5(phone_key.encode()).hexdigest()}"
        existing_user = db.query(UserProfile).filter(
            UserProfile.user_id == user_id
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered. Please login instead."
            )

        # Generate code
        code = generate_verification_code()

        # Store code with expiration (60 seconds)
        verification_codes[phone_key] = {
            'code': code,
            'expires_at': datetime.utcnow() + timedelta(seconds=60),
            'attempts': 0
        }

        # Send SMS
        success = send_sms(phone_key, code)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send verification code"
            )

        logger.info(f"[Auth] Verification code sent to {phone_key}: {code}")

        return PhoneVerificationResponse(
            success=True,
            message="Verification code sent successfully",
            expires_in=60
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Auth] Error sending verification code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


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

        # Check attempts
        if code_data['attempts'] >= 3:
            del verification_codes[phone_key]
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed attempts. Please request a new code."
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
            'password_hash': hash_password(request.password),
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


@router.post("/phone/login", response_model=AuthResponse)
async def phone_login(
    request: PhoneLoginRequest,
    db: Session = Depends(get_db)
):
    """Login or register with phone number and verification code (for password reset or legacy)"""
    try:
        phone_key = f"{request.country_code}{request.phone}"

        # Check if code exists
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

        # Check attempts
        if code_data['attempts'] >= 3:
            del verification_codes[phone_key]
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed attempts. Please request a new code."
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

        # Check if user already exists
        user_id = f"phone_{hashlib.md5(phone_key.encode()).hexdigest()}"
        existing_user = db.query(UserProfile).filter(
            UserProfile.user_id == user_id
        ).first()

        if existing_user:
            # Existing user - just login
            user = existing_user
            logger.info(f"[Auth] Phone login successful for {phone_key}")
        else:
            # New user - registration
            # Use provided username or generate one
            username = request.username if hasattr(request, 'username') and request.username else f"User {request.phone[-4:]}"

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
                'auth_provider': 'phone',
                'provider_id': phone_key,
            }

            user = create_or_update_user(db, user_data)
            logger.info(f"[Auth] Phone registration successful for {phone_key}")

        # Generate token
        token = generate_token()

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
        logger.error(f"[Auth] Error in phone login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ============================================================================
# Email Authentication Endpoints
# ============================================================================

@router.post("/email/send-code")
async def send_email_verification_code(request: EmailVerificationRequest):
    """Send verification code to email"""
    try:
        # Generate 6-digit code
        code = generate_email_code()

        # Store code with expiration (10 minutes)
        email_verification_codes[request.email] = {
            'code': code,
            'expires_at': datetime.utcnow() + timedelta(minutes=10),
            'attempts': 0
        }

        # Send email
        success = send_verification_email(request.email, code)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send verification email"
            )

        logger.info(f"[Auth] Verification email sent to {request.email}: {code}")

        return {
            "success": True,
            "message": "Verification code sent to your email"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Auth] Error sending verification email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"500: {str(e)}"
        )


@router.post("/email/register", response_model=AuthResponse)
async def email_register(
    request: EmailRegisterRequest,
    db: Session = Depends(get_db)
):
    """Register with email, password, and verification code"""
    try:
        # Verify email code first
        if request.email not in email_verification_codes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No verification code found. Please request a new code."
            )

        code_data = email_verification_codes[request.email]

        # Check expiration
        if datetime.utcnow() > code_data['expires_at']:
            del email_verification_codes[request.email]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code expired. Please request a new code."
            )

        # Check attempts
        if code_data['attempts'] >= 3:
            del email_verification_codes[request.email]
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed attempts. Please request a new code."
            )

        # Verify code
        if request.code != code_data['code']:
            code_data['attempts'] += 1
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid verification code. {3 - code_data['attempts']} attempts remaining."
            )

        # Code verified, remove from storage
        del email_verification_codes[request.email]

        # Check if email already exists
        existing_user = db.query(UserProfile).filter(
            UserProfile.email == request.email
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Check if username already exists
        username = request.username or request.email.split('@')[0]
        existing_username = db.query(UserProfile).filter(
            UserProfile.username == username
        ).first()

        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken. Please choose a different username."
            )

        # Create user
        user_id = f"email_{hashlib.md5(request.email.encode()).hexdigest()}"

        user_data = {
            'user_id': user_id,
            'username': username,
            'email': request.email,
            'password_hash': hash_password(request.password),
            'auth_provider': 'email',
            'provider_id': request.email,
        }

        user = create_or_update_user(db, user_data)

        # Generate token
        token = generate_token()

        logger.info(f"[Auth] Email registration successful for {request.email}")

        return AuthResponse(
            success=True,
            message="Registration successful",
            user={
                'id': user.user_id,
                'name': user.username,
                'email': user.email,
            },
            token=token
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Auth] Error in email registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/email/login", response_model=AuthResponse)
async def email_login(
    request: EmailLoginRequest,
    db: Session = Depends(get_db)
):
    """Login with email and password"""
    try:
        # Find user
        user = db.query(UserProfile).filter(
            UserProfile.email == request.email
        ).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Verify password
        if not user.password_hash or not verify_password(request.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Generate token
        token = generate_token()

        logger.info(f"[Auth] Email login successful for {request.email}")

        return AuthResponse(
            success=True,
            message="Login successful",
            user={
                'id': user.user_id,
                'name': user.username,
                'email': user.email,
            },
            token=token
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Auth] Error in email login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ============================================================================
# Social Authentication Endpoints
# ============================================================================

@router.post("/social/login", response_model=AuthResponse)
async def social_login(
    request: SocialLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login with social provider (Google, WeChat)
    For Google: verifies access token with Google userinfo API
    """
    try:
        if request.provider not in ['google', 'wechat']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported provider"
            )

        if request.provider == 'google':
            # Verify Google access token by fetching user info
            import httpx
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    'https://www.googleapis.com/oauth2/v3/userinfo',
                    headers={'Authorization': f'Bearer {request.token}'}
                )
                if resp.status_code != 200:
                    logger.error(f"[Auth] Google token verification failed: {resp.status_code} {resp.text}")
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid Google token"
                    )
                google_user = resp.json()

            email = google_user.get('email', '')
            name = google_user.get('name', 'Google User')
            avatar = google_user.get('picture', '')
            google_sub = google_user.get('sub', '')

            if not email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Google account has no email"
                )

            user_id = f"google_{hashlib.md5(email.encode()).hexdigest()}"
            user_data = {
                'user_id': user_id,
                'username': name,
                'email': email,
                'avatar_url': avatar,
                'auth_provider': 'google',
                'provider_id': google_sub or email,
            }
        else:
            # WeChat — placeholder
            user_info = request.user_info or {}
            email = user_info.get('email', f"wechat_{request.token[:8]}@placeholder.com")
            name = user_info.get('name', 'WeChat User')
            user_id = f"wechat_{hashlib.md5(email.encode()).hexdigest()}"
            user_data = {
                'user_id': user_id,
                'username': name,
                'email': email,
                'auth_provider': 'wechat',
                'provider_id': email,
            }

        user = create_or_update_user(db, user_data)
        token = generate_token()

        logger.info(f"[Auth] Social login successful for {request.provider}: {user_data.get('email')}")

        return AuthResponse(
            success=True,
            message="Login successful",
            user={
                'id': user.user_id,
                'name': user.username,
                'email': user.email,
                'provider': request.provider,
            },
            token=token
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Auth] Error in social login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ============================================================================
# WeChat OAuth Endpoints
# ============================================================================

# In-memory storage for WeChat OAuth state tokens (in production, use Redis)
wechat_oauth_states = {}

@router.get("/wechat/login-url")
async def get_wechat_login_url():
    """
    Generate WeChat OAuth login URL with QR code

    Returns URL that displays QR code for user to scan with WeChat app
    """
    try:
        from src.services.wechat_oauth import get_wechat_login_url, is_configured

        if not is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="WeChat OAuth not configured. Please set WECHAT_APP_ID and WECHAT_APP_SECRET in .env"
            )

        # Generate state token for CSRF protection
        state = secrets.token_urlsafe(32)

        # Store state with expiration (5 minutes)
        wechat_oauth_states[state] = {
            'created_at': datetime.utcnow(),
            'expires_at': datetime.utcnow() + timedelta(minutes=5)
        }

        # Generate WeChat OAuth URL
        login_url = get_wechat_login_url(state)

        logger.info(f"[Auth] Generated WeChat login URL with state: {state[:8]}...")

        return {
            'success': True,
            'login_url': login_url,
            'state': state
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Auth] Error generating WeChat login URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/wechat/callback")
async def wechat_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db)
):
    """
    Handle WeChat OAuth callback

    WeChat redirects here after user scans QR code and authorizes
    """
    try:
        from src.services.wechat_oauth import exchange_code_for_token, get_user_info

        # Verify state token
        if state not in wechat_oauth_states:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired state token"
            )

        state_data = wechat_oauth_states[state]

        # Check expiration
        if datetime.utcnow() > state_data['expires_at']:
            del wechat_oauth_states[state]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="State token expired"
            )

        # Remove used state token
        del wechat_oauth_states[state]

        # Exchange code for access token
        token_data = exchange_code_for_token(code)
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange code for token"
            )

        access_token = token_data['access_token']
        openid = token_data['openid']
        unionid = token_data.get('unionid')  # May not be available

        # Get user info from WeChat
        wechat_user = get_user_info(access_token, openid)
        if not wechat_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user info from WeChat"
            )

        # Create or update user in database
        # Use unionid if available (consistent across apps), otherwise use openid
        provider_id = unionid or openid
        user_id = f"wechat_{hashlib.md5(provider_id.encode()).hexdigest()}"

        # Check if user exists
        existing_user = db.query(UserProfile).filter(
            UserProfile.user_id == user_id
        ).first()

        user_data = {
            'user_id': user_id,
            'username': wechat_user.get('nickname', 'WeChat User'),
            'auth_provider': 'wechat',
            'provider_id': provider_id,
            'avatar_url': wechat_user.get('headimgurl'),
        }

        user = create_or_update_user(db, user_data)

        # Generate authentication token
        auth_token = generate_token()

        logger.info(f"[Auth] WeChat login successful for openid: {openid}")

        return AuthResponse(
            success=True,
            message="WeChat login successful",
            user={
                'id': user.user_id,
                'name': user.username,
                'avatar': user.avatar_url,
                'provider': 'wechat',
            },
            token=auth_token
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Auth] Error in WeChat callback: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ============================================================================
# Utility Endpoints
# ============================================================================

@router.get("/verify-token")
async def verify_token(token: str, db: Session = Depends(get_db)):
    """Verify authentication token (placeholder)"""
    # TODO: Implement proper token verification with JWT or session storage
    return {
        "valid": True,
        "message": "Token verification not fully implemented"
    }
