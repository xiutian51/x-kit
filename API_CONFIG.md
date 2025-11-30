# API 配置指南

## 📚 使用的库说明

### 1. twitter-openapi-typescript（主要库）

**性质：** 非官方库  
**GitHub：** https://github.com/fa0311/twitter-openapi-typescript  
**工作原理：** 模拟 Twitter/X 的内部 GraphQL API，通过 Cookie 认证访问

**特点：**
- ✅ 无需申请官方 API Key
- ✅ 功能丰富，支持大部分 Twitter 操作
- ✅ 免费使用
- ⚠️ 非官方支持，可能随时失效
- ⚠️ 需要从浏览器获取 Cookie Token
- ⚠️ Token 可能过期，需要定期更新

### 2. twitter-api-v2（辅助库）

**性质：** 官方 API 的 TypeScript 封装  
**用途：** 仅用于媒体上传功能（`post-tweet.ts`）

---

## 🔑 如何获取 AUTH_TOKEN

### 方法一：从浏览器开发者工具获取（推荐）

#### Chrome/Edge/Opera 浏览器：

1. **登录 X (Twitter)**
   - 打开 https://x.com 并登录你的账号

2. **打开开发者工具**
   - 按 `F12` 或 `Ctrl+Shift+I` (Windows/Linux)
   - 或 `Cmd+Option+I` (Mac)

3. **切换到 Application/存储 标签**
   - Chrome: 点击 "Application" 标签
   - Firefox: 点击 "存储" 标签

4. **查看 Cookies**
   - 左侧展开 "Cookies" → 选择 "https://x.com"
   - 或 "Cookies" → "https://twitter.com"

5. **找到 auth_token**
   - 在 Cookie 列表中查找名为 `auth_token` 的项
   - 复制其 **Value** 值（一长串字符）

6. **可选：获取 ct0 (CSRF Token)**
   - 同时查找 `ct0` Cookie 的值
   - 某些高级功能可能需要

#### Firefox 浏览器：

1. 登录 X (Twitter)
2. 按 `F12` 打开开发者工具
3. 点击 "存储" 标签
4. 展开 "Cookie" → "https://x.com"
5. 查找 `auth_token` 并复制值

#### Safari 浏览器：

1. 启用开发者菜单：Safari → 偏好设置 → 高级 → 勾选"显示开发菜单"
2. 登录 X (Twitter)
3. 开发 → 显示 Web 检查器
4. 存储 → Cookie → https://x.com
5. 查找 `auth_token` 并复制值

### 方法二：使用浏览器扩展（更简单）

推荐扩展：
- **EditThisCookie** (Chrome/Edge)
- **Cookie-Editor** (Chrome/Firefox)

安装后：
1. 登录 X (Twitter)
2. 点击扩展图标
3. 找到 `auth_token` 并复制值

### 方法三：使用控制台脚本

在 X (Twitter) 页面打开控制台（F12），运行：

```javascript
// 获取所有 Cookie
document.cookie.split(';').forEach(cookie => {
  const [name, value] = cookie.trim().split('=');
  if (name === 'auth_token' || name === 'ct0') {
    console.log(`${name}: ${value}`);
  }
});
```

---

## ⚙️ 配置环境变量

### 1. 创建 .env 文件

在项目根目录创建 `.env` 文件：

```bash
# 用于需要认证的操作（获取时间线、发布推文、关注用户等）
AUTH_TOKEN=你的auth_token值

# 用于访客模式操作（获取用户基本信息，无需登录账号）
GET_ID_X_TOKEN=你的auth_token值（可以与AUTH_TOKEN相同）
```

### 2. 环境变量说明

| 变量名 | 用途 | 必需性 |
|--------|------|--------|
| `AUTH_TOKEN` | 认证操作（获取时间线、发布推文、批量关注） | ✅ 必需 |
| `GET_ID_X_TOKEN` | 访客操作（获取用户信息） | ✅ 必需（可与AUTH_TOKEN相同） |

**注意：**
- 两个 Token 可以使用同一个值
- `GET_ID_X_TOKEN` 用于 `scripts/index.ts`（获取用户信息）
- `AUTH_TOKEN` 用于其他需要认证的脚本

### 3. 保护你的 Token

**重要安全提示：**

1. ✅ **不要提交到 Git**
   - `.env` 文件已在 `.gitignore` 中
   - 确保不会意外提交

2. ✅ **不要分享给他人**
   - Token 等同于你的账号密码
   - 泄露可能导致账号被盗用

3. ✅ **定期更新**
   - Token 可能会过期
   - 如果遇到认证错误，重新获取 Token

4. ✅ **使用不同账号**
   - 建议使用小号进行自动化操作
   - 避免主账号被封禁风险

---

## 🔍 验证配置

运行以下命令测试配置：

```bash
# 测试获取用户信息（使用 GET_ID_X_TOKEN）
bun run scripts/index.ts

# 测试获取时间线（使用 AUTH_TOKEN）
bun run scripts/fetch-tweets.ts
```

如果配置正确，应该能够成功获取数据。

---

## ❓ 常见问题

### Q1: Token 过期了怎么办？

**A:** 重新按照上述步骤获取新的 `auth_token`，更新 `.env` 文件。

### Q2: 为什么需要两个 Token？

**A:** 项目设计上区分了访客模式和认证模式，但实际上可以使用同一个 Token。

### Q3: 使用这个库会被封号吗？

**A:** 存在风险。建议：
- 使用小号
- 控制请求频率
- 遵守 Twitter 使用条款
- 不要进行大规模自动化操作

### Q4: 能否使用官方 API？

**A:** 可以，但需要：
- 申请 Twitter Developer 账号
- 创建 App 获取 API Key/Secret
- 修改代码使用官方 API（需要大量代码改动）

### Q5: Token 格式是什么样的？

**A:** `auth_token` 通常是一串 40-50 位的十六进制字符串，例如：
```
AUTH_TOKEN=abc123def4567890123456789012345678901234
```

---

## 📖 相关资源

- [twitter-openapi-typescript GitHub](https://github.com/fa0311/twitter-openapi-typescript)
- [Twitter API v2 官方文档](https://developer.twitter.com/en/docs/twitter-api)
- [项目 README](./README.md)

---

## ⚠️ 免责声明

本项目使用的 `twitter-openapi-typescript` 是非官方库，使用可能存在以下风险：

1. **账号风险：** 可能违反 Twitter 服务条款，导致账号被封
2. **API 变更：** Twitter 可能随时更改内部 API，导致库失效
3. **法律风险：** 请确保你的使用符合当地法律法规

**使用本工具即表示你已了解并接受这些风险。**

