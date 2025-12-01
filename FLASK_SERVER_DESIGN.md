# 🐍 Flask 服务器方案设计

## 📋 需求分析

### 当前流程
```
GitHub Actions (hourly-update.yml)
  ↓
执行 fetch-tweets.ts
  ↓
生成 tweets/YYYY-MM-DD.json
  ↓
提交到 GitHub 仓库
```

### 目标流程
```
GitHub Actions (hourly-update.yml)
  ↓
执行 fetch-tweets.ts
  ↓
生成 tweets/YYYY-MM-DD.json
  ↓
发送到 Flask 服务器
  ↓
Flask 解析 JSON
  ↓
存储到 SQLite 数据库
```

---

## 🎯 方案对比

### 方案一：GitHub Actions 直接调用 Flask API（推荐）⭐

**工作流程：**
```
hourly-update.yml
  ↓
生成 JSON 文件后
  ↓
读取 JSON 内容
  ↓
HTTP POST 到 Flask API
  ↓
Flask 接收并存储
```

**优点：**
- ✅ 实时性好，立即同步
- ✅ 实现简单，直接 HTTP 调用
- ✅ 可控性强，GitHub Actions 控制发送时机
- ✅ 错误处理方便，可以重试

**缺点：**
- ⚠️ 需要 Flask 服务器可访问（公网或内网）
- ⚠️ 需要配置 API 认证
- ⚠️ 如果服务器不可用，数据会丢失（需要重试机制）

**适用场景：**
- Flask 服务器部署在公网或可访问的内网
- 需要实时数据同步
- 有稳定的网络连接

---

### 方案二：GitHub Webhook 触发 Flask

**工作流程：**
```
GitHub Actions 提交代码
  ↓
GitHub 触发 Webhook
  ↓
Flask 接收 Webhook
  ↓
Flask 从 GitHub API 获取最新文件
  ↓
解析并存储
```

**优点：**
- ✅ 解耦，GitHub Actions 不需要知道 Flask 地址
- ✅ 使用 GitHub 官方 Webhook 机制
- ✅ 可以监听多个事件（push、commit 等）

**缺点：**
- ⚠️ 需要配置 GitHub Webhook
- ⚠️ Flask 需要从 GitHub API 获取文件（需要 Token）
- ⚠️ 实现相对复杂
- ⚠️ 依赖 GitHub API 可用性

**适用场景：**
- 需要解耦 GitHub Actions 和 Flask
- 服务器在私有网络，GitHub Actions 无法直接访问
- 需要监听多个 GitHub 事件

---

### 方案三：Flask 定期轮询 GitHub API

**工作流程：**
```
Flask 定时任务（每10分钟）
  ↓
调用 GitHub API 获取最新 commit
  ↓
检查是否有新的 JSON 文件
  ↓
下载 JSON 文件
  ↓
解析并存储
```

**优点：**
- ✅ GitHub Actions 无需修改
- ✅ Flask 完全自主控制
- ✅ 可以处理历史数据

**缺点：**
- ⚠️ 有延迟（轮询间隔）
- ⚠️ 需要 GitHub API Token
- ⚠️ 可能重复处理数据（需要去重）
- ⚠️ 增加 GitHub API 调用次数

**适用场景：**
- Flask 服务器无法接收外部请求
- 需要处理历史数据
- 不要求实时性

---

### 方案四：混合方案（推荐用于生产环境）⭐⭐

**工作流程：**
```
GitHub Actions
  ↓
生成 JSON → 提交到 GitHub
  ↓
同时发送到 Flask API（主要）
  ↓
如果失败，Flask 通过轮询补充（备用）
```

**优点：**
- ✅ 实时性好（主要方式）
- ✅ 可靠性高（有备用方案）
- ✅ 可以处理遗漏的数据

**缺点：**
- ⚠️ 实现相对复杂
- ⚠️ 需要两套机制

**适用场景：**
- 生产环境，要求高可靠性
- 需要保证数据不丢失

---

## 📊 推荐方案：方案一（直接 API 调用）

### 架构设计

```
┌─────────────────┐
│ GitHub Actions  │
│ (hourly-update) │
└────────┬────────┘
         │
         │ 1. 生成 JSON 文件
         ↓
    ┌─────────┐
    │ JSON    │
    │ 文件    │
    └────┬────┘
         │
         │ 2. 读取 JSON 内容
         ↓
    ┌─────────┐
    │ HTTP    │
    │ POST    │
    └────┬────┘
         │
         │ 3. 发送到 Flask
         ↓
┌─────────────────┐
│  Flask Server   │
│  (Python)       │
└────────┬────────┘
         │
         │ 4. 解析 JSON
         ↓
    ┌─────────┐
    │ SQLite  │
    │ Database│
    └─────────┘
```

---

## 🗄️ 数据库设计

### 表结构设计

