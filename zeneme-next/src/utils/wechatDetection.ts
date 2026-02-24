/**
 * WeChat and Mobile Detection Utilities
 */

/**
 * Detects if the user is accessing from WeChat's built-in browser
 */
export function isWechat(): boolean {
  if (typeof window === 'undefined') return false;
  return /MicroMessenger/i.test(navigator.userAgent);
}

/**
 * Detects if the user is on a mobile device
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Checks if user has dismissed the WeChat browser suggestion banner
 */
export function hasUserDismissedWechatBanner(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('zeneme-wechat-banner-dismissed') === 'true';
}

/**
 * Marks the WeChat browser suggestion banner as dismissed
 */
export function dismissWechatBanner(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('zeneme-wechat-banner-dismissed', 'true');
}
