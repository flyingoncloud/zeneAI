# 微信内置浏览器大字体解决方案汇总

## 1. 强制禁止字体缩放（最常用方案）

这种方案通过代码强制将页面字体恢复到 100% 比例，不随系统设置改变。

### iOS 端 (CSS)
在全局样式表中添加：
```css
body {
    -webkit-text-size-adjust: 100% !important;
    text-size-adjust: 100% !important;
}
```

### Android 端 (JavaScript)
Android 端 CSS 往往无效，需要通过微信特有的 `WeixinJSBridge` 接口处理：
```javascript
(function() {
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
        // 设置字体大小回调
        WeixinJSBridge.invoke('setFontSizeCallback', { 'fontSize': 0 });
        // 重写设置字体的方法，防止用户通过右上角菜单再次调整
        WeixinJSBridge.on('menu:setfont', function() {
            WeixinJSBridge.invoke('setFontSizeCallback', { 'fontSize': 0 });
        });
    }
})();
```

## 2. 智能适配方案（推荐用于“关怀模式”）

强制禁止字体缩放虽然解决了布局问题，但对视力不佳的老年用户不友好。

### 方案 A：检测缩放比例并动态修正
通过计算一个基准元素的实际宽度与预期宽度的比例，反向计算 `rem` 的基准值。
```javascript
function fixRem() {
    var $html = document.getElementsByTagName('html')[0];
    var $body = document.getElementsByTagName('body')[0];
    
    // 创建一个隐藏的 div 来测量实际渲染的字体大小
    var div = document.createElement('div');
    div.style.width = '10rem';
    div.style.height = '0';
    div.style.visibility = 'hidden';
    $body.appendChild(div);
    
    var actualWidth = div.offsetWidth;
    var expectedWidth = parseInt(window.getComputedStyle($html).fontSize) * 10;
    
    if (actualWidth !== expectedWidth) {
        var ratio = actualWidth / expectedWidth;
        var currentFontSize = parseFloat(window.getComputedStyle($html).fontSize);
        $html.style.fontSize = (currentFontSize / ratio) + 'px';
    }
    
    $body.removeChild(div);
}
```

### 方案 B：布局优化
- **避免固定宽高**：使用 `min-height` 代替 `height`，允许容器随内容撑开。
- **弹性布局**：多使用 Flexbox 和 Grid。
- **关键元素使用 px**：对于绝对不能错位的 UI 元素（如导航栏高度），使用 `px` 而非 `rem`。

## 3. 关怀模式 (Care Mode) 特殊处理
微信关怀模式下，字体会变得非常大。建议：
- 增加行间距 (`line-height`)。
- 确保按钮点击区域足够大。
- 重要的文字信息不要放在背景图中，避免被截断。
