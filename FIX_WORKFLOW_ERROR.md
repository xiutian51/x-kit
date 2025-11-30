gi# 🔧 修复 Workflow 错误指南

## ❌ 错误信息

```
Error: Input required and not supplied: token
```

## 🔍 问题原因

Workflow 中使用了 `token: ${{ secrets.GH_TOKEN }}`，但该 Secret 未配置。

## ✅ 解决方案

### 方案一：使用 GitHub 自动提供的 Token（最简单）

GitHub Actions 会自动提供一个 `GITHUB_TOKEN`，无需额外配置。

**已修复的 workflow 会自动使用：**
- 如果配置了 `GH_TOKEN`，优先使用
- 如果没有配置，自动使用 `github.token`（GitHub 自动提供）

**优点：**
- ✅ 无需额外配置
- ✅ 自动可用
- ✅ 有推送权限（如果仓库设置了正确的权限）

**操作步骤：**
1. 确保仓库设置中 Actions 权限为 `Read and write`
2. 直接运行 workflow，无需配置 `GH_TOKEN`

### 方案二：配置 GH_TOKEN（推荐用于高级场景）

如果需要更多权限或使用个人 Token：

1. **获取 Personal Access Token**
   - 访问：https://github.com/settings/tokens
   - 点击 `Generate new token (classic)`
   - 勾选 `repo` 和 `workflow` 权限
   - 复制生成的 Token

2. **配置 Secret**
   - 进入仓库 → `Settings` → `Secrets and variables` → `Actions`
   - 点击 `New repository secret`
   - Name: `GH_TOKEN`
   - Secret: 粘贴刚才复制的 Token

---

## 📋 必需的 Secrets 清单

### ✅ 必须配置（用于获取推文）

| Secret 名称 | 说明 | 是否必需 |
|-----------|------|---------|
| `AUTH_TOKEN` | X (Twitter) 认证 Token | ✅ 必需 |
| `GET_ID_X_TOKEN` | 用于获取用户ID的Token | ✅ 必需 |

### ⚙️ 可选配置（用于推送代码）

| Secret 名称 | 说明 | 是否必需 |
|-----------|------|---------|
| `GH_TOKEN` | GitHub Personal Access Token | ⚠️ 可选（已修复为自动使用） |

---

## 🔧 设置 Actions 权限（重要）

即使使用自动 Token，也需要设置正确的权限：

1. 进入仓库 → `Settings` → `Actions` → `General`
2. 找到 `Workflow permissions`
3. 选择：**`Read and write permissions`**
4. 勾选：**`Allow GitHub Actions to create and approve pull requests`**
5. 点击 `Save`

---

## ✅ 验证修复

### 1. 检查 Secrets 配置

确保至少配置了：
- ✅ `AUTH_TOKEN`
- ✅ `GET_ID_X_TOKEN`

### 2. 检查 Actions 权限

确保设置为：
- ✅ `Read and write permissions`

### 3. 测试运行

1. 进入 `Actions` 标签
2. 选择 `Hourly Update` workflow
3. 点击 `Run workflow`
4. 查看是否成功运行

---

## 🐛 常见错误

### 错误1：`AUTH_TOKEN is not defined`

**原因：** 未配置 `AUTH_TOKEN` Secret

**解决：**
1. 进入 `Settings` → `Secrets and variables` → `Actions`
2. 添加 `AUTH_TOKEN` Secret
3. 值：`c6458d4841dc6d8289651c3b6e6b9c26d904b062`

### 错误2：`Permission denied` 或推送失败

**原因：** Actions 权限设置不正确

**解决：**
1. 进入 `Settings` → `Actions` → `General`
2. 设置 `Workflow permissions` 为 `Read and write permissions`
3. 保存设置

### 错误3：`Token expired`

**原因：** Token 已过期

**解决：**
1. 重新获取 `auth_token`（参考 GET_TOKEN_GUIDE.md）
2. 更新 GitHub Secrets 中的 `AUTH_TOKEN`

---

## 📝 关于 .env 文件

### ❌ GitHub Actions 不需要 .env 文件

**原因：**
- GitHub Actions 使用 Secrets 来传递敏感信息
- `.env` 文件不会被推送到 GitHub（在 `.gitignore` 中）
- 环境变量通过 `env:` 在 workflow 中设置

**本地开发才需要 .env：**
- 本地运行脚本时需要 `.env` 文件
- GitHub Actions 运行时使用 Secrets

---

## 🎯 快速检查清单

- [ ] 已配置 `AUTH_TOKEN` Secret
- [ ] 已配置 `GET_ID_X_TOKEN` Secret
- [ ] Actions 权限设置为 `Read and write`
- [ ] 已推送最新的 workflow 文件
- [ ] 手动测试运行成功

---

## 📚 相关文档

- [快速部署指南](./QUICK_DEPLOY.md)
- [完整部署指南](./GITHUB_ACTIONS_SETUP.md)
- [API 配置指南](./API_CONFIG.md)

---

**修复完成后，workflow 应该可以正常运行了！** 🎉

