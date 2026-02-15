"""
WeChat OAuth Service for Web-based Login (QR Code)

Implements WeChat Open Platform OAuth 2.0 flow for website applications.
Users scan QR code with WeChat mobile app to authorize login.

Documentation: https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html
"""

import os
import requests
import logging
from typing import Optional, Dict
from urllib.parse import urlencode

logger = logging.getLogger(__name__)

# WeChat OAuth Configuration
WECHAT_APP_ID = os.getenv('WECHAT_APP_ID', '')
WECHAT_APP_SECRET = os.getenv('WECHAT_APP_SECRET', '')
WECHAT_REDIRECT_URI = os.getenv('WECHAT_REDIRECT_URI', 'http://localhost:3000/auth/wechat/callback')

# WeChat OAuth URLs
WECHAT_AUTH_URL = "https://open.weixin.qq.com/connect/qrconnect"
WECHAT_TOKEN_URL = "https://api.weixin.qq.com/sns/oauth2/access_token"
WECHAT_USERINFO_URL = "https://api.weixin.qq.com/sns/userinfo"


def get_wechat_login_url(state: str) -> str:
    """
    Generate WeChat OAuth login URL for QR code display

    Args:
        state: Random string for CSRF protection (recommended 32 chars)

    Returns:
        WeChat OAuth authorization URL that displays QR code

    Example:
        state = secrets.token_urlsafe(32)
        url = get_wechat_login_url(state)
        # User visits this URL and sees QR code to scan
    """
    params = {
        'appid': WECHAT_APP_ID,
        'redirect_uri': WECHAT_REDIRECT_URI,
        'response_type': 'code',
        'scope': 'snsapi_login',  # For website login (shows QR code)
        'state': state
    }

    query_string = urlencode(params)
    return f"{WECHAT_AUTH_URL}?{query_string}#wechat_redirect"


def exchange_code_for_token(code: str) -> Optional[Dict]:
    """
    Exchange authorization code for access token

    Args:
        code: Authorization code from WeChat callback

    Returns:
        Dict with:
        - access_token: Access token for API calls
        - expires_in: Token expiration time (seconds)
        - refresh_token: Token for refreshing access_token
        - openid: User's unique ID for this app
        - scope: Authorized scope
        - unionid: User's unique ID across all apps (if available)

    Returns None if request fails
    """
    try:
        params = {
            'appid': WECHAT_APP_ID,
            'secret': WECHAT_APP_SECRET,
            'code': code,
            'grant_type': 'authorization_code'
        }

        response = requests.get(WECHAT_TOKEN_URL, params=params, timeout=10)
        data = response.json()

        if 'errcode' in data:
            logger.error(f"[WeChat] Token error {data['errcode']}: {data.get('errmsg', 'Unknown error')}")
            return None

        logger.info(f"[WeChat] Successfully obtained access token for openid: {data.get('openid')}")
        return data

    except Exception as e:
        logger.error(f"[WeChat] Token request failed: {e}")
        return None


def get_user_info(access_token: str, openid: str) -> Optional[Dict]:
    """
    Get WeChat user information

    Args:
        access_token: Access token from exchange_code_for_token
        openid: User's OpenID from token response

    Returns:
        Dict with:
        - openid: User's unique ID
        - nickname: User's display name
        - sex: Gender (1=male, 2=female, 0=unknown)
        - province: Province name
        - city: City name
        - country: Country name
        - headimgurl: Avatar URL
        - privilege: User privileges
        - unionid: Unified ID across apps (if available)

    Returns None if request fails
    """
    try:
        params = {
            'access_token': access_token,
            'openid': openid,
            'lang': 'zh_CN'  # Language: zh_CN, zh_TW, en
        }

        response = requests.get(WECHAT_USERINFO_URL, params=params, timeout=10)
        data = response.json()

        if 'errcode' in data:
            logger.error(f"[WeChat] User info error {data['errcode']}: {data.get('errmsg', 'Unknown error')}")
            return None

        logger.info(f"[WeChat] Successfully retrieved user info for: {data.get('nickname')}")
        return data

    except Exception as e:
        logger.error(f"[WeChat] User info request failed: {e}")
        return None


def is_configured() -> bool:
    """
    Check if WeChat OAuth is properly configured

    Returns:
        True if APP_ID and APP_SECRET are set
    """
    return bool(WECHAT_APP_ID and WECHAT_APP_SECRET)
