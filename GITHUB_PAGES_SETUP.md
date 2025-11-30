# 📊 GitHub Pages 可视化部署完整指南

## 🎯 目标

将推文数据通过 GitHub Pages 可视化展示，创建一个美观的 Dashboard 页面。

## ✅ 前置条件

- ✅ GitHub Actions 已正常运行（`hourly-update.yml`）
- ✅ 推文数据已保存在 `tweets/` 目录
- ✅ 仓库已配置 GitHub Secrets

---

## 🚀 部署步骤（5步完成）

### 步骤 1️⃣：启用 GitHub Pages

1. **进入仓库设置**
   ```
   https://github.com/xiutian51/x-kit/settings/pages
   ```

2. **配置 Pages 设置**
   - 在 `Source` 部分，选择 **`GitHub Actions`**
   - 不要选择 `Deploy from a branch`
   - 点击 **`Save`** 保存

3. **验证设置**
   - 页面会显示：`Your site is ready to be published at https://xiutian51.github.io/x-kit/`
   - 注意：此时还没有内容，需要先运行 workflow

---

### 步骤 2️⃣：检查 Dashboard 部署 Workflow

确保以下文件存在：
- ✅ `.github/workflows/deploy-dashboard.yml`
- ✅ `scripts/generate-dashboard.ts`

如果不存在，需要先推送这些文件到仓库。

---

### 步骤 3️⃣：手动触发 Dashboard 部署

1. **进入 Actions 页面**
   ```
   https://github.com/xiutian51/x-kit/actions
   ```

2. **找到 `Deploy Dashboard` workflow**
   - 在左侧 workflow 列表中找到 `Deploy Dashboard`

3. **手动触发**
   - 点击 `Run workflow` 按钮
   - 选择分支：`main`
   - 点击绿色的 `Run workflow` 按钮

4. **等待执行完成**
   - 等待 workflow 执行（约 1-2 分钟）
   - 查看执行日志，确认成功

---

### 步骤 4️⃣：访问 Dashboard

部署完成后（等待 1-2 分钟），访问：

```
https://xiutian51.github.io/x-kit/
```

**注意：**
- 首次部署可能需要几分钟
- 如果显示 404，等待几分钟后刷新
- 确保 Pages 设置中 Source 为 `GitHub Actions`

---

### 步骤 5️⃣：验证自动化

Dashboard 会在以下情况自动更新：

1. **定时更新：** 每 6 小时自动更新一次
2. **数据更新时：** 当 `tweets/` 目录有新文件时自动更新
3. **手动触发：** 可以在 Actions 页面手动触发

---

## 📋 完整配置检查清单

- [ ] GitHub Pages 已启用（Source: GitHub Actions）
- [ ] `deploy-dashboard.yml` workflow 文件存在
- [ ] `generate-dashboard.ts` 脚本文件存在
- [ ] 已手动触发一次 Dashboard 部署
- [ ] Dashboard 可以正常访问
- [ ] 数据正确显示

---

## 🔧 工作流程说明

### 自动化流程

```
每小时 → hourly-update.yml
  ↓
获取推文 → 保存到 tweets/YYYY-MM-DD.json
  ↓
触发 deploy-dashboard.yml（当 tweets/ 有更新时）
  ↓
生成 dashboard/index.html
  ↓
部署到 GitHub Pages
  ↓
访问 https://xiutian51.github.io/x-kit/
```

### 手动更新流程

```
手动触发 → deploy-dashboard.yml
  ↓
读取 tweets/ 所有数据
  ↓
生成 Dashboard HTML
  ↓
部署到 GitHub Pages
```

---

## 🎨 Dashboard 功能预览

Dashboard 包含以下内容：

### 1. 统计卡片
- 📊 总推文数
- 👥 用户数量
- 🖼️ 包含图片的推文数
- 🎥 包含视频的推文数

### 2. 每日趋势图
- 📈 最近 30 天的推文数量
- 📊 可视化柱状图
- 🖱️ 鼠标悬停显示详情

