# 🚀 完整部署指南总结

## 📋 快速开始清单

### ✅ 第一步：配置 GitHub Secrets

1. 进入 GitHub 仓库 → `Settings` → `Secrets and variables` → `Actions`
2. 添加以下 Secrets：

```
AUTH_TOKEN = c6458d4841dc6d8289651c3b6e6b9c26d904b062
GET_ID_X_TOKEN = c6458d4841dc6d8289651c3b6e6b9c26d904b062
GH_TOKEN = ghp_你的GitHub_Token
```

**如何获取 GH_TOKEN：**
- 访问：https://github.com/settings/tokens
- 点击 `Generate new token (classic)`
- 勾选 `repo` 和 `workflow` 权限
- 复制生成的 Token

### ✅ 第二步：启用 GitHub Pages

1. 进入仓库 → `Settings` → `Pages`
2. 在 `Source` 中选择 `GitHub Actions`
3. 保存设置

### ✅ 第三步：推送代码

```bash
git add .
git commit -m "feat: add GitHub Actions and Dashboard"
git push origin main
```

### ✅ 第四步：验证部署

1. **检查 Actions：**
   - 进入 `Actions` 标签
   - 查看 workflow 是否成功运行

2. **访问 Dashboard：**
   - 等待几分钟让 Pages 部署完成
   - 访问：`https://你的用户名.github.io/你的仓库名/`

---

## 📊 自动化流程说明

### 数据采集流程

```
每30分钟 → get-home-latest-timeline.yml
  ↓
获取最新推文
  ↓
保存到 tweets/YYYY-MM-DD.json
  ↓
自动提交到仓库
```

### 用户信息更新流程

```
每天0点 → daily-get-tweet-id.yml
  ↓
获取用户信息
  ↓
保存到 accounts/{username}.json
  ↓
自动提交到仓库
```

### Dashboard 部署流程

```
每6小时 → deploy-dashboard.yml
  ↓
读取 tweets/ 数据
  ↓
生成 dashboard/index.html
  ↓
部署到 GitHub Pages
```

---

## 🎯 功能模块说明

| 模块 | 文件 | 功能 | 触发频率 |
|------|------|------|----------|
| 推文采集 | `get-home-latest-timeline.yml` | 获取时间线推文 | 每30分钟 |
| 用户信息 | `daily-get-tweet-id.yml` | 更新用户数据 | 每天0点 |
| 发布推文 | `post-twitter-daily.yml` | 自动发布推文 | 每天0点 |
| Dashboard | `deploy-dashboard.yml` | 部署可视化页面 | 每6小时 |

---

## 📁 文件结构

```
x-kit/
├── .github/
│   └── workflows/
│       ├── get-home-latest-timeline.yml  # 推文采集
│       ├── daily-get-tweet-id.yml        # 用户信息更新
│       ├── post-twitter-daily.yml        # 发布推文
│       └── deploy-dashboard.yml          # Dashboard 部署
├── scripts/
│   ├── generate-dashboard.ts             # Dashboard 生成脚本
│   ├── fetch-tweets.ts                   # 获取推文
│   ├── index.ts                          # 获取用户信息
│   └── ...
├── dashboard/
│   └── index.html                        # 生成的 Dashboard（自动生成）
├── tweets/                               # 推文数据
└── accounts/                             # 用户数据
```

---

## 🔧 常用操作

### 手动触发 Workflow

1. 进入 `Actions` 标签
2. 选择对应的 workflow
3. 点击 `Run workflow` → `Run workflow`

### 本地测试 Dashboard

```bash
# 生成 Dashboard
bun run scripts/generate-dashboard.ts

# 预览（使用 Python）
cd dashboard
python3 -m http.server 8000
# 访问 http://localhost:8000
```

### 更新 Token

1. 重新获取 `auth_token`（参考 GET_TOKEN_GUIDE.md）
2. 更新 GitHub Secrets 中的 `AUTH_TOKEN` 和 `GET_ID_X_TOKEN`
3. 重新运行 workflow

---

## 📚 详细文档

- **[GitHub Actions 部署指南](./GITHUB_ACTIONS_DEPLOY.md)** - 完整的 Actions 配置说明
- **[Dashboard 部署指南](./DASHBOARD_DEPLOY.md)** - Dashboard 可视化部署
- **[快速启动指南](./QUICK_START.md)** - 本地开发指南
- **[API 配置指南](./API_CONFIG.md)** - Token 配置说明
- **[Token 获取指南](./GET_TOKEN_GUIDE.md)** - 如何获取 auth_token

---

## ⚠️ 注意事项

1. **Token 安全**
   - ✅ 使用 GitHub Secrets 存储
   - ❌ 不要提交到代码库
   - ✅ 定期更新 Token

2. **请求频率**
   - 避免过于频繁的请求
   - 遵守 Twitter 使用条款
   - 建议使用小号进行自动化

3. **GitHub Actions 限制**
   - 免费账户每月有使用时间限制
   - 注意控制 workflow 运行频率

4. **数据备份**
   - `tweets/` 和 `accounts/` 目录数据建议定期备份
   - 可以 fork 仓库作为备份

---

## 🐛 故障排查

### Dashboard 无法访问

1. 检查 GitHub Pages 是否启用
2. 检查 `deploy-dashboard.yml` 是否成功运行
3. 等待几分钟后刷新

### Workflow 运行失败

1. 检查 Secrets 是否正确配置
2. 查看 Actions 日志中的错误信息
3. 确认 Token 是否过期

### 数据不更新

1. 检查对应的 workflow 是否正常运行
2. 手动触发 workflow 测试
3. 检查网络连接和 API 限制

---

## 💡 进阶优化

### 添加通知功能

可以在 workflow 中添加邮件/Telegram 通知，当数据更新时发送提醒。

### 添加数据分析

可以添加更详细的数据分析功能，如：
- 热门话题分析
- 用户互动统计
- 时间趋势分析

### 自定义 Dashboard

可以修改 `generate-dashboard.ts` 添加：
- 搜索功能
- 筛选功能
- 数据导出功能
- 更丰富的图表

---

## 📞 获取帮助

如果遇到问题：
1. 查看对应的详细文档
2. 检查 GitHub Actions 日志
3. 查看项目 Issues

---

**祝部署顺利！🎉**

