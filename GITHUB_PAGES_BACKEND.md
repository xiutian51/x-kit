# 🌐 GitHub Pages 调用后端服务器指南

## 📚 基本概念

### GitHub Pages 的限制

GitHub Pages **只能托管静态文件**：
- ✅ HTML、CSS、JavaScript
- ✅ 图片、字体等静态资源
- ❌ **不能运行服务器端代码**（如 PHP、Python、Node.js）
- ❌ **不能直接连接数据库**

### 但是可以调用外部 API

虽然 GitHub Pages 本身不能运行后端，但**可以通过 JavaScript 调用外部 API**，包括：
- ✅ 自建的后端服务器
- ✅ 第三方 API 服务
- ✅ 云函数（如 Vercel Functions、Netlify Functions）

---

## ✅ 解决方案：通过 JavaScript 调用后端

### 方法 1：使用 Fetch API（推荐）

```javascript
// 在 Dashboard 的 HTML 中添加 JavaScript
async function fetchDataFromBackend() {
  try {
    const response = await fetch('https://your-backend-server.com/api/tweets', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 如果需要认证
        'Authorization': 'Bearer your-token'
      }
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    console.log('Data from backend:', data);
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// 调用函数
fetchDataFromBackend();
```

### 方法 2：使用 Axios

```javascript
// 在 HTML 中引入 Axios
<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>

<script>
axios.get('https://your-backend-server.com/api/tweets')
  .then(response => {
    console.log('Data:', response.data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
</script>
```

---

## 🔧 跨域问题（CORS）

### 问题说明

如果后端服务器和 GitHub Pages 不在同一个域名，会遇到**跨域问题**。

**示例：**
- GitHub Pages: `https://xiutian51.github.io`
- 后端服务器: `https://api.example.com`

浏览器会阻止这种跨域请求。

### 解决方案

#### 方案 1：后端服务器配置 CORS（推荐）

在后端服务器添加 CORS 头：

**Node.js/Express 示例：**
```javascript
const express = require('express');
const app = express();

// 允许 GitHub Pages 域名访问
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://xiutian51.github.io');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.get('/api/tweets', (req, res) => {
  res.json({ data: 'your data' });
});
```

**Python/Flask 示例：**
```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=['https://xiutian51.github.io'])

@app.route('/api/tweets')
def get_tweets():
    return {'data': 'your data'}
```

#### 方案 2：使用代理服务器

通过代理服务器转发请求，避免跨域问题。

**示例：**
```javascript
// 使用 CORS 代理
const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
const targetUrl = 'https://your-backend-server.com/api/tweets';

fetch(proxyUrl + targetUrl)
  .then(response => response.json())
  .then(data => console.log(data));
```

**注意：** 生产环境建议使用自己的代理服务器。

---

## 🎯 实际应用场景

### 场景 1：实时数据更新

GitHub Pages 显示静态数据，通过 API 获取最新数据：

```javascript
// 页面加载时获取最新数据
window.addEventListener('DOMContentLoaded', async () => {
  const latestTweets = await fetch('https://your-api.com/api/latest-tweets');
  const data = await latestTweets.json();
  
  // 更新页面内容
  updateDashboard(data);
});
```

### 场景 2：用户交互功能

添加搜索、筛选等功能：

```javascript
async function searchTweets(keyword) {
  const response = await fetch(`https://your-api.com/api/search?q=${keyword}`);
  const results = await response.json();
  displayResults(results);
}
```

### 场景 3：数据提交

提交表单数据到后端：

```javascript
async function submitForm(formData) {
  const response = await fetch('https://your-api.com/api/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData)
  });
  
  const result = await response.json();
  return result;
}
```

---

## 💡 针对你的项目的建议

### 当前方案（推荐）

**使用静态 JSON 文件：**
- ✅ 简单直接，无需后端服务器
- ✅ 数据通过 GitHub Actions 自动更新
- ✅ 无需处理跨域问题
- ✅ 免费且稳定

**工作流程：**
```
GitHub Actions → 获取推文 → 保存为 JSON → GitHub Pages 读取 JSON
```

### 如果需要实时数据

**方案 1：添加 API 调用（混合方案）**

修改 `generate-dashboard.ts`，添加实时数据获取：

```typescript
// 在生成 Dashboard 时，同时调用 API 获取最新数据
async function generateDashboard() {
  // 读取本地 JSON 文件
  const localTweets = await readLocalTweets();
  
  // 调用后端 API 获取最新数据
  try {
    const latestTweets = await fetch('https://your-api.com/api/latest');
    const apiData = await latestTweets.json();
    
    // 合并数据
    const allTweets = [...localTweets, ...apiData];
    
    // 生成 Dashboard
    generateHTML(allTweets);
  } catch (error) {
    // 如果 API 失败，只使用本地数据
    generateHTML(localTweets);
  }
}
```

**方案 2：纯前端调用 API**

在 Dashboard HTML 中添加 JavaScript：

```javascript
// 页面加载后，调用 API 获取最新数据
async function loadLatestData() {
  try {
    const response = await fetch('https://your-api.com/api/tweets');
    const data = await response.json();
    
    // 更新页面显示
    updateStats(data);
    updateChart(data);
  } catch (error) {
    console.error('Failed to load latest data:', error);
    // 使用静态数据作为后备
  }
}

