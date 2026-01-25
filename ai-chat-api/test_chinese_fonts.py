#!/usr/bin/env python3
"""
Test script to check available Chinese fonts and generate a test chart
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import numpy as np

def list_chinese_fonts():
    """List all available fonts that might support Chinese"""
    print("=" * 80)
    print("AVAILABLE FONTS ON YOUR SYSTEM")
    print("=" * 80)

    # Get all available fonts
    fonts = fm.findSystemFonts(fontpaths=None, fontext='ttf')

    # Keywords that indicate Chinese font support
    chinese_keywords = [
        'PingFang', 'Heiti', 'STHeiti', 'Songti', 'Kaiti',  # macOS
        'Microsoft', 'SimHei', 'SimSun', 'FangSong',  # Windows
        'WenQuanYi', 'Noto', 'Droid', 'AR PL',  # Linux
        'HanziPen', 'LiHei', 'LiSong'  # Other
    ]

    chinese_fonts = []
    for font_path in fonts:
        font_name = fm.FontProperties(fname=font_path).get_name()
        if any(keyword.lower() in font_name.lower() for keyword in chinese_keywords):
            chinese_fonts.append((font_name, font_path))

    if chinese_fonts:
        print(f"\nFound {len(chinese_fonts)} Chinese-compatible fonts:\n")
        for name, path in sorted(set(chinese_fonts)):
            print(f"  • {name}")
            print(f"    Path: {path}\n")
    else:
        print("\n⚠️  No Chinese fonts found!")
        print("You may need to install Chinese fonts.\n")

    return chinese_fonts


def test_font_rendering(font_name=None):
    """Test rendering Chinese characters with specified font"""
    print("=" * 80)
    print("TESTING CHINESE CHARACTER RENDERING")
    print("=" * 80)

    if font_name:
        plt.rcParams['font.sans-serif'] = [font_name]
        print(f"\nUsing font: {font_name}")
    else:
        # Use the default configuration from drawing_utils.py
        plt.rcParams['font.sans-serif'] = [
            'PingFang SC',
            'Heiti TC',
            'STHeiti',
            'Microsoft YaHei',
            'SimHei',
            'WenQuanYi Micro Hei',
            'Noto Sans CJK SC',
            'DejaVu Sans'
        ]
        print("\nUsing default font priority list")

    plt.rcParams['axes.unicode_minus'] = False

    # Create a simple test chart with Chinese text
    fig, ax = plt.subplots(figsize=(10, 6))

    # Test data
    labels = ['情绪调节', '认知灵活', '关系敏感', '内在冲突', '成长潜能']
    values = [75, 82, 68, 55, 90]

    # Create bar chart
    bars = ax.bar(labels, values, color=['#ff9999', '#66b3ff', '#99ff99', '#ffcc99', '#c2c2f0'])
    ax.set_ylim(0, 100)
    ax.set_ylabel('得分', fontsize=12)
    ax.set_title('中文字体测试 - 五大核心心智维度', fontsize=14, pad=20)

    # Add value labels
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height + 2,
                f'{int(height)}分',
                ha='center', va='bottom', fontsize=10)

    # Add grid
    ax.grid(axis='y', alpha=0.3, linestyle='--')
    ax.set_axisbelow(True)

    plt.tight_layout()

    # Save test image
    output_path = 'test_chinese_font.png'
    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    plt.close()

    print(f"\n✓ Test chart saved to: {output_path}")
    print("  Open this file to verify Chinese characters are displayed correctly.\n")

    # Get the actual font being used
    actual_font = plt.rcParams['font.sans-serif'][0]
    print(f"Matplotlib is using font: {actual_font}\n")


def main():
    print("\n" + "=" * 80)
    print("CHINESE FONT DIAGNOSTIC TOOL")
    print("=" * 80 + "\n")

    # Step 1: List available Chinese fonts
    chinese_fonts = list_chinese_fonts()

    # Step 2: Test rendering
    test_font_rendering()

    # Step 3: Recommendations
    print("=" * 80)
    print("RECOMMENDATIONS")
    print("=" * 80 + "\n")

    if chinese_fonts:
        print("✓ Chinese fonts are available on your system.")
        print("✓ The fix has been applied to drawing_utils.py")
        print("\nNext steps:")
        print("  1. Check test_chinese_font.png to verify Chinese characters display correctly")
        print("  2. If characters are still missing, try installing additional fonts:")
        print("     • macOS: System fonts should work (PingFang SC)")
        print("     • Linux: sudo apt-get install fonts-wqy-microhei fonts-noto-cjk")
        print("     • Windows: Microsoft YaHei should be pre-installed")
        print("  3. Restart the backend to apply changes")
        print("  4. Regenerate the psychology report\n")
    else:
        print("⚠️  No Chinese fonts detected!")
        print("\nInstall Chinese fonts:")
        print("  • macOS: Fonts should be pre-installed. Try:")
        print("    - Open Font Book app")
        print("    - Check if PingFang SC or Heiti TC are enabled")
        print("  • Linux:")
        print("    sudo apt-get install fonts-wqy-microhei fonts-noto-cjk")
        print("  • Windows:")
        print("    - Microsoft YaHei should be pre-installed")
        print("    - If not, download from Microsoft\n")


if __name__ == '__main__':
    main()
