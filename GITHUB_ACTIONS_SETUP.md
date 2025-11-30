# 🚀 GitHub Actions 部署完整指南

## 📋 前置准备

### 1. 确保项目已推送到 GitHub

```bash
# 如果还没有初始化 Git
git init
git add .
git commit -m "Initial commit"

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/x-kit.git
git branch -M main
git push -u origin main
```

---

## 🔑 第一步：配置 GitHub Secrets

### 1.1 进入 Secrets 设置页面

1. 打开你的 GitHub 仓库
2. 点击 `Settings`（设置）
3. 在左侧菜单中找到 `Secrets and variables` → `Actions`
4. 点击 `New repository secret`（新建仓库密钥）

### 1.2 添加必需的 Secrets

需要添加以下三个 Secrets：

#### Secret 1: AUTH_TOKEN

- **Name（名称）：** `AUTH_TOKEN`
- **Secret（值）：** `c6458d4841dc6d8289651c3b6e6b9c26d904b062`
- **说明：** 用于认证的 X (Twitter) Token

#### Secret 2: GET_ID_X_TOKEN

- **Name（名称）：** `GET_ID_X_TOKEN`
- **Secret（值）：** `c6458d4841dc6d8289651c3b6e6b9c26d904b062`
- **说明：** 用于获取用户ID的Token（可以与AUTH_TOKEN相同）

#### Secret 3: GH_TOKEN（GitHub Personal Access Token）

**如何获取 GH_TOKEN：**

1. 访问：https://github.com/settings/tokens
2. 点击 `Generate new token` → `Generate new token (classic)`
3. 设置 Token 名称（如：`x-kit-actions`）
4. 设置过期时间（建议选择 `No expiration` 或较长时间）
5. 勾选以下权限：
   - ✅ `repo`（完整仓库权限）
     - ✅ `repo:status`
     - ✅ `repo_deployment`
     - ✅ `public_repo`
     - ✅ `repo:invite`
     - ✅ `security_events`
   - ✅ `workflow`（工作流权限）
6. 点击 `Generate token`（生成令牌）
7. **重要：** 立即复制生成的 Token（格式：`ghp_xxxxxxxxxxxx`），只显示一次！

- **Name（名称）：** `GH_TOKEN`
- **Secret（值）：** 粘贴刚才复制的 Token

### 1.3 验证 Secrets 配置

配置完成后，你应该看到三个 Secrets：
- ✅ `AUTH_TOKEN`
- ✅ `GET_ID_X_TOKEN`
- ✅ `GH_TOKEN`

---

## ⚙️ 第二步：确认 Workflow 文件

### 2.1 检查文件是否存在

确保以下文件存在：
```
.github/workflows/hourly-update.yml
```

如果文件不存在，请确保已推送到 GitHub。

### 2.2 Workflow 配置说明

`hourly-update.yml` 配置文件说明：

- **执行频率：** 每小时执行一次（每小时的第0分钟）
- **触发方式：**
  - 自动：每小时自动执行
  - 手动：可以在 Actions 页面手动触发
- **执行内容：**
  1. 获取最新推文
  2. 保存到 `tweets/` 目录
  3. 如果有变更，自动提交到仓库

---

## ✅ 第三步：启用 GitHub Actions

### 3.1 检查 Actions 权限

1. 进入仓库 `Settings` → `Actions` → `General`
2. 在 `Workflow permissions` 部分：
   - 选择 `Read and write permissions`
   - 勾选 `Allow GitHub Actions to create and approve pull requests`
3. 点击 `Save`（保存）

### 3.2 验证 Actions 已启用

1. 点击仓库顶部的 `Actions` 标签
2. 如果看到 workflow 列表，说明已启用
3. 如果提示需要启用，点击 `I understand my workflows, go ahead and enable them`

---

## 🚀 第四步：测试运行

### 4.1 手动触发测试

1. 进入 `Actions` 标签
2. 在左侧找到 `Hourly Update` workflow
3. 点击 `Run workflow` 按钮
4. 选择分支（通常是 `main`）
5. 点击绿色的 `Run workflow` 按钮

### 4.2 查看执行日志

1. 点击刚才运行的 workflow
2. 点击左侧的 `update-tweets` job
3. 查看各个步骤的执行日志
4. 检查是否有错误

### 4.3 验证结果

执行成功后：
- 检查 `tweets/` 目录是否有新的 JSON 文件
- 检查文件内容是否包含推文数据
- 检查是否有新的 commit 提交