#### 1. `tweets` 表（推文主表）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| `id` | INTEGER | 主键，自增 | PRIMARY KEY |
| `tweet_id` | TEXT | 推文ID（从URL提取） | UNIQUE, NOT NULL |
| `tweet_url` | TEXT | 推文完整URL | UNIQUE, NOT NULL |
| `full_text` | TEXT | 推文内容 | NOT NULL |
| `created_at` | DATETIME | 推文创建时间 | |
| `collected_at` | DATETIME | 采集时间 | NOT NULL |
| `date` | DATE | 推文日期（YYYY-MM-DD） | INDEX |
| `has_images` | BOOLEAN | 是否包含图片 | DEFAULT 0 |
| `has_videos` | BOOLEAN | 是否包含视频 | DEFAULT 0 |
| `image_count` | INTEGER | 图片数量 | DEFAULT 0 |
| `video_count` | INTEGER | 视频数量 | DEFAULT 0 |

#### 2. `users` 表（用户表）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| `id` | INTEGER | 主键，自增 | PRIMARY KEY |
| `screen_name` | TEXT | 用户名（唯一标识） | UNIQUE, NOT NULL |
| `name` | TEXT | 显示名称 | |
| `profile_image_url` | TEXT | 头像URL | |
| `description` | TEXT | 用户描述 | |
| `followers_count` | INTEGER | 粉丝数 | DEFAULT 0 |
| `friends_count` | INTEGER | 关注数 | DEFAULT 0 |
| `location` | TEXT | 位置 | |
| `first_seen_at` | DATETIME | 首次出现时间 | |
| `last_updated_at` | DATETIME | 最后更新时间 | |

#### 3. `tweet_images` 表（推文图片）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| `id` | INTEGER | 主键，自增 | PRIMARY KEY |
| `tweet_id` | INTEGER | 推文ID（外键） | FOREIGN KEY |
| `image_url` | TEXT | 图片URL | NOT NULL |
| `image_index` | INTEGER | 图片索引（第几张） | |

#### 4. `tweet_videos` 表（推文视频）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| `id` | INTEGER | 主键，自增 | PRIMARY KEY |
| `tweet_id` | INTEGER | 推文ID（外键） | FOREIGN KEY |
| `video_url` | TEXT | 视频URL | NOT NULL |
| `video_index` | INTEGER | 视频索引（第几个） | |

#### 5. `collection_logs` 表（采集日志）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| `id` | INTEGER | 主键，自增 | PRIMARY KEY |
| `collection_date` | DATE | 采集日期 | NOT NULL |
| `source_file` | TEXT | 源文件名 | |
| `tweet_count` | INTEGER | 推文数量 | |
| `new_tweets` | INTEGER | 新增推文数 | |
| `duplicate_tweets` | INTEGER | 重复推文数 | |
| `status` | TEXT | 状态（success/failed） | |
| `error_message` | TEXT | 错误信息 | |
| `created_at` | DATETIME | 创建时间 | NOT NULL |

---

## 🔐 API 设计

### 端点设计

#### POST `/api/tweets/upload`

**功能：** 接收推文 JSON 数据并存储

**请求格式：**
```json
{
  "date": "2025-12-01",
  "source_file": "2025-12-01.json",
  "tweets": [
    {
      "user": {
        "screenName": "username",
        "name": "User Name",
        ...
      },
      "tweetUrl": "https://x.com/...",
      "fullText": "...",
      "images": [...],
      "videos": [...]
    }
  ]
}
```

**响应格式：**
```json
{
  "success": true,
  "message": "数据存储成功",
  "data": {
    "total": 100,
    "new": 50,
    "duplicates": 50
  }
}
```

**认证：**
- API Key 认证（Header: `X-API-Key`）
- 或 Token 认证（Header: `Authorization: Bearer <token>`）

---

## 🔄 数据流设计

### 1. 数据接收流程

```
Flask 接收 POST 请求
  ↓
验证 API Key
  ↓
解析 JSON 数据
  ↓
验证数据格式
  ↓
开始数据库事务
  ↓
处理每条推文：
  - 检查推文是否已存在（通过 tweet_url）
  - 如果不存在：
    - 插入 users 表（如果用户不存在）
    - 插入 tweets 表
    - 插入 tweet_images 表
    - 插入 tweet_videos 表
  - 如果存在：跳过（去重）
  ↓
提交事务
  ↓
记录采集日志
  ↓
返回响应
```

### 2. 去重策略

**主键：** `tweet_url`（唯一标识推文）

**逻辑：**
```python
# 伪代码
for tweet in tweets:
    if tweet_url_exists(tweet.tweetUrl):
        duplicate_count += 1
        continue
    else:
        insert_tweet(tweet)
        new_count += 1
```

---

## 🛡️ 安全设计

### 1. API 认证

**方案 A：API Key（简单）**
- Header: `X-API-Key: your-api-key`
- 适合单客户端场景

**方案 B：Token 认证（推荐）**
- Header: `Authorization: Bearer <token>`
- 支持过期和刷新
- 适合多客户端场景

### 2. 数据验证

- ✅ 验证 JSON 格式
- ✅ 验证必需字段
- ✅ 验证数据长度限制
- ✅ 防止 SQL 注入（使用参数化查询）

### 3. 错误处理

- ✅ 捕获异常并记录日志
- ✅ 返回友好的错误信息
- ✅ 数据库事务回滚

---

