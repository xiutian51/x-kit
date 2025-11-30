# ⚡ GitHub Pages 可视化快速部署（3步完成）

## 🎯 目标

将推文数据通过 GitHub Pages 可视化展示。

---

## ✅ 快速部署（3步）

### 步骤 1️⃣：启用 GitHub Pages（1分钟）

1. 访问：`https://github.com/xiutian51/x-kit/settings/pages`
2. 在 `Source` 中选择：**`GitHub Actions`**
3. 点击 **`Save`**

---

### 步骤 2️⃣：触发 Dashboard 部署（1分钟）

1. 访问：`https://github.com/xiutian51/x-kit/actions`
2. 找到 **`Deploy Dashboard`** workflow
3. 点击 **`Run workflow`** → **`Run workflow`**
4. 等待执行完成（约 1-2 分钟）

---

### 步骤 3️⃣：访问 Dashboard（立即）

部署完成后，访问：

```
https://xiutian51.github.io/x-kit/
```

**注意：** 首次部署可能需要等待 1-2 分钟。

---

## 📊 Dashboard 功能

- ✅ 总推文数统计
- ✅ 用户数量统计
- ✅ 每日推文趋势图（最近30天）
- ✅ 用户活跃度排行（前50名）
- ✅ 美观的现代化 UI

---

## 🔄 自动更新

Dashboard 会在以下情况自动更新：

1. ✅ **每 6 小时**自动更新一次
2. ✅ **数据更新时**自动更新（当 `tweets/` 有新文件时）
3. ✅ **手动触发**随时更新

---

## 🐛 遇到问题？

### 404 错误
- ✅ 检查 Pages 设置中 Source 是否为 `GitHub Actions`
- ✅ 等待几分钟后刷新
- ✅ 检查 Actions 是否成功运行

### 页面空白
- ✅ 检查 `tweets/` 目录是否有数据
- ✅ 查看 Actions 日志中的错误

### 数据不更新
- ✅ 手动触发 `Deploy Dashboard` workflow
- ✅ 检查 `hourly-update.yml` 是否正常运行

---

## 📚 详细文档

- [完整部署指南](./GITHUB_PAGES_SETUP.md)
- [Dashboard 部署指南](./DASHBOARD_DEPLOY.md)

---

**就这么简单！开始部署吧！** 🚀

