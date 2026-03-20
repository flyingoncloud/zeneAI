# Voice Recognition Implementation

## Overview

Replaced the simulated voice input with real Web Speech API implementation for actual speech-to-text functionality.

---

## Changes Made

### File: `zeneme-next/src/components/ChatInput.tsx`

**Removed:**
- Simulation-based voice input (typing animation with pre-defined phrases)
- Timer-based auto-send logic
- Hardcoded Chinese phrases

**Added:**
- Real Web Speech API integration
- Continuous speech recognition with interim results
- Real-time transcription display
- Proper error handling for various scenarios
- Browser compatibility detection

---

## Features

### 1. Real Speech Recognition
- Uses browser's native Web Speech API
- Supports continuous speech (keeps listening until stopped)
- Shows interim results in real-time as user speaks
- Appends final results to input field

### 2. Language Support
- Default: Chinese (zh-CN)
- Can be extended to support multiple languages
- Detects and handles language-specific errors

### 3. Permission Handling
- First-time permission dialog (UI)
- Detects browser permission denial
- Shows appropriate error messages
- Remembers user's permission choice

### 4. Error Handling
- **not-allowed / permission-denied**: Shows permission denied toast
- **no-speech**: Silently stops listening (user didn't speak)
- **Other errors**: Shows generic error toast
- **Browser not supported**: Shows "microphone not available" toast

### 5. Visual Feedback
- Microphone icon changes when listening
- Input field updates in real-time with speech
- Toast notifications for errors
- Smooth animations

---

## Browser Compatibility

### Supported Browsers:
- ✅ Chrome/Edge (desktop & mobile) - Full support
- ✅ Safari (desktop & iOS) - Full support
- ✅ Opera - Full support
- ❌ Firefox - Not supported (shows tooltip with guidance)

### Firefox Handling:
- Mic button is disabled and grayed out
- Tooltip appears on hover: "语音输入在当前浏览器不可用，请使用 Chrome 或 Safari"
- No error toasts or permission dialogs
- Clean user experience with clear guidance

### Detection:
```typescript
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
  setIsSpeechSupported(false); // Disable mic button, show tooltip
}
```

---

## User Flow

### First Time Use:
1. User clicks microphone button
2. Permission dialog appears (app UI)
3. User clicks "允许" (Allow)
4. Browser requests microphone permission (native)
5. User grants permission
6. Speech recognition starts
7. User speaks → text appears in input field
8. User clicks mic again to stop or clicks send

### Subsequent Uses:
1. User clicks microphone button
2. Speech recognition starts immediately
3. User speaks → text appears
4. User stops or sends

### Permission Denied:
1. User clicks microphone button
2. Toast shows: "麦克风权限被拒绝"
3. User must enable permissions in browser settings

---

## Technical Implementation

### Initialization (useEffect):
```typescript
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = true;  // Keep listening
recognition.interimResults = true;  // Show interim results
recognition.lang = 'zh-CN';  // Chinese language
```

### Event Handlers:

**onresult**: Processes speech results
- Separates interim (temporary) and final (confirmed) results
- Updates input field with interim results
- Appends final results to existing text

**onerror**: Handles errors
- Permission denied → show toast
- No speech → silently stop
- Other errors → show error message

**onend**: Cleanup when recognition stops
- Sets isListening to false
- Allows user to start again

---

## Configuration Options

### Language:
Currently hardcoded to `zh-CN` (Chinese). Can be made dynamic:
```typescript
recognition.lang = language === 'zh' ? 'zh-CN' : 'en-US';
```

### Continuous Mode:
```typescript
recognition.continuous = true;  // Keeps listening until stopped
recognition.continuous = false; // Stops after first result
```

### Interim Results:
```typescript
recognition.interimResults = true;  // Show real-time transcription
recognition.interimResults = false; // Only show final results
```

---

## Testing Checklist

- [ ] Click mic button → permission dialog appears
- [ ] Grant permission → mic starts listening
- [ ] Speak Chinese → text appears in input field
- [ ] Speak continuously → text keeps updating
- [ ] Click mic again → stops listening
- [ ] Click send → message sent with transcribed text
- [ ] Deny permission → error toast appears
- [ ] Test in Chrome (desktop)
- [ ] Test in Safari (desktop)
- [ ] Test in Chrome (mobile)
- [ ] Test in Safari (iOS)
- [ ] Test in WeChat browser (if applicable)

---

## Known Limitations

1. **Firefox Support**: Firefox doesn't support Web Speech API - mic button is disabled with tooltip guidance
2. **Accuracy**: Depends on browser's speech recognition engine
3. **Internet Required**: Most browsers require internet connection for speech recognition
4. **Language Detection**: Currently fixed to Chinese, doesn't auto-detect
5. **Background Noise**: May affect accuracy in noisy environments

---

## Future Enhancements

1. **Auto-detect language** based on user's browser/system settings
2. **Language switcher** in UI to toggle between Chinese/English
3. **Noise cancellation** using Web Audio API
4. **Offline support** using browser's offline speech recognition (if available)
5. **Voice activity detection** to auto-stop after silence
6. **Punctuation** auto-insertion based on pauses
7. **Fallback** to simulation mode if Web Speech API not available

---

## Troubleshooting

### Microphone not working:
1. Check browser compatibility (Chrome, Safari, Edge supported; Firefox not supported)
2. Check browser permissions (chrome://settings/content/microphone)
3. Ensure HTTPS connection (required for microphone access)
4. Check if microphone is connected and working
5. For Firefox users: Switch to Chrome or Safari browser

### Text not appearing:
1. Check console for errors
2. Verify language setting matches spoken language
3. Ensure speaking clearly and at normal volume
4. Check internet connection

### Permission denied:
1. Clear browser permissions and try again
2. Check system microphone permissions (macOS/Windows)
3. Restart browser

---

## Files Modified

1. `zeneme-next/src/components/ChatInput.tsx` - Replaced simulation with Web Speech API

---

## Commit Message

```
feat: implement real voice recognition using Web Speech API

- Replace simulated voice input with actual speech recognition
- Add Web Speech API integration with continuous listening
- Support real-time transcription with interim results
- Handle permission requests and errors properly
- Add browser compatibility detection
- Support Chinese language (zh-CN) by default
- Show appropriate error messages for various scenarios
- Remove hardcoded simulation phrases and timers
```
