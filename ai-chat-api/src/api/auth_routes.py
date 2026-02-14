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

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])

# In-memory storage for verification codes (in production, use Redis)
verification_codes = {}


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

    @validator('code')
    def validate_code(cls, v):
        if not re.match(r'^\d{6}$', v):
            raise ValueError('Verification code must be 6 digits')
        return v


class EmailRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    username: Optional[str] = None

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
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
    """Send verification code to phone number"""
    try:
        phone_key = f"{request.country_code}{request.phone}"

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

    except Exception as e:
        logger.error(f"[Auth] Error sending verification code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/phone/login", response_model=AuthResponse)
async def phone_login(
    request: PhoneLoginRequest,
    db: Session = Depends(get_db)
):
    """Login or register with phone number and verification code"""
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

        # Create or get user
        user_id = f"phone_{hashlib.md5(phone_key.encode()).hexdigest()}"
        user_data = {
            'user_id': user_id,
            'username': f"User {request.phone[-4:]}",
        }

        user = create_or_update_user(db, user_data)

        # Generate token
        token = generate_token()

        logger.info(f"[Auth] Phone login successful for {phone_key}")

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

@router.post("/email/register", response_model=AuthResponse)
async def email_register(
    request: EmailRegisterRequest,
    db: Session = Depends(get_db)
):
    """Register with email and password"""
    try:
        # Check if email already exists
        existing_user = db.query(UserProfile).filter(
            UserProfile.email == request.email
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Create user
        user_id = f"email_{hashlib.md5(request.email.encode()).hexdigest()}"
        username = request.username or request.email.split('@')[0]

        user_data = {
            'user_id': user_id,
            'username': username,
            'email': request.email,
            'extra_data': {
                'password_hash': hash_password(request.password),
                'auth_method': 'email'
            }
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

    This is a placeholder implementation. In production:
    - For Google: Verify token with Google OAuth API
    - For WeChat: Verify token with WeChat API
    """
    try:
        # TODO: Verify token with provider
        # For now, accept any token for demo purposes

        if request.provider not in ['google', 'wechat']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported provider"
            )

        # Extract user info from token (in production, get from provider API)
        user_info = request.user_info or {}
        email = user_info.get('email', f"{request.provider}_{request.token[:8]}@example.com")
        name = user_info.get('name', f"{request.provider.title()} User")

        # Create or get user
        user_id = f"{request.provider}_{hashlib.md5(email.encode()).hexdigest()}"
        user_data = {
            'user_id': user_id,
            'username': name,
            'email': email,
            'extra_data': {
                'auth_method': request.provider,
                'provider_token': request.token
            }
        }

        user = create_or_update_user(db, user_data)

        # Generate token
        token = generate_token()

        logger.info(f"[Auth] Social login successful for {request.provider}: {email}")

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
