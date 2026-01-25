# Chinese Font Fix for Chart Images

## Problem

Chinese characters are missing from chart images in the generated DOCX psychology reports. This is because matplotlib was configured to use 'DejaVu Sans' font, which doesn't support Chinese characters.

## Root Cause

In `ai-chat-api/src/resources/drawing_utils.py`:
```python
# OLD CODE (BROKEN)
plt.rcParams['font.sans-serif'] = ['DejaVu Sans']  # ❌ No Chinese support
```

## Solution

Updated the font configuration to use Chinese-compatible fonts with fallback options:

```python
# NEW CODE (FIXED)
plt.rcParams['font.sans-serif'] = [
    'PingFang SC',      # macOS default Chinese font
    'Heiti TC',         # macOS traditional Chinese
    'STHeiti',          # macOS system font
    'Microsoft YaHei',  # Windows
    'SimHei',           # Windows fallback
    'WenQuanYi Micro Hei',  # Linux
    'Noto Sans CJK SC',     # Linux fallback
    'DejaVu Sans'       # Last resort (no Chinese support)
]
```

Matplotlib will try each font in order and use the first one available on your system.

## Testing

### Step 1: Run the diagnostic tool

```bash
cd ai-chat-api
python test_chinese_fonts.py
```

This will:
1. List all Chinese-compatible fonts on your system
2. Generate a test chart (`test_chinese_font.png`)
3. Show which font matplotlib is using
4. Provide recommendations

### Step 2: Check the test image

```bash
open test_chinese_font.png
```

Verify that Chinese characters (情绪调节, 认知灵活, etc.) are displayed correctly.

### Step 3: Restart the backend

```bash
# Kill the backend
lsof -ti:8000 | xargs kill -9

# Start the backend
cd ai-chat-api
python run.py
```

### Step 4: Regenerate a report

Complete all 4 questionnaires to trigger report generation, or manually trigger it via API.

### Step 5: Check the new report

```bash
open ai-chat-api/reports/generated/psychology_report_X.docx
```

Charts should now display Chinese characters correctly.

## Platform-Specific Font Installation

### macOS (Your System)

Chinese fonts should be pre-installed:
- **PingFang SC** (苹方-简) - Default system font
- **Heiti TC** (黑体-繁) - Traditional Chinese
- **STHeiti** (华文黑体) - System font

If fonts are missing:
1. Open **Font Book** app
2. Search for "PingFang" or "Heiti"
3. Enable the fonts if they're disabled
4. Restart the backend

### Linux

Install Chinese fonts:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install fonts-wqy-microhei fonts-noto-cjk

# Fedora/RHEL
sudo dnf install wqy-microhei-fonts google-noto-sans-cjk-fonts

# Arch Linux
sudo pacman -S wqy-microhei noto-fonts-cjk
```

### Windows

Microsoft YaHei (微软雅黑) should be pre-installed. If not:
1. Download from Microsoft
2. Install the font
3. Restart the backend

## Verification Checklist

- [ ] Run `python test_chinese_fonts.py`
- [ ] Check that Chinese fonts are detected
- [ ] Verify `test_chinese_font.png` shows Chinese characters correctly
- [ ] Restart the backend
- [ ] Regenerate a psychology report
- [ ] Open the DOCX file and check all 4 charts:
  - [ ] Radar chart (五大核心心智雷达图)
  - [ ] Perspective bar chart (视角转换能力细分)
  - [ ] Relational rating scale (关系模式维度评分)
  - [ ] Growth bar chart (成长指数与变化潜能分析)

## Troubleshooting

### Issue: Test shows fonts available but characters still missing

**Solution:** Clear matplotlib cache
```bash
rm -rf ~/.matplotlib
python test_chinese_fonts.py
```

### Issue: No Chinese fonts detected on macOS

**Solution:** Check Font Book
1. Open Font Book app (Applications > Font Book)
2. Search for "PingFang SC"
3. If disabled, right-click and select "Enable"
4. Restart terminal and backend

### Issue: Charts show squares (□) instead of Chinese characters

**Solution:** Font not properly loaded
1. Verify font is installed: `fc-list | grep -i pingfang`
2. Clear matplotlib cache: `rm -rf ~/.matplotlib`
3. Restart Python/backend

### Issue: Different fonts on different systems

**Solution:** This is expected behavior
- macOS will use PingFang SC
- Windows will use Microsoft YaHei
- Linux will use WenQuanYi Micro Hei or Noto Sans CJK

All these fonts support Chinese characters correctly.

## Files Modified

- `ai-chat-api/src/resources/drawing_utils.py` - Updated font configuration
- `ai-chat-api/test_chinese_fonts.py` - New diagnostic tool

## Next Steps

1. Run the diagnostic tool to verify fonts are available
2. Restart the backend to apply changes
3. Test by generating a new report
4. If issues persist, check the troubleshooting section above

## Technical Details

### Why Multiple Fonts?

Different operating systems have different default Chinese fonts:
- **macOS**: PingFang SC (modern, clean)
- **Windows**: Microsoft YaHei (widely compatible)
- **Linux**: WenQuanYi Micro Hei or Noto Sans CJK (open source)

By providing a priority list, matplotlib automatically selects the first available font, ensuring cross-platform compatibility.

### Font Fallback Chain

```
PingFang SC → Heiti TC → STHeiti → Microsoft YaHei → SimHei →
WenQuanYi Micro Hei → Noto Sans CJK SC → DejaVu Sans
```

If none of the Chinese fonts are available, it falls back to DejaVu Sans (which won't show Chinese characters, but won't crash).

### Character Encoding

All chart labels use UTF-8 encoding:
- 情绪调节 (Emotional Regulation)
- 认知灵活 (Cognitive Flexibility)
- 关系敏感 (Relational Sensitivity)
- 内在冲突 (Internal Conflict)
- 成长潜能 (Growth Potential)

## Summary

The fix updates matplotlib's font configuration to use Chinese-compatible fonts. Since you're on macOS, it will use **PingFang SC** which is the default system font and fully supports Chinese characters.

After restarting the backend and regenerating a report, all Chinese text in charts should display correctly.
