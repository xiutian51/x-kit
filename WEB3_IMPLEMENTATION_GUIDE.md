# Web3 分析功能实施指南

## ✅ 已完成的工作

### 1. 数据库扩展
- ✅ 创建了 5 个新表：topics, sentiment_analysis, crypto_mentions, insights, market_trends
- ✅ 添加了必要的索引

### 2. API 接口
- ✅ `/api/web3/analyze-tweet` - 分析单条推文
- ✅ `/api/web3/consensus-divergence` - 分析共识和分歧
- ✅ `/api/web3/market-sentiment` - 获取市场情绪统计

### 3. 批量分析脚本
- ✅ `scripts/analyze-web3-tweets.ts` - 批量分析工具

---

## 🚀 使用步骤

### 步骤 1: 更新数据库

重启 Flask 服务器，数据库会自动创建新表：

```bash
cd server
python app.py
```

### 步骤 2: 获取认证 Token

1. 访问 Dashboard 并登录
2. 在浏览器控制台运行：
   ```javascript
   localStorage.getItem('authToken')
   ```
3. 复制 token

### 步骤 3: 批量分析推文

```bash
# 设置环境变量
export AUTH_TOKEN="your_token_here"
export SERVER_URL="http://your-server:20500"

# 分析单条推文（需要先知道推文 ID）
# 可以通过 API 或数据库查询获取推文 ID

# 分析共识和分歧
bun run scripts/analyze-web3-tweets.ts consensus 7

# 按分类分析（defi, nft, gamefi, layer2）
bun run scripts/analyze-web3-tweets.ts consensus 7 defi

# 获取市场情绪
bun run scripts/analyze-web3-tweets.ts sentiment 7
```

---

## 📊 API 使用示例

### 1. 分析单条推文

```bash
curl -X POST http://localhost:5000/api/web3/analyze-tweet \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tweet_id": 1}'
```

**返回示例：**
```json
{
  "success": true,
  "data": {
    "is_web3": true,
    "category": "defi",
    "category_confidence": 0.95,
    "sentiment": "bullish",
    "sentiment_score": 0.8,
    "sentiment_confidence": 0.9,
    "mentioned_cryptos": ["ETH", "BTC"],
    "keywords": ["DeFi", "yield"],
    "insights": [
      {
        "type": "prediction",
        "content": "预测 DeFi 收益率将上升",
        "confidence": 0.85
      }
    ]
  }
}
```

### 2. 分析共识和分歧

```bash
curl -X POST http://localhost:5000/api/web3/consensus-divergence \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"days": 7, "category": "defi"}'
```

**返回示例：**
```json
{
  "success": true,
  "data": {
    "consensus": [
      {
        "point": "Layer2 将大幅降低 Gas 费用",
        "support_count": 15,
        "tweet_ids": [1, 2, 3],
        "confidence": 0.9
      }
    ],
    "divergence": [
      {
        "topic": "BTC 价格走势",
        "viewpoints": [
          {
            "viewpoint": "BTC 将突破新高",
            "support_count": 8,
            "sentiment": "bullish"
          },
          {
            "viewpoint": "BTC 将回调",
            "support_count": 5,
            "sentiment": "bearish"
          }
        ],
        "intensity": 0.7
      }
    ],
    "summary": "整体市场对 Layer2 技术持乐观态度..."
  }
}
```

### 3. 获取市场情绪

```bash
curl http://localhost:5000/api/web3/market-sentiment?days=7&category=defi \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**返回示例：**
```json
{
  "success": true,
  "data": {
    "overall_sentiment": "bullish",
    "sentiment_score": 0.65,
    "total_tweets": 50,
    "breakdown": {
      "bullish": {
        "count": 30,
        "percentage": 60.0
      },
      "bearish": {
        "count": 10,
        "percentage": 20.0
      },
      "neutral": {
        "count": 10,
        "percentage": 20.0
      }
    }
  }
}
```

---

## 🔄 下一步工作

### Phase 1: 完善批量分析（优先级：高）

1. **创建获取未分析推文的 API**
   ```python
   @app.route('/api/web3/unanalyzed-tweets', methods=['GET'])
   ```
   返回未分析的推文 ID 列表

2. **优化批量分析脚本**
   - 自动获取未分析推文
   - 支持断点续传
   - 添加进度显示

### Phase 2: Dashboard 可视化（优先级：高）

1. **情绪仪表盘**
   - 整体情绪指标
   - 情绪趋势图
   - 分类情绪对比

2. **共识/分歧面板**
   - 共识观点列表
   - 分歧话题对比
   - 观点演变时间线

3. **赛道分析**
   - 赛道热度排行
   - 赛道情绪对比
   - 赛道趋势图

### Phase 3: 自动化分析（优先级：中）

1. **定时分析任务**
   - 每小时分析新推文
   - 每天生成市场趋势报告

2. **增量分析**
   - 只分析新推文
   - 避免重复分析

### Phase 4: 优化和调优（优先级：低）

1. **Prompt 优化**
   - 基于实际效果调整
   - A/B 测试不同 Prompt

2. **性能优化**
   - 批量 API 调用
   - 缓存分析结果

---

## 💡 使用建议

### 1. 先小规模测试

```bash
# 先分析少量推文测试效果
bun run scripts/analyze-web3-tweets.ts analyze 1 10
```

### 2. 逐步扩大范围

```bash
# 分析最近 3 天
bun run scripts/analyze-web3-tweets.ts analyze 3 50

# 分析最近 7 天
bun run scripts/analyze-web3-tweets.ts analyze 7 100
```

### 3. 按分类分析

```bash
# 只分析 DeFi 相关
bun run scripts/analyze-web3-tweets.ts consensus 7 defi

# 只分析 NFT 相关
bun run scripts/analyze-web3-tweets.ts consensus 7 nft
```

---

## 🐛 故障排查

### 问题 1: AI 分析返回格式错误

**原因**：AI 返回的 JSON 可能包含 markdown 代码块

**解决**：代码已处理，会自动提取 JSON 部分

### 问题 2: 分析速度慢

**原因**：每条推文都需要调用 AI API

**解决**：
- 使用批量分析（未来实现）
- 增加并发数（注意 API 限制）
- 缓存已分析结果

### 问题 3: 分析准确性不高

**原因**：Prompt 需要优化

**解决**：
- 查看实际分析结果
- 调整 Prompt 模板
- 增加示例数据

---

## 📚 相关文档

- `WEB3_ANALYSIS_DESIGN.md` - 完整设计方案
- `server/app.py` - API 实现代码
- `scripts/analyze-web3-tweets.ts` - 批量分析脚本

---

## 🎯 快速开始

1. **重启服务器**（创建新表）
2. **获取 token**（登录 Dashboard）
3. **运行分析**：
   ```bash
   export AUTH_TOKEN="your_token"
   bun run scripts/analyze-web3-tweets.ts sentiment 7
   ```

现在就可以开始分析你的 Web3 推文了！🚀