## 📝 GitHub Actions 集成点

### 修改点 1：在 `hourly-update.yml` 中添加发送步骤

**位置：** 在 "Fetch latest tweets" 步骤之后

**新增步骤：**
```yaml
- name: Send to Flask Server
  env:
    FLASK_API_URL: ${{ secrets.FLASK_API_URL }}
    FLASK_API_KEY: ${{ secrets.FLASK_API_KEY }}
  run: |
    # 读取最新生成的 JSON 文件
    # 发送到 Flask API
```

### 修改点 2：创建发送脚本

**文件：** `scripts/send-to-server.ts`

**功能：**
- 读取最新生成的 JSON 文件
- 构造请求数据
- 发送 HTTP POST 请求
- 处理响应和错误

---

## 🔧 技术选型

### Flask 服务器

**依赖：**
- `flask` - Web 框架
- `sqlite3` - 数据库（Python 内置）
- `requests` - HTTP 客户端（如果需要调用外部 API）

**可选：**
- `flask-cors` - 处理跨域
- `flask-limiter` - 限流
- `python-dotenv` - 环境变量管理

### 数据库

**SQLite 优势：**
- ✅ 无需单独服务器
- ✅ 文件数据库，易于备份
- ✅ 适合中小规模数据
- ✅ Python 内置支持

**SQLite 限制：**
- ⚠️ 并发写入性能有限
- ⚠️ 不适合大规模数据（百万级以上）

---

## 📊 性能考虑

### 1. 批量插入

**策略：**
- 使用事务批量插入
- 避免逐条插入（性能差）

**示例：**
```python
# 好的做法
BEGIN TRANSACTION
INSERT INTO tweets VALUES (...), (...), (...)
COMMIT

# 不好的做法
INSERT INTO tweets VALUES (...)
INSERT INTO tweets VALUES (...)
INSERT INTO tweets VALUES (...)
```

### 2. 索引设计

**必需索引：**
- `tweets.tweet_url` - 用于去重查询
- `tweets.date` - 用于日期查询
- `users.screen_name` - 用于用户查询

### 3. 连接池

- SQLite 不需要连接池（单文件）
- 但要注意并发访问限制

---

## 🚀 部署方案

### 方案 A：本地部署

**场景：** Flask 运行在本地服务器

**配置：**
- Flask 监听内网 IP 或 localhost
- GitHub Actions 通过内网访问（如果可能）
- 或使用内网穿透（ngrok、frp）

### 方案 B：云服务器部署

**场景：** Flask 部署在云服务器（阿里云、腾讯云等）

**配置：**
- Flask 监听公网 IP
- 配置防火墙规则
- 使用 HTTPS（推荐）

### 方案 C：容器化部署

**场景：** 使用 Docker 部署

**优势：**
- ✅ 环境一致
- ✅ 易于部署
- ✅ 易于扩展

---

## 📋 实施步骤

### 阶段一：基础功能

1. ✅ 设计数据库表结构
2. ✅ 创建 Flask 应用框架
3. ✅ 实现 API 端点
4. ✅ 实现数据存储逻辑

### 阶段二：GitHub Actions 集成

1. ✅ 创建发送脚本
2. ✅ 修改 workflow 文件
3. ✅ 配置 Secrets
4. ✅ 测试端到端流程

### 阶段三：优化和监控

1. ✅ 添加错误处理和重试
2. ✅ 添加日志记录
3. ✅ 添加监控和告警
4. ✅ 性能优化

---

## ⚠️ 注意事项

### 1. 数据去重

- 使用 `tweet_url` 作为唯一标识
- 避免重复存储相同推文

### 2. 错误处理

- GitHub Actions 发送失败时的处理
- Flask 服务器宕机时的处理
- 数据格式错误的处理

### 3. 数据一致性

- 使用数据库事务
- 确保用户信息和推文信息一致

### 4. 性能优化

- 批量插入数据
- 合理使用索引
- 定期清理旧数据（可选）

---

## 🎯 推荐实施路径

### 第一步：MVP（最小可行产品）

1. **创建 Flask 服务器**
   - 简单的 POST 接口
   - 基本的数据库存储
   - 简单的认证

2. **修改 GitHub Actions**
   - 添加发送步骤
   - 使用 curl 或脚本发送

3. **测试**
   - 本地测试
   - 端到端测试

### 第二步：完善功能

1. **增强错误处理**
2. **添加日志**
3. **优化性能**

### 第三步：生产优化

1. **添加监控**
2. **添加告警**
3. **性能调优**

---

## 📚 相关文档

- [Flask 官方文档](https://flask.palletsprojects.com/)
- [SQLite 文档](https://www.sqlite.org/docs.html)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

---

## ✅ 方案总结

**推荐方案：** 方案一（GitHub Actions 直接调用 Flask API）

**原因：**
- ✅ 实现简单直接
- ✅ 实时性好
- ✅ 可控性强
- ✅ 易于调试

**关键点：**
1. Flask API 需要可访问（公网或内网）
2. 需要配置 API 认证
3. 需要处理错误和重试
4. 数据库设计要合理

---

**准备好开始实施了吗？** 🚀

