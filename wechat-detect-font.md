# 手机端检测与浏览器跳转解决方案

## 1. 环境检测 (Environment Detection)

通过 JavaScript 的 `navigator.userAgent` 可以精确判断用户当前的访问环境。

### 检测是否为手机端
```javascript
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
```

### 检测是否为微信内置浏览器
```javascript
function isWechat() {
    return /MicroMessenger/i.test(navigator.userAgent);
}
```

---

## 2. 核心挑战：微信内“强制”跳转的真相

**重要提示：** 微信内部**无法直接通过代码强制**唤起手机自带浏览器并关闭微信。这是微信出于安全和生态闭环的限制。

目前的解决方案分为三类：

### 方案 A：遮罩引导（最稳妥、最通用）
当检测到用户在微信内打开时，显示一个全屏遮罩，提示用户点击右上角“三个点”，选择“在浏览器中打开”。

**代码示例：**
```html
<!-- 遮罩层 HTML -->
<div id="wechat-guide" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999;">
    <img src="guide-arrow.png" style="position:absolute; top:10px; right:20px; width:200px;" alt="点击右上角">
    <p style="color:#fff; text-align:center; margin-top:200px; font-size:18px;">
        请点击右上角选择“在浏览器中打开”<br>以获得最佳体验
    </p>
</div>

<script>
if (isWechat()) {
    document.getElementById('wechat-guide').style.display = 'block';
}
</script>
```

### 方案 B：利用特定 URL Scheme (部分 Android 适用)
在某些 Android 版本的微信中，通过特定的下载链接或特殊的跳转协议（如 `wtai://` 或特定的 `.apk` 链接）有时能触发系统询问是否打开浏览器，但稳定性较差，且 iOS 基本无效。

### 方案 C：中间页/中转链接 (仅限下载场景)
如果目的是让用户下载文件，可以利用微信的“应用宝”微下载链接，或者在页面顶部常驻一个提示条，告知用户微信环境可能导致显示问题，建议手动复制链接。

---

## 3. 针对“大字体”问题的综合建议

既然您的初衷是解决“大字体导致显示不友好”，除了引导用户去外部浏览器，您还可以结合第一份方案中的代码：

1.  **首选方案**：在页面加载时，先用 JS/CSS **强制禁止**微信调整字体大小（见前一份文档）。这样用户即使在微信里看，布局也是正常的。
2.  **次选方案**：如果页面功能非常复杂（如涉及大量 JS 交互或文件下载），则弹出**遮罩引导**，让用户去外部浏览器。

### 自动跳转逻辑参考
```javascript
window.onload = function() {
    if (isMobile()) {
        if (isWechat()) {
            // 方案 1: 强制禁止缩放 (解决大字体)
            // fixFontSize(); 
            
            // 方案 2: 显示引导遮罩 (强制去外部浏览器)
            showWechatGuide();
        } else {
            // 已在手机外部浏览器，正常显示
        }
    } else {
        // PC 端访问逻辑
    }
}
```