### 3. 用户活跃度排行
- 🏆 按推文数量排序
- 👤 显示用户头像、名称、用户名
- 📊 显示粉丝数、关注数
- 🔢 显示该用户的推文数量

---

## 🐛 常见问题排查

### 问题 1：GitHub Pages 显示 404

**可能原因：**
- Pages 未启用
- Source 设置错误
- 部署未完成

**解决方案：**
1. 检查 `Settings` → `Pages` → `Source` 是否为 `GitHub Actions`
2. 检查 Actions 中 `Deploy Dashboard` 是否成功运行
3. 等待几分钟后刷新页面

### 问题 2：Dashboard 页面空白

**可能原因：**
- `tweets/` 目录没有数据
- JSON 文件格式错误
- 脚本执行失败

**解决方案：**
1. 检查 `tweets/` 目录是否有 JSON 文件
2. 查看 Actions 日志中的错误信息
3. 手动运行 `bun run scripts/generate-dashboard.ts` 测试

### 问题 3：数据不更新

**可能原因：**
- Workflow 未触发
- 数据文件未更新

**解决方案：**
1. 检查 `hourly-update.yml` 是否正常运行
2. 手动触发 `Deploy Dashboard` workflow
3. 检查 `tweets/` 目录是否有新文件

### 问题 4：样式显示异常

**可能原因：**
- HTML 生成不完整
- 浏览器缓存

**解决方案：**
1. 清除浏览器缓存
2. 检查浏览器控制台错误
3. 重新部署 Dashboard

---

## ⚙️ 自定义配置

### 修改更新频率

编辑 `.github/workflows/deploy-dashboard.yml`：

```yaml
schedule:
  - cron: '0 */6 * * *'  # 每6小时
  # 其他选项：
  # '0 */1 * * *'  # 每小时（与 hourly-update 同步）
  # '0 0 * * *'    # 每天0点
```

### 修改显示数量

编辑 `scripts/generate-dashboard.ts`：

```typescript
.slice(0, 50)  // 显示前50名用户（修改数字）
.slice(-30)    // 显示最近30天的数据（修改数字）
```

### 修改主题颜色

编辑 `scripts/generate-dashboard.ts` 中的 CSS：

```typescript
// 找到这行
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

// 修改为你喜欢的颜色
background: linear-gradient(135deg, #你的颜色1 0%, #你的颜色2 100%);
```

---

## 📊 访问地址

部署成功后，Dashboard 地址：

```
https://xiutian51.github.io/x-kit/
```

**注意：**
- 如果仓库是私有的，GitHub Pages 也是私有的（需要登录 GitHub 访问）
- 如果仓库是公开的，GitHub Pages 也是公开的

---

## 🔄 更新机制

### 自动更新

Dashboard 会在以下情况自动更新：

1. **定时更新：** 每 6 小时（可配置）
2. **数据更新：** 当 `tweets/` 目录有新文件时
3. **脚本更新：** 当 `generate-dashboard.ts` 有修改时

### 手动更新

随时可以在 Actions 页面手动触发：
```
Actions → Deploy Dashboard → Run workflow
```

---

## 📚 相关文档

- [GitHub Actions 部署指南](./GITHUB_ACTIONS_SETUP.md)
- [Dashboard 部署指南](./DASHBOARD_DEPLOY.md)
- [快速启动指南](./QUICK_START.md)

---

## ✅ 验证部署成功

部署成功后，你应该能够：

1. ✅ 访问 `https://xiutian51.github.io/x-kit/`
2. ✅ 看到统计卡片显示数据
3. ✅ 看到每日趋势图
4. ✅ 看到用户活跃度排行
5. ✅ 页面样式正常显示

---

## 🎉 完成！

配置完成后，你的 Dashboard 将：
- ✅ 自动更新（每 6 小时或数据更新时）
- ✅ 美观的可视化界面
- ✅ 实时数据展示
- ✅ 可通过 GitHub Pages 访问

**开始部署吧！** 🚀