// 页面加载时调用
window.addEventListener('load', loadLatestData);
```

---

## 🔐 安全考虑

### 1. API 密钥保护

**❌ 不要在前端代码中硬编码 API 密钥：**
```javascript
// 危险！
const apiKey = 'your-secret-key';
```

**✅ 使用环境变量或后端代理：**
```javascript
// 通过后端代理，密钥保存在服务器端
fetch('/api/proxy/tweets')  // 后端处理认证
```

### 2. 认证方式

**方案 1：使用 Token（简单）**
```javascript
fetch('https://your-api.com/api/data', {
  headers: {
    'Authorization': 'Bearer your-token'
  }
});
```

**方案 2：使用 Cookie（需要 CORS 支持）**
```javascript
fetch('https://your-api.com/api/data', {
  credentials: 'include'  // 发送 Cookie
});
```

---

## 📊 架构对比

### 方案 A：纯静态（当前方案）

```
GitHub Pages (静态 HTML)
  ↓ 读取
本地 JSON 文件 (tweets/*.json)
  ↑ 更新
GitHub Actions (每小时)
```

**优点：**
- ✅ 简单、免费、稳定
- ✅ 无需后端服务器
- ✅ 数据更新有延迟（1小时）

### 方案 B：静态 + API（混合方案）

```
GitHub Pages (静态 HTML + JavaScript)
  ↓ 读取本地 JSON
  ↓ 调用 API 获取最新数据
本地 JSON + 后端 API
  ↑ 更新
GitHub Actions + 后端服务器
```

**优点：**
- ✅ 可以显示实时数据
- ✅ 保留静态数据作为后备
- ⚠️ 需要后端服务器和 CORS 配置

### 方案 C：纯 API（完全动态）

```
GitHub Pages (静态 HTML + JavaScript)
  ↓ 只调用 API
后端 API 服务器
```

**优点：**
- ✅ 完全实时
- ⚠️ 需要后端服务器
- ⚠️ 如果 API 失败，页面无法显示数据

---

## 🛠️ 实施步骤（如果需要添加后端支持）

### 步骤 1：创建后端 API

创建简单的 API 服务器（示例使用 Node.js）：

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: 'https://xiutian51.github.io'
}));

app.get('/api/tweets', async (req, res) => {
  // 读取 tweets 数据或从数据库获取
  const tweets = await getTweets();
  res.json(tweets);
});

app.listen(3000, () => {
  console.log('API server running on port 3000');
});
```

### 步骤 2：修改 Dashboard 生成脚本

在 `generate-dashboard.ts` 中添加 API 调用：

```typescript
// 添加 API 调用函数
async function fetchFromAPI() {
  try {
    const response = await fetch('https://your-api.com/api/tweets');
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    return [];
  }
}
```

### 步骤 3：在 HTML 中添加 JavaScript

在生成的 HTML 中添加实时数据获取：

```html
<script>
async function loadRealTimeData() {
  const response = await fetch('https://your-api.com/api/latest');
  const data = await response.json();
  // 更新页面
}
</script>
```

---

## 📚 相关资源

- [Fetch API 文档](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [CORS 说明](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [GitHub Pages 限制](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages)

---

## ✅ 总结

**GitHub Pages 可以调用后端服务器，但需要：**

1. ✅ 通过 JavaScript 的 Fetch/Axios 调用
2. ✅ 后端服务器配置 CORS（如果跨域）
3. ✅ 处理错误情况（API 失败时的后备方案）

**对于你的项目：**
- 当前方案（静态 JSON）已经很好
- 如果需要实时数据，可以添加 API 调用
- 建议使用混合方案（静态 + API）

---

**需要我帮你实现后端 API 调用功能吗？** 🚀

