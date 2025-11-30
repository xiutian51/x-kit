# 🚀 GitHub Actions 部署指南

## 📋 前置准备

### 1. 配置 GitHub Secrets

在 GitHub 仓库中配置以下 Secrets：

1. **进入仓库设置**
   - 打开你的 GitHub 仓库
   - 点击 `Settings` → `Secrets and variables` → `Actions`

2. **添加以下 Secrets：**

| Secret 名称 | 说明 | 示例值 |
|------------|------|--------|
| `AUTH_TOKEN` | X (Twitter) 认证 Token | `c6458d4841dc6d8289651c3b6e6b9c26d904b062` |
| `GET_ID_X_TOKEN` | 用于获取用户ID的Token（可与AUTH_TOKEN相同） | `c6458d4841dc6d8289651c3b6e6b9c26d904b062` |
| `GH_TOKEN` | GitHub Personal Access Token（用于推送代码） | `ghp_xxxxxxxxxxxx` |

#### 如何获取 GH_TOKEN：

1. 访问：https://github.com/settings/tokens
2. 点击 `Generate new token` → `Generate new token (classic)`
3. 设置权限：
   - ✅ `repo` (完整仓库权限)
   - ✅ `workflow` (工作流权限)
4. 生成后复制 Token（只显示一次，请妥善保存）

### 2. 确保仓库已推送

```bash
git add .
git commit -m "feat: add GitHub Actions workflows"
git push origin main
```

---

## 🔧 现有 Workflow 说明

项目已包含以下 GitHub Actions Workflows：

### 1. `get-home-latest-timeline.yml`
- **功能：** 每30分钟获取一次最新推文
- **触发：** 定时（每30分钟）+ 手动触发
- **输出：** 更新 `tweets/YYYY-MM-DD.json` 文件

### 2. `daily-get-tweet-id.yml`
- **功能：** 每天获取一次用户信息
- **触发：** 定时（每天0点）+ 手动触发
- **输出：** 更新 `accounts/{username}.json` 文件

### 3. `post-twitter-daily.yml`
- **功能：** 每天发布一条推文
- **触发：** 定时（每天0点）+ 手动触发
- **输出：** 发布推文到 X (Twitter)

---

## ✅ 验证部署

### 方法一：手动触发测试

1. 进入 GitHub 仓库
2. 点击 `Actions` 标签
3. 选择任意 workflow
4. 点击 `Run workflow` → `Run workflow`

### 方法二：等待定时触发

- 推文获取：每30分钟自动运行
- 用户信息：每天0点自动运行
- 发布推文：每天0点自动运行

---

## 🔍 查看运行日志

1. 进入 `Actions` 标签
2. 点击对应的 workflow 运行记录
3. 查看各步骤的执行日志
4. 如有错误，检查：
   - Secrets 是否正确配置
   - Token 是否过期
   - 网络连接是否正常

---

## ⚙️ 自定义配置

### 修改定时任务

编辑 `.github/workflows/*.yml` 文件中的 `cron` 表达式：

```yaml
schedule:
  - cron: '*/30 * * * *'  # 每30分钟
  # 分钟 小时 日 月 星期
  # 示例：
  # '0 0 * * *'     # 每天0点
  # '0 */6 * * *'   # 每6小时
  # '0 9 * * 1'     # 每周一9点
```

### 添加新的 Workflow

创建 `.github/workflows/your-workflow.yml`：

```yaml
name: Your Workflow Name

on:
  schedule:
    - cron: '0 0 * * *'  # 定时触发
  workflow_dispatch:      # 手动触发

jobs:
  your-job:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          token: ${{ secrets.GH_TOKEN }}
          
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
          
      - name: Install dependencies
        run: bun install
        
      - name: Run your script
        env:
          AUTH_TOKEN: ${{ secrets.AUTH_TOKEN }}
          GET_ID_X_TOKEN: ${{ secrets.GET_ID_X_TOKEN }}
        run: bun run scripts/your-script.ts
        
      - name: Commit and push changes
        run: |
          git config --global user.name 'GitHub Actions Bot'
          git config --global user.email 'github-actions[bot]@users.noreply.github.com'
          git add .
          git commit -m "chore: update data [skip ci]" || exit 0
          git push
```

---

## 🐛 常见问题

### Q1: Workflow 运行失败，提示 "AUTH_TOKEN is not defined"

**解决方案：**
- 检查 GitHub Secrets 中是否已配置 `AUTH_TOKEN`
- 确保 Secret 名称与 workflow 中的完全一致（区分大小写）

### Q2: 推送代码失败，提示权限不足

**解决方案：**
- 检查 `GH_TOKEN` 是否正确配置
- 确保 Token 有 `repo` 和 `workflow` 权限
- 检查仓库设置中是否允许 Actions 写入

### Q3: Token 过期怎么办？

**解决方案：**
1. 重新获取 `auth_token`（参考 GET_TOKEN_GUIDE.md）
2. 更新 GitHub Secrets 中的 `AUTH_TOKEN` 和 `GET_ID_X_TOKEN`
3. 重新运行 workflow

### Q4: 如何禁用某个 Workflow？

**解决方案：**
- 删除对应的 `.yml` 文件
- 或注释掉 `on:` 部分

---

## 📊 监控和通知

### 添加邮件通知（可选）

在 workflow 中添加通知步骤：

```yaml
- name: Send notification on failure
  if: failure()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: Workflow failed
    body: The workflow has failed
    to: your-email@example.com
```

---

## 🔐 安全建议

1. ✅ **不要将 Token 提交到代码库**
   - 使用 GitHub Secrets 存储敏感信息
   - `.env` 文件已在 `.gitignore` 中

2. ✅ **定期更新 Token**
   - Token 可能过期或被撤销
   - 建议每3个月更新一次

3. ✅ **使用最小权限原则**
   - `GH_TOKEN` 只需要必要的权限
   - 不要授予过多权限

4. ✅ **监控 Actions 使用量**
   - GitHub 免费账户有使用限制
   - 注意控制 workflow 运行频率

---

## 📚 相关资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Cron 表达式生成器](https://crontab.guru/)
- [GitHub Secrets 文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

