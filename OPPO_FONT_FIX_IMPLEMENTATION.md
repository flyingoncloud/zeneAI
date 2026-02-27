# OPPO WeChat Font Size Fix - Implementation Summary

**Date**: February 27, 2026
**Status**: ✅ Implemented (Solution 1 - Force Pixel-Based Sizing)

---

## Problem

WeChat font size fix was working on:
- ✅ macOS
- ✅ Standard Android
- ✅ iOS

But NOT working on:
- ❌ OPPO phones (ColorOS)

---

## Root Cause

OPPO phones use **ColorOS**, a custom Android skin with a modified WebView that:

1. **Aggressively applies system font scaling** even when CSS says not to
2. **Ignores standard CSS properties** like `-webkit-text-size-adjust: 100%`
3. **Has both "Font Size" AND "Display Size" settings** that both affect WebView
4. **Uses a customized Chromium WebView** with enhanced accessibility features

This is intentional by OPPO to help users with vision impairments, but it breaks web layouts.

---

## Solution Implemented

### Solution 1: Force Pixel-Based Sizing (Recommended)

**File Modified**: `zeneme-next/src/styles/globals.css`

### Changes Made

#### 1. Force `text-size-adjust: none` on ALL elements
```css
@layer base {
  * {
    @apply border-border outline-ring/50;
    /* OPPO-specific: Force no text size adjustment on all elements */
    -webkit-text-size-adjust: none !important;
    text-size-adjust: none !important;
  }
}
```

#### 2. Add OPPO-specific body font size override
```css
body {
  @apply bg-background text-foreground;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* Prevent WeChat browser from scaling fonts (iOS/Android) */
  -webkit-text-size-adjust: 100% !important;
  text-size-adjust: 100% !important;
  /* OPPO-specific: Force pixel-based sizing */
  font-size: 16px !important;
}
```

#### 3. Force all text elements to ignore system font scaling
```css
/* OPPO-specific: Force all text elements to ignore system font scaling */
h1, h2, h3, h4, h5, h6, p, span, div, button, input, label, textarea, select {
  -webkit-text-size-adjust: none !important;
  text-size-adjust: none !important;
}
```

#### 4. Force 16px base font size on html element
```css
html {
  /* Force 16px base font size (OPPO-specific fix) */
  font-size: 16px !important;
}
```

---

## How It Works

### Standard Android/iOS
- Uses `-webkit-text-size-adjust: 100%` to prevent scaling
- Uses `WeixinJSBridge.invoke('setFontSizeCallback', { 'fontSize': 0 })` for WeChat

### OPPO (ColorOS)
- Uses `-webkit-text-size-adjust: none` (more aggressive than `100%`)
- Forces absolute pixel sizing (`16px`) instead of relative units
- Applies to ALL elements (`*`) and all text elements explicitly
- Overrides ColorOS's WebView font scaling at multiple levels

---

## Testing Instructions

### On OPPO Phone

1. **Set Large Font Size**:
   - Settings → Display & Brightness → Font Size → "Large" or "Extra Large"

2. **Set Large Display Size**:
   - Settings → Display & Brightness → Display Size → "Large"

3. **Test in WeChat**:
   - Open WeChat
   - Open your app from WeChat
   - Verify fonts display at normal size (16px)
   - Verify layout doesn't break

### Expected Result
- Fonts should remain at 16px regardless of OPPO system settings
- Layout should not break or overflow
- Text should be readable and properly aligned

---

## Trade-offs

### Pros
- ✅ Fixes layout breaking on OPPO phones
- ✅ Consistent UI across all devices
- ✅ Simple and reliable solution
- ✅ No JavaScript detection needed

### Cons
- ❌ Ignores user's accessibility preferences on OPPO
- ❌ May not be ideal for users with vision impairments
- ❌ Uses `!important` which can be hard to override

---

## Alternative Solutions (Not Implemented)

### Solution 2: JavaScript Detection + Meta Viewport
- Detect OPPO device via User-Agent
- Force viewport scaling
- More complex, requires JavaScript

### Solution 3: Transform Counter-Scale
- Detect actual font scaling
- Apply CSS transform to counter-scale
- Last resort, can cause layout issues

---

## Files Modified

1. `zeneme-next/src/styles/globals.css` - Added OPPO-specific CSS overrides
2. `docs/solutions/WECHAT_FONT_SIZE_FIX.md` - Updated documentation
3. `docs/solutions/OPPO_WECHAT_FONT_FIX.md` - Created OPPO-specific guide

---

## References

- [WebView Font Scaling Issue](https://stackoverflow.com/questions/49749440/webview-stop-using-device-font-setting-and-use-style-specified-in-the-html)
- [ColorOS Display Settings](https://www.techbone.net/oppo/user-manual/display-size)
- Original issue: `WeChat-font-size.md`

---

## Next Steps

1. Test on actual OPPO device with large font/display settings
2. Verify layout doesn't break in WeChat browser
3. Deploy to production if tests pass
4. Monitor user feedback from OPPO users

---

**Status**: ✅ Ready for testing on OPPO devices
