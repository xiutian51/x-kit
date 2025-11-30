# 🚀 快速启动指南

## 前置要求

1. **安装 Bun 运行时**
   - 访问：https://bun.sh
   - 或运行：`curl -fsSL https://bun.sh/install | bash`
   - 验证安装：`bun --version`

## 启动步骤

### 步骤 1: 安装依赖

```bash
cd /Users/mac/Desktop/code/sei/x-kit
bun install
```

### 步骤 2: 配置环境变量

从你提供的 Cookie 字符串中提取 `auth_token`：

```
auth_token=c6458d4841dc6d8289651c3b6e6b9c26d904b062
```

在项目根目录创建 `.env` 文件：

```bash
# 创建 .env 文件
touch .env
```

编辑 `.env` 文件，添加以下内容：

```bash
AUTH_TOKEN=c6458d4841dc6d8289651c3b6e6b9c26d904b062
GET_ID_X_TOKEN=c6458d4841dc6d8289651c3b6e6b9c26d904b062
```

**注意：** 两个 Token 可以使用相同的值。

### 步骤 3: 运行脚本

项目提供了多个功能脚本，你可以根据需要运行：

#### 📋 获取用户信息（首次运行推荐）

```bash
bun run scripts/index.ts
```

**功能：** 从 `dev-accounts.json` 读取用户列表，获取用户详细信息并保存到 `accounts/` 目录

**输出：** 控制台会显示处理进度，例如：
```
appinn already exists
ruanyf saved
yihong0618 saved
```

#### 📰 获取最新推文

```bash
bun run scripts/fetch-tweets.ts
```

**功能：** 获取首页时间线的最新原创推文（最近1天内），保存到 `tweets/YYYY-MM-DD.json`

**输出：** 推文数据会保存到 `tweets/` 目录，按日期命名

#### 👤 获取指定用户的推文

```bash
bun run scripts/fetch-user-tweets.ts
```

**功能：** 获取指定用户的所有推文（代码中硬编码了用户ID `16044147`）

**注意：** 需要修改脚本中的 `userId` 来指定要获取的用户

#### ➕ 批量关注用户

```bash
bun run scripts/batch-follow.ts
```

**功能：** 批量关注 `accounts/` 目录中的所有用户

**注意：** 每次操作间隔 10 秒，避免触发限流

#### 🐦 发布推文

```bash
bun run scripts/post-tweet.ts
```

**功能：** 生成图片卡片并发布推文

**注意：** 需要确保 `AUTH_TOKEN` 有效且有发布权限

---

## 📝 验证配置

运行以下命令测试配置是否正确：

```bash
# 测试获取用户信息（使用 GET_ID_X_TOKEN）
bun run scripts/index.ts
```

如果看到类似以下输出，说明配置成功：

```
🚀 ~ const_xClient= ~ TOKEN: c6458d4841dc6d8289651c3b6e6b9c26d904b062
🚀 ~ cookieObj ~ cookieObj: {
  "ct0": "...",
  "kdt": "...",
  ...
}
appinn already exists
ruanyf saved
```

如果出现错误，请检查：
1. `.env` 文件是否存在
2. `AUTH_TOKEN` 值是否正确（不包含 `Bearer` 前缀）
3. Token 是否过期（需要重新获取）

---

## 🔧 常见问题

### Q1: 提示 "AUTH_TOKEN is not defined"

**解决方案：**
- 确保 `.env` 文件在项目根目录
- 检查 `.env` 文件格式是否正确（没有多余空格）
- 重启终端

### Q2: 提示认证失败

**解决方案：**
- Token 可能已过期，重新获取 `auth_token`
- 确保 Token 值正确（40-50 位字符，不包含 `Bearer` 前缀）

### Q3: Bun 命令不存在

**解决方案：**
```bash
# 安装 Bun
curl -fsSL https://bun.sh/install | bash

# 或使用 npm 安装
npm install -g bun
```

### Q4: 依赖安装失败

**解决方案：**
```bash
# 清理并重新安装
rm -rf node_modules bun.lockb
bun install
```

---

## 📂 项目结构说明

```
x-kit/
├── .env                    # 环境变量配置（需要创建）
├── dev-accounts.json       # 用户配置列表
├── accounts/               # 用户数据存储目录
│   └── {username}.json    # 每个用户的详细信息
├── tweets/                 # 推文数据存储目录
│   └── YYYY-MM-DD.json    # 按日期存储的推文
└── scripts/                # 功能脚本目录
    ├── index.ts           # 获取用户信息
    ├── fetch-tweets.ts    # 获取时间线推文
    ├── fetch-user-tweets.ts # 获取指定用户推文
    ├── batch-follow.ts    # 批量关注
    └── post-tweet.ts      # 发布推文
```

---

## 🎯 推荐使用流程

1. **首次使用：**
   ```bash
   # 1. 安装依赖
   bun install
   
   # 2. 配置 .env 文件
   # 3. 获取用户信息
   bun run scripts/index.ts
   ```

2. **日常使用：**
   ```bash
   # 获取最新推文
   bun run scripts/fetch-tweets.ts
   ```

3. **定期更新：**
   ```bash
   # 更新用户信息（如果 dev-accounts.json 有新增用户）
   bun run scripts/index.ts
   ```

---

## ⚠️ 注意事项

1. **Token 安全：** 不要将 `.env` 文件提交到 Git（已在 `.gitignore` 中）
2. **请求频率：** 避免频繁运行脚本，可能触发限流
3. **账号安全：** 建议使用小号进行自动化操作
4. **数据备份：** `accounts/` 和 `tweets/` 目录的数据建议定期备份

---

## 📚 更多信息

- [API 配置指南](./API_CONFIG.md)
- [Token 获取指南](./GET_TOKEN_GUIDE.md)
- [项目 README](./README.md)

