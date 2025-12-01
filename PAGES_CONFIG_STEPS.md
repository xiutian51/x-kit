# 📋 GitHub Pages 配置步骤详解

## ✅ 当前状态

从你的截图可以看到：
- ✅ Source 已选择：`GitHub Actions`（正确！）
- ✅ 页面显示了两个建议的 workflow（可以忽略）

## 🎯 重要说明

**你不需要点击页面上的 "Configure" 按钮！**

你已经有了自己的 workflow (`deploy-dashboard.yml`)，不需要使用 GitHub 建议的 workflow。

---

## 📝 配置步骤

### 步骤 1：确认 Source 设置（已完成）

✅ 你的 Source 已经设置为 `GitHub Actions`，这是正确的！

**不需要做任何操作**，保持当前设置即可。

---

### 步骤 2：忽略建议的 Workflow

页面上显示的两个 workflow：
- ❌ "GitHub Pages Jekyll" - 不需要
- ❌ "Static HTML" - 不需要

**原因：** 你已经有了自己的 `deploy-dashboard.yml` workflow，它会：
- 生成 Dashboard HTML
- 部署到 GitHub Pages

---

### 步骤 3：触发 Dashboard 部署

1. **打开新标签页**，访问：
   ```
   https://github.com/xiutian51/x-kit/actions
   ```

2. **找到 `Deploy Dashboard` workflow**
   - 在左侧 workflow 列表中查找
   - 如果看不到，刷新页面

3. **手动触发**
   - 点击 `Deploy Dashboard`
   - 点击右侧的 `Run workflow` 按钮
   - 选择分支：`main`
   - 点击绿色的 `Run workflow` 按钮

4. **等待执行**
   - 等待 workflow 执行完成（约 1-2 分钟）
   - 查看执行日志，确认成功

---

### 步骤 4：访问 Dashboard

部署完成后（等待 1-2 分钟），访问：

```
https://xiutian51.github.io/x-kit/
```

---

## 🔍 验证配置

### 检查 Workflow 是否存在

1. 访问：`https://github.com/xiutian51/x-kit/actions`
2. 查看左侧是否有 `Deploy Dashboard` workflow
3. 如果没有，检查 `.github/workflows/deploy-dashboard.yml` 文件是否已推送

### 检查 Workflow 文件

确保以下文件存在：
```
.github/workflows/deploy-dashboard.yml
scripts/generate-dashboard.ts
```

---

## 📊 工作流程说明

### 自动化流程

```
每小时 → hourly-update.yml
  ↓
获取推文 → 保存到 tweets/YYYY-MM-DD.json
  ↓
自动触发 → deploy-dashboard.yml（当 tweets/ 有更新时）
  ↓
生成 Dashboard → dashboard/index.html
  ↓
部署到 GitHub Pages
  ↓
访问 https://xiutian51.github.io/x-kit/
```

### 手动触发流程

```
手动触发 → deploy-dashboard.yml
  ↓
读取所有 tweets/ 数据
  ↓
生成 Dashboard HTML
  ↓
部署到 GitHub Pages
```

---

## ⚠️ 常见问题

### Q1: 页面显示 "Workflow details will appear here once your site has been deployed"

**说明：** 这是正常的，表示还没有运行过 workflow。

**解决：** 按照步骤 3 手动触发一次 workflow。

### Q2: 找不到 `Deploy Dashboard` workflow

**可能原因：**
- Workflow 文件未推送
- 需要刷新页面

**解决：**
1. 检查 `.github/workflows/deploy-dashboard.yml` 是否存在
2. 如果不存在，推送代码：
   ```bash
   git add .github/workflows/deploy-dashboard.yml
   git commit -m "feat: add dashboard deployment"
   git push origin main
   ```

### Q3: 点击 "Configure" 按钮会怎样？

**说明：** 如果点击了建议的 workflow 的 "Configure" 按钮，会创建一个新的 workflow 文件。

**建议：** 
- 如果误点了，可以删除新创建的 workflow 文件
- 继续使用你自己的 `deploy-dashboard.yml`

---

## ✅ 配置检查清单

- [x] Source 设置为 `GitHub Actions`（已完成）
- [ ] `deploy-dashboard.yml` workflow 文件存在
- [ ] `generate-dashboard.ts` 脚本文件存在
- [ ] 已手动触发 `Deploy Dashboard` workflow
- [ ] Workflow 执行成功
- [ ] 可以访问 `https://xiutian51.github.io/x-kit/`

---

## 🎉 完成后的效果

配置完成后，你应该能够：

1. ✅ 访问 `https://xiutian51.github.io/x-kit/`
2. ✅ 看到统计卡片（总推文数、用户数等）
3. ✅ 看到每日推文趋势图
4. ✅ 看到用户活跃度排行
5. ✅ Dashboard 每 6 小时自动更新

---

## 📚 相关文档

- [快速部署指南](./PAGES_QUICK_START.md)
- [完整部署指南](./GITHUB_PAGES_SETUP.md)

---

**记住：保持 Source 为 `GitHub Actions`，然后去 Actions 页面触发 workflow 即可！** 🚀

