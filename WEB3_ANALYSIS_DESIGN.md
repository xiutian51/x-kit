# Web3 加密货币智能分析系统设计方案

## 🎯 核心目标

从 follow 的人的推文中提炼：
1. **市场情绪**：看涨/看跌/中性，情绪强度
2. **共识**：多数人认同的观点和趋势
3. **分歧**：不同观点的对比和争议点
4. **赛道洞察**：不同加密货币赛道的讨论热度

---

## 📊 系统架构

```
数据采集层 → 数据存储层 → AI 分析层 → 可视化展示层
```

### 1. 数据采集层（已有基础）
- ✅ 推文抓取（fetch-tweets.ts）
- ✅ 用户信息收集
- ⚠️ 需要增强：Web3 关键词过滤、话题分类

(建立关键词表)

### 2. 数据存储层（需要扩展）
- ✅ 基础推文存储
- ⚠️ 需要新增：
  - 主题分类表
  - 情绪分析表
  - 观点提取表
  - 加密货币提及表

### 3. AI 分析层（需要新增）
- ✅ 已有通义千问集成
- ⚠️ 需要新增：
  - 推文分类（Web3/非Web3）
  - 情绪分析
  - 观点提取
  - 共识/分歧识别

### 4. 可视化展示层（需要扩展）
- ✅ 已有 Dashboard
- ⚠️ 需要新增：
  - 情绪趋势图
  - 共识/分歧对比
  - 赛道热度分析
  - 关键观点展示

---

## 🗄️ 数据库设计

### 新增表结构

#### 1. topics（主题分类表）
```sql
CREATE TABLE topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tweet_id INTEGER NOT NULL,
    category TEXT NOT NULL,  -- 'web3', 'defi', 'nft', 'gamefi', 'layer2', 'other'
    confidence REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tweet_id) REFERENCES tweets(id)
);
```

#### 2. sentiment_analysis（情绪分析表）
```sql
CREATE TABLE sentiment_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tweet_id INTEGER NOT NULL,
    sentiment TEXT NOT NULL,  -- 'bullish', 'bearish', 'neutral'
    score REAL DEFAULT 0.0,   -- -1.0 到 1.0
    confidence REAL DEFAULT 0.0,
    keywords TEXT,            -- JSON 数组，关键词
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tweet_id) REFERENCES tweets(id)
);
```

#### 3. crypto_mentions（加密货币提及表）
```sql
CREATE TABLE crypto_mentions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tweet_id INTEGER NOT NULL,
    symbol TEXT NOT NULL,     -- 'BTC', 'ETH', 'SOL', etc.
    context TEXT,             -- 提及的上下文
    sentiment TEXT,           -- 对该币的情绪
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tweet_id) REFERENCES tweets(id)
);
```

#### 4. insights（观点提取表）
```sql
CREATE TABLE insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tweet_id INTEGER NOT NULL,
    insight_type TEXT NOT NULL,  -- 'consensus', 'divergence', 'prediction', 'analysis'
    content TEXT NOT NULL,       -- 提取的观点内容
    supporting_tweets TEXT,      -- JSON 数组，支持该观点的推文ID
    opposing_tweets TEXT,        -- JSON 数组，反对该观点的推文ID
    confidence REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tweet_id) REFERENCES tweets(id)
);
```

#### 5. market_trends（市场趋势表）
```sql
CREATE TABLE market_trends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    overall_sentiment TEXT,      -- 'bullish', 'bearish', 'neutral'
    sentiment_score REAL,        -- 平均情绪分数
    top_topics TEXT,             -- JSON 数组，热门话题
    consensus_points TEXT,        -- JSON 数组，共识观点
    divergence_points TEXT,       -- JSON 数组，分歧点
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date)
);
```

---

## 🤖 AI 分析流程

### 阶段 1: 推文分类和过滤

**目标**：识别 Web3 相关推文

**Prompt 模板**：
```
请分析以下推文是否与 Web3/加密货币相关，并分类：

推文内容：{吴说获悉，根据 SoSoValue 数据，昨日（美东时间 12 月 4 日）Solana 现货 ETF 总净流入 459 万美元。昨日（美东时间 12 月 4 日）单日净流入最多的 SOL 现货 ETF 为 Fidelity SOL ETF FSOL，单日净流入 205 万美元，目前 FSOL 历史总净流入达 4292 万美元。https://t.co/uZ9Css0Zbm}

请返回 JSON 格式：
{
  "is_web3": true/false,
  "category": "defi|nft|gamefi|layer2|other",
  "confidence": 0.0-1.0,
  "keywords": ["关键词1", "关键词2"]
}


请分析以下推文是否与 Web3/加密货币相关，并分类：

推文内容：{在币圈AI和交易结合才是真实应用场景，Warden通过在前端集成了Hyperliquid打造了AI交易终端，可以将AI信号直接导入到了交易界面中，帮助用户完成币种基本面和K线分析，并且在空投方面可以一鱼两吃，除了获得Warden本身的积分外，因为集成了Hyperliquid所以也可以同步获得其对应激励，整体交易体验和Hyperliquid保持一致很丝滑，并且还多了AI分析的能力。
}

请返回 JSON 格式：
{
  "is_web3": true/false,
  "category": "defi|nft|gamefi|layer2|other",
  "confidence": 0.0-1.0,
  "keywords": ["关键词1", "关键词2"]
}
```

