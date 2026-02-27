# OPPO WeChat Font Size Fix

## Problem
The standard WeChat font size fix works on macOS, standard Android, and iOS, but **NOT on OPPO phones** (ColorOS).

## Why OPPO is Different

### ColorOS WebView Behavior
1. **Aggressive System Font Scaling**: ColorOS applies system font scaling more aggressively than stock Android
2. **Ignores Standard CSS**: `-webkit-text-size-adjust: 100%` is often ignored
3. **Display Size Setting**: OPPO has both "Font Size" AND "Display Size" settings that both affect WebView
4. **Modified WebView**: ColorOS uses a customized WebView that doesn't fully respect standard properties

### OPPO Settings Path
- Settings → Display & Brightness → Font Size (affects text)
- Settings → Display & Brightness → Display Size (affects everything including WebView)

## Enhanced Fix for OPPO

### Solution 1: Force Pixel-Based Sizing (Recommended)

Add this to your CSS to force absolute pixel sizes that OPPO can't scale:

```css
/* globals.css - Add OPPO-specific overrides */
body {
  /* Standard fix (works on iOS/Android) */
  -webkit-text-size-adjust: 100% !important;
  text-size-adjust: 100% !important;

  /* OPPO-specific: Force pixel-based sizing */
  font-size: 16px !important;
}

/* Force all text elements to use pixels, not rem/em */
* {
  -webkit-text-size-adjust: none !important;
  text-size-adjust: none !important;
}

/* Override any rem-based sizing for critical elements */
html {
  font-size: 16px !important;
}

h1, h2, h3, h4, h5, h6, p, span, div, button, input, label {
  -webkit-text-size-adjust: none !important;
  text-size-adjust: none !important;
}
```

### Solution 2: JavaScript Detection + Meta Viewport

Add OPPO detection and force viewport scaling:

```javascript
// In layout.tsx <head> section
<script
  dangerouslySetInnerHTML={{
    __html: `
      (function() {
        // Detect OPPO device
        var isOPPO = /OPPO/i.test(navigator.userAgent) || /ColorOS/i.test(navigator.userAgent);

        if (isOPPO) {
          console.log('[OPPO] Detected OPPO device, applying enhanced font fix');

          // Force viewport to prevent scaling
          var viewport = document.querySelector('meta[name="viewport"]');
          if (viewport) {
            viewport.setAttribute('content',
              'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
            );
          }

          // Force body font size via JavaScript (overrides system scaling)
          document.addEventListener('DOMContentLoaded', function() {
            document.documentElement.style.fontSize = '16px';
            document.body.style.fontSize = '16px';
            document.body.style.webkitTextSizeAdjust = 'none';
            document.body.style.textSizeAdjust = 'none';
          });
        }

        // Standard WeChat fix (keep existing)
        if (typeof WeixinJSBridge == "object" && typeof WeixinJSBridge.invoke == "function") {
          handleFontSize();
        } else {
          if (document.addEventListener) {
            document.addEventListener("WeixinJSBridgeReady", handleFontSize, false);
          } else if (document.attachEvent) {
            document.attachEvent("WeixinJSBridgeReady", handleFontSize);
            document.attachEvent("onWeixinJSBridgeReady", handleFontSize);
          }
        }

        function handleFontSize() {
          WeixinJSBridge.invoke('setFontSizeCallback', { 'fontSize': 0 });
          WeixinJSBridge.on('menu:setfont', function() {
            WeixinJSBridge.invoke('setFontSizeCallback', { 'fontSize': 0 });
          });
        }
      })();
    `,
  }}
/>
```

### Solution 3: Use Transform Scale (Last Resort)

If OPPO still scales fonts, use CSS transform to counter-scale:

```javascript
// Detect actual font scaling and counter it
function fixOPPOFontScale() {
  var testDiv = document.createElement('div');
  testDiv.style.cssText = 'width:100px;height:0;font-size:16px;position:absolute;visibility:hidden;';
  document.body.appendChild(testDiv);

  var computedSize = parseFloat(window.getComputedStyle(testDiv).fontSize);
  var expectedSize = 16;

  if (computedSize !== expectedSize) {
    var scale = expectedSize / computedSize;
    console.log('[OPPO] Font scale detected:', computedSize, 'px, applying counter-scale:', scale);

    // Apply counter-scale to body
    document.body.style.transform = 'scale(' + scale + ')';
    document.body.style.transformOrigin = 'top left';
    document.body.style.width = (100 / scale) + '%';
  }

  document.body.removeChild(testDiv);
}

// Run after DOM loads
if (/OPPO|ColorOS/i.test(navigator.userAgent)) {
  document.addEventListener('DOMContentLoaded', fixOPPOFontScale);
}
```

## Implementation Priority

1. **Try Solution 1 first** (CSS with `text-size-adjust: none`)
2. **Add Solution 2** (OPPO detection + viewport lock)
3. **Use Solution 3 only if needed** (transform counter-scale)

## Testing on OPPO

1. Go to Settings → Display & Brightness → Font Size → Set to "Large" or "Extra Large"
2. Go to Settings → Display & Brightness → Display Size → Set to "Large"
3. Open WeChat
4. Open your app from WeChat
5. Verify fonts display at normal size

## Why This Happens

ColorOS modifies the Android WebView to:
- Apply system accessibility settings more aggressively
- Override CSS properties for "user benefit"
- Scale both font-size AND display density

This is intentional by OPPO to help users with vision impairments, but it breaks web layouts.

## Alternative: Accept the Scaling

If you want to support OPPO's accessibility features:
- Use flexible layouts (Flexbox, Grid)
- Avoid fixed heights
- Use `min-height` instead of `height`
- Test with large fonts enabled
- Ensure buttons remain clickable when text overflows

## References

- [WebView Font Scaling Issue](https://stackoverflow.com/questions/49749440/webview-stop-using-device-font-setting-and-use-style-specified-in-the-html)
- [ColorOS Display Settings](https://www.techbone.net/oppo/user-manual/display-size)
- OPPO uses modified Chromium WebView with enhanced accessibility features
