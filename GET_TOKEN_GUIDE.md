# 🔑 快速获取 auth_token 指南

## 方法一：浏览器开发者工具（最简单）

### Chrome/Edge 浏览器：

1. **打开 X (Twitter)**
   - 访问 https://x.com 并登录

2. **打开开发者工具**
   - 按 `F12` 键
   - 或右键页面 → "检查"

3. **查看 Cookie**
   - 点击顶部标签 "Application"（应用程序）
   - 左侧找到 "Cookies" → 展开 → 点击 "https://x.com"

4. **找到 auth_token**
   - 在右侧表格中找到名为 `auth_token` 的行
   - 复制 "Value" 列中的值（一长串字符，不是 Bearer 开头的）

### Firefox 浏览器：

1. 打开 https://x.com 并登录
2. 按 `F12` 打开开发者工具
3. 点击 "存储" 标签
4. 展开 "Cookie" → "https://x.com"
5. 找到 `auth_token` 并复制值

## 方法二：使用控制台脚本（最快）

1. **登录 X (Twitter)**
   - 访问 https://x.com 并登录

2. **打开控制台**
   - 按 `F12` → 切换到 "Console"（控制台）标签

3. **运行以下代码：**

```javascript
// 方法1：直接获取 auth_token
const authToken = document.cookie
  .split(';')
  .find(cookie => cookie.trim().startsWith('auth_token='))
  ?.split('=')[1];

console.log('你的 auth_token 是:');
console.log(authToken);

// 方法2：获取所有相关 Cookie
console.log('\n所有相关 Cookie:');
document.cookie.split(';').forEach(cookie => {
  const [name, value] = cookie.trim().split('=');
  if (name === 'auth_token' || name === 'ct0') {
    console.log(`${name}: ${value}`);
  }
});
```

4. **复制输出的值**
   - 控制台会显示你的 `auth_token`
   - 复制这个值（不包含 `auth_token=` 前缀）

## 方法三：使用浏览器扩展

### 安装 Cookie-Editor 扩展：

1. **Chrome/Edge：**
   - 访问：https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm
   - 点击"添加至 Chrome"

2. **Firefox：**
   - 访问：https://addons.mozilla.org/zh-CN/firefox/addon/cookie-editor/
   - 点击"添加到 Firefox"

3. **使用步骤：**
   - 登录 https://x.com
   - 点击扩展图标
   - 找到 `auth_token` Cookie
   - 点击复制图标复制值

## ✅ 正确的 Token 格式示例

**✅ 正确格式（Cookie 值）：**
```
abc123def4567890123456789012345678901234
```
或
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
```

**❌ 错误格式（Bearer Token）：**
```
Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA
```

## 📝 配置到 .env 文件

获取到正确的 `auth_token` 后，在项目根目录创建 `.env` 文件：

```bash
# 将你复制的 auth_token 值粘贴到这里（不要包含 Bearer 前缀）
AUTH_TOKEN=你的auth_token值

# 可以与 AUTH_TOKEN 使用相同的值
GET_ID_X_TOKEN=你的auth_token值
```

**示例：**
```bash
AUTH_TOKEN=abc123def4567890123456789012345678901234
GET_ID_X_TOKEN=abc123def4567890123456789012345678901234
```

## 🧪 测试配置

运行以下命令验证配置是否正确：

```bash
# 测试获取用户信息
bun run scripts/index.ts

# 如果成功，会看到类似输出：
# appinn saved
# ruanyf saved
```

## ⚠️ 注意事项

1. **Token 格式：** 必须是纯字符串，不包含 `Bearer` 前缀
2. **Token 长度：** 通常是 40-50 位字符
3. **Token 安全：** 不要分享给他人，等同于你的账号密码
4. **Token 过期：** 如果遇到认证错误，重新获取 Token

## 🔍 如何区分 Bearer Token 和 auth_token

| 特征 | Bearer Token | auth_token Cookie |
|------|-------------|-------------------|
| 格式 | `Bearer AAAAA...` | `abc123def456...` |
| 长度 | 通常很长（100+字符） | 40-50 字符 |
| 用途 | 官方 API v2 | 浏览器 Cookie |
| 获取位置 | Twitter Developer Portal | 浏览器 Cookie |
| 本项目 | ❌ 不使用 | ✅ 使用 |