---

## 📊 第五步：监控和维护

### 5.1 查看执行历史

- 进入 `Actions` 标签
- 查看 `Hourly Update` 的执行历史
- 绿色 ✅ 表示成功，红色 ❌ 表示失败

### 5.2 查看执行摘要

每次执行后，可以在执行详情页面看到：
- 执行时间
- 数据更新状态
- 是否有新数据

### 5.3 常见问题排查

#### 问题1：Workflow 没有自动执行

**检查：**
- 确认 cron 表达式正确：`0 * * * *`
- 等待至少1小时（GitHub Actions 可能有延迟）
- 检查仓库是否设置为私有（私有仓库需要付费账户）

#### 问题2：执行失败，提示 "AUTH_TOKEN is not defined"

**解决：**
- 检查 Secrets 中是否配置了 `AUTH_TOKEN`
- 确认 Secret 名称完全一致（区分大小写）
- 重新运行 workflow

#### 问题3：推送失败，提示权限不足

**解决：**
- 检查 `GH_TOKEN` 是否正确配置
- 确认 Token 有 `repo` 和 `workflow` 权限
- 检查 Actions 权限设置

#### 问题4：Token 过期

**解决：**
1. 重新获取 `auth_token`（参考 GET_TOKEN_GUIDE.md）
2. 更新 GitHub Secrets 中的 `AUTH_TOKEN` 和 `GET_ID_X_TOKEN`
3. 重新运行 workflow

---

## 🔧 自定义配置

### 修改执行频率

编辑 `.github/workflows/hourly-update.yml`：

```yaml
schedule:
  - cron: '0 * * * *'  # 每小时
  # 其他选项：
  # '*/30 * * * *'  # 每30分钟
  # '0 */2 * * *'   # 每2小时
  # '0 9 * * *'     # 每天9点
  # '0 9 * * 1'     # 每周一9点
```

**Cron 表达式格式：**
```
分钟 小时 日 月 星期
*    *   *  *   *
```

### 添加更多功能

可以在 workflow 中添加其他步骤：

```yaml
- name: Update user info
  env:
    GET_ID_X_TOKEN: ${{ secrets.GET_ID_X_TOKEN }}
  run: bun run scripts/index.ts

- name: Generate dashboard
  run: bun run scripts/generate-dashboard.ts
```

---

## 📈 执行时间表

| 时间 | 执行内容 |
|------|---------|
| 00:00 | 获取推文 |
| 01:00 | 获取推文 |
| 02:00 | 获取推文 |
| ... | ... |
| 23:00 | 获取推文 |

**注意：** GitHub Actions 使用 UTC 时间，与中国时间（UTC+8）相差8小时。

例如：
- UTC 00:00 = 中国时间 08:00
- UTC 12:00 = 中国时间 20:00

---

## 🔐 安全建议

1. ✅ **保护 Secrets**
   - 不要将 Token 提交到代码库
   - 定期更新 Token
   - 使用最小权限原则

2. ✅ **监控使用量**
   - GitHub 免费账户每月有使用时间限制
   - 注意控制 workflow 运行频率

3. ✅ **账号安全**
   - 建议使用小号进行自动化操作
   - 避免主账号被封禁风险

---

## 📚 相关文档

- [快速启动指南](./QUICK_START.md) - 本地开发指南
- [API 配置指南](./API_CONFIG.md) - Token 配置说明
- [Token 获取指南](./GET_TOKEN_GUIDE.md) - 如何获取 auth_token
- [Dashboard 部署指南](./DASHBOARD_DEPLOY.md) - 可视化页面部署

---

## ✅ 部署检查清单

- [ ] 项目已推送到 GitHub
- [ ] 已配置 `AUTH_TOKEN` Secret
- [ ] 已配置 `GET_ID_X_TOKEN` Secret
- [ ] 已配置 `GH_TOKEN` Secret
- [ ] 已启用 GitHub Actions
- [ ] 已设置 Actions 权限为读写
- [ ] `hourly-update.yml` 文件存在
- [ ] 手动测试运行成功
- [ ] 检查推文数据是否正常更新

---

## 🎉 完成！

配置完成后，你的项目将：
- ✅ 每小时自动获取最新推文
- ✅ 自动保存到 `tweets/` 目录
- ✅ 自动提交到 GitHub 仓库
- ✅ 可以在 Actions 页面查看执行历史

**祝部署顺利！** 🚀

