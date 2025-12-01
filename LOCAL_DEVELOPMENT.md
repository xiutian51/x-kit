# 🛠️ 本地开发 Dashboard 指南

## 🎯 目标

在本地生成和调试 Dashboard HTML 文件，完善后再发布到 GitHub Pages。

---

## 🚀 快速开始

### 步骤 1：生成 Dashboard HTML

```bash
# 在项目根目录运行
bun run scripts/generate-dashboard.ts
```

**输出：**
- 生成 `dashboard/index.html` 文件
- 控制台显示统计信息

### 步骤 2：本地预览

#### 方法 1：使用 Python（推荐）

```bash
cd dashboard
python3 -m http.server 8000
```

然后访问：`http://localhost:8000`

#### 方法 2：使用 Bun

```bash
bunx serve dashboard
```

#### 方法 3：使用 VS Code Live Server

1. 安装 `Live Server` 扩展
2. 右键 `dashboard/index.html`
3. 选择 `Open with Live Server`

#### 方法 4：直接在浏览器打开

```bash
# macOS
open dashboard/index.html

# Linux
xdg-open dashboard/index.html

# Windows
start dashboard/index.html
```

**注意：** 直接打开可能无法加载外部资源（如图片），建议使用本地服务器。

---

## 🔄 开发工作流

### 1. 修改代码

编辑 `scripts/generate-dashboard.ts`：
- 修改样式（CSS）
- 添加新功能
- 调整布局

### 2. 重新生成

```bash
bun run scripts/generate-dashboard.ts
```

### 3. 刷新浏览器

在浏览器中刷新页面查看效果。

### 4. 重复步骤 1-3

直到满意为止。

### 5. 提交并推送

```bash
git add scripts/generate-dashboard.ts dashboard/index.html
git commit -m "feat: improve dashboard visualization"
git push origin main
```

---

## 📁 文件结构

```
x-kit/
├── scripts/
│   └── generate-dashboard.ts  # Dashboard 生成脚本
├── dashboard/
│   └── index.html             # 生成的 HTML 文件（自动生成）
└── tweets/
    └── *.json                 # 推文数据源
```

---

## 🎨 自定义 Dashboard

### 修改样式

编辑 `scripts/generate-dashboard.ts` 中的 CSS 部分：

```typescript
// 修改主色调
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
// 改为你喜欢的颜色
background: linear-gradient(135deg, #你的颜色1 0%, #你的颜色2 100%);
```

### 添加新功能

在 HTML 模板中添加新的 HTML/CSS/JavaScript：

```typescript
const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        /* 你的 CSS */
      </style>
    </head>
    <body>
      <!-- 你的 HTML -->
      <script>
        // 你的 JavaScript
      </script>
    </body>
  </html>
`;
```

---

## 🔍 调试技巧

### 1. 查看控制台

在浏览器中按 `F12` 打开开发者工具：
- **Console**：查看 JavaScript 错误
- **Network**：查看资源加载情况
- **Elements**：检查 HTML 结构

### 2. 检查数据

在生成脚本中添加日志：

```typescript
console.log('总推文数:', totalTweets);
console.log('用户数量:', uniqueUsers);
console.log('日期统计:', Array.from(dateStats.entries()));
```

### 3. 测试不同数据量

```typescript
// 只使用部分数据进行测试
const testTweets = allTweets.slice(0, 100);
```

---

## 📊 增强功能建议

### 1. 添加搜索功能

```javascript
function searchUsers(keyword) {
  const filtered = userStats.filter(user => 
    user.name.includes(keyword) || user.screenName.includes(keyword)
  );
  displayUsers(filtered);
}
```

### 2. 添加筛选功能

```javascript
function filterByDate(startDate, endDate) {
  // 筛选指定日期范围的推文
}
```

### 3. 添加排序功能

```javascript
function sortUsers(sortBy) {
  // 按推文数、粉丝数等排序
}
```

### 4. 添加图表库

使用 Chart.js 或 ECharts 替换简单的柱状图：

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
  const ctx = document.getElementById('myChart');
  new Chart(ctx, {
    type: 'bar',
    data: { /* ... */ }
  });
</script>
```

### 5. 添加数据导出

```javascript
function exportToCSV() {
  // 导出为 CSV 文件
}

function exportToJSON() {
  // 导出为 JSON 文件
}
```

---

## 🐛 常见问题

### Q1: 图片无法显示

**原因：** 直接打开 HTML 文件，浏览器阻止加载外部图片。

**解决：** 使用本地服务器（Python/Bun/Live Server）。

### Q2: 样式不生效

**检查：**
1. CSS 语法是否正确
2. 浏览器缓存（按 `Ctrl+Shift+R` 强制刷新）
3. 选择器是否正确

### Q3: 数据不显示

**检查：**
1. `tweets/` 目录是否有 JSON 文件
2. JSON 文件格式是否正确
3. 控制台是否有错误信息

---

## 📚 参考资源

- [MDN Web Docs](https://developer.mozilla.org/)
- [Chart.js 文档](https://www.chartjs.org/)
- [ECharts 文档](https://echarts.apache.org/)

---

## ✅ 开发检查清单

- [ ] 本地可以生成 HTML 文件
- [ ] 本地预览正常显示
- [ ] 样式符合预期
- [ ] 功能正常工作
- [ ] 响应式设计（移动端适配）
- [ ] 浏览器兼容性测试
- [ ] 代码已提交并推送

---

**开始本地开发吧！** 🚀

