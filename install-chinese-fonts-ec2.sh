#!/bin/bash
# Install Chinese fonts on Amazon Linux 2 / EC2
# Run this on EC2: bash install-chinese-fonts-ec2.sh

set -e

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                    CHINESE FONTS INSTALLATION FOR EC2                     ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"

# Check if running on Amazon Linux
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "Detected OS: $NAME $VERSION"
else
    echo "⚠️  Cannot detect OS version"
fi

echo -e "\n[1/5] Updating package manager..."
sudo yum update -y

echo -e "\n[2/5] Installing Chinese font packages..."
# Install common Chinese fonts
sudo yum install -y \
    wqy-microhei-fonts \
    wqy-zenhei-fonts \
    dejavu-sans-fonts \
    dejavu-serif-fonts \
    dejavu-sans-mono-fonts

echo -e "\n[3/5] Updating font cache..."
sudo fc-cache -fv

echo -e "\n[4/5] Verifying Chinese font installation..."
echo "Available Chinese fonts:"
fc-list :lang=zh | head -10

if fc-list :lang=zh | grep -q "WenQuanYi\|Noto\|Droid"; then
    echo "✓ Chinese fonts installed successfully"
else
    echo "⚠️  Chinese fonts may not be properly installed"
    echo "   Trying alternative installation method..."

    # Alternative: Install Google Noto fonts
    echo -e "\n   Installing Google Noto CJK fonts..."
    sudo yum install -y google-noto-sans-cjk-fonts google-noto-serif-cjk-fonts 2>/dev/null || {
        echo "   Google Noto fonts not available in repository"
        echo "   Installing from source..."

        # Download and install Noto Sans CJK manually
        cd /tmp
        wget -q https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf
        sudo mkdir -p /usr/share/fonts/noto-cjk
        sudo mv NotoSansCJKsc-Regular.otf /usr/share/fonts/noto-cjk/
        sudo fc-cache -fv
    }
fi

echo -e "\n[5/5] Testing matplotlib with Chinese characters..."
cd ~/zeneAI/ai-chat-api

# Create test script
cat > /tmp/test_chinese_fonts.py << 'EOF'
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager
import sys

# Find Chinese fonts
chinese_fonts = [f for f in font_manager.findSystemFonts()
                 if any(name in f.lower() for name in ['wqy', 'noto', 'droid', 'simhei', 'simsun'])]

print(f"Found {len(chinese_fonts)} Chinese font files:")
for font in chinese_fonts[:5]:
    print(f"  - {font}")

if not chinese_fonts:
    print("❌ No Chinese fonts found!")
    sys.exit(1)

# Test rendering
try:
    plt.figure(figsize=(8, 6))
    plt.text(0.5, 0.5, '测试中文字符', fontsize=20, ha='center')
    plt.title('中文字体测试')
    plt.savefig('/tmp/chinese_test.png', dpi=100, bbox_inches='tight')
    print("\n✓ Chinese character rendering test successful!")
    print("  Test image saved to: /tmp/chinese_test.png")
except Exception as e:
    print(f"\n❌ Chinese character rendering failed: {e}")
    sys.exit(1)
EOF

# Run test
python3 /tmp/test_chinese_fonts.py

echo -e "\n╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                              INSTALLATION COMPLETE                         ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"

echo -e "\nChinese fonts have been installed!"
echo ""
echo "Next steps:"
echo "1. Restart the backend to pick up new fonts:"
echo "   pm2 restart zeneai-backend"
echo ""
echo "2. Generate a new report to test Chinese characters"
echo ""
echo "3. If charts still show boxes instead of Chinese:"
echo "   - Check backend logs: pm2 logs zeneai-backend"
echo "   - Verify fonts: fc-list :lang=zh"
echo "   - The drawing_utils.py should auto-detect the fonts"
echo ""