### 阶段 2: 情绪分析

**目标**：分析市场情绪

**Prompt 模板**：
```
分析以下关于加密货币的推文的情绪：

推文：{tweet_text}
作者：{user_name}

请返回 JSON：
{
  "sentiment": "bullish|bearish|neutral",
  "score": -1.0 到 1.0,
  "confidence": 0.0-1.0,
  "reasoning": "分析原因",
  "keywords": ["关键词"]
}
```

### 阶段 3: 观点提取

**目标**：提取关键观点

**Prompt 模板**：
```
从以下推文中提取关键观点：

推文：{tweet_text}
时间：{created_at}

请返回 JSON：
{
  "insights": [
    {
      "type": "consensus|divergence|prediction|analysis",
      "content": "观点内容",
      "confidence": 0.0-1.0
    }
  ],
  "mentioned_cryptos": ["BTC", "ETH"],
  "key_points": ["要点1", "要点2"]
}
```

### 阶段 4: 共识/分歧识别

**目标**：对比不同观点，识别共识和分歧

**Prompt 模板**：
```
分析以下推文集合，识别共识和分歧：

推文列表：
{tweets_json}

请返回 JSON：
{
  "consensus": [
    {
      "point": "共识观点",
      "support_count": 数量,
      "tweet_ids": [推文ID列表]
    }
  ],
  "divergence": [
    {
      "topic": "分歧话题",
      "viewpoints": [
        {
          "viewpoint": "观点1",
          "support_count": 数量,
          "tweet_ids": [推文ID列表]
        },
        {
          "viewpoint": "观点2",
          "support_count": 数量,
          "tweet_ids": [推文ID列表]
        }
      ]
    }
  ]
}
```

---

## 📈 分析维度

### 1. 市场情绪维度

- **整体情绪**：看涨/看跌/中性比例
- **情绪强度**：-1.0 到 1.0 的分数
- **情绪趋势**：时间序列变化
- **情绪分布**：不同用户的情绪分布

### 2. 共识维度

- **共识观点**：多数人认同的观点
- **共识强度**：支持度百分比
- **共识变化**：共识观点的演变
- **共识主题**：哪些话题形成共识

### 3. 分歧维度

- **分歧话题**：存在争议的话题
- **分歧观点**：不同的观点对比
- **分歧强度**：观点对立的程度
- **分歧趋势**：分歧是否在扩大或缩小

### 4. 赛道维度

- **赛道热度**：DeFi、NFT、GameFi、Layer2 等
- **赛道情绪**：各赛道的情绪分布
- **赛道趋势**：赛道热度的变化
- **跨赛道关联**：不同赛道的关联性

---

## 🎨 Dashboard 展示设计

### 1. 情绪仪表盘

- **整体情绪指标**：看涨/看跌/中性比例
- **情绪趋势图**：7天/30天情绪变化
- **情绪热力图**：不同时间段的情绪分布

### 2. 共识/分歧面板

- **共识观点列表**：按支持度排序
- **分歧话题对比**：正反观点对比
- **观点演变时间线**：共识/分歧的变化

### 3. 赛道分析

- **赛道热度排行**：各赛道讨论热度
- **赛道情绪对比**：各赛道情绪对比
- **赛道趋势图**：赛道热度变化

### 4. 关键洞察

- **今日洞察**：AI 提取的关键观点
- **市场预测**：基于讨论的预测
- **风险提示**：识别到的风险点



---

## 💡 技术要点

### 1. 关键词识别

使用预定义的 Web3 关键词库：
- 加密货币：BTC, ETH, SOL, BNB, etc.
- DeFi：Uniswap, Aave, Compound, etc.
- NFT：OpenSea, BAYC, etc.
- Layer2：Arbitrum, Optimism, Polygon, etc.

### 2. 批量分析优化

- 使用批处理，减少 API 调用
- 缓存分析结果
- 增量分析（只分析新推文）

### 3. 准确性提升

- 多轮分析验证
- 人工标注样本
- 持续优化 Prompt

