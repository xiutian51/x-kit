/**
 * Web3 推文批量分析脚本
 * 对数据库中的推文进行 Web3 分类、情绪分析和观点提取
 */

import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || ''; // 需要先登录获取 token

interface AnalysisResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * 分析单条推文
 */
async function analyzeTweet(tweetId: number, authToken: string): Promise<AnalysisResult> {
  try {
    const response = await axios.post(
      `${SERVER_URL}/api/web3/analyze-tweet`,
      { tweet_id: tweetId },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
}

/**
 * 批量分析推文
 */
async function batchAnalyzeTweets(
  days: number = 7,
  limit: number = 100,
  authToken: string
) {
  console.log(`\n🚀 开始批量分析最近 ${days} 天的推文（最多 ${limit} 条）...\n`);

  // 1. 获取推文列表（需要先实现这个 API，或者从数据库查询）
  // 这里假设有一个 API 可以获取未分析的推文
  // 实际使用时，你可能需要先查询数据库获取推文 ID 列表

  console.log('⚠️  注意：此脚本需要先实现获取推文列表的 API');
  console.log('   或者手动提供推文 ID 列表\n');
  
  // 示例：分析指定的推文 ID
  const tweetIds = [1, 2, 3]; // 替换为实际的推文 ID
  
  let successCount = 0;
  let failCount = 0;
  
  for (const tweetId of tweetIds) {
    console.log(`📊 分析推文 ID: ${tweetId}...`);
    const result = await analyzeTweet(tweetId, authToken);
    
    if (result.success) {
      successCount++;
      const data = result.data;
      console.log(`  ✅ 成功`);
      console.log(`     - Web3: ${data.is_web3 ? '是' : '否'}`);
      if (data.is_web3) {
        console.log(`     - 分类: ${data.category}`);
        console.log(`     - 情绪: ${data.sentiment} (${data.sentiment_score})`);
        console.log(`     - 提及币种: ${data.mentioned_cryptos?.join(', ') || '无'}`);
      }
    } else {
      failCount++;
      console.log(`  ❌ 失败: ${result.error}`);
    }
    
    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n📈 分析完成:`);
  console.log(`   - 成功: ${successCount}`);
  console.log(`   - 失败: ${failCount}`);
}

/**
 * 分析共识和分歧
 */
async function analyzeConsensusDivergence(
  days: number = 7,
  category?: string,
  authToken: string
) {
  console.log(`\n🔍 分析共识和分歧（最近 ${days} 天${category ? `，分类: ${category}` : ''}）...\n`);
  
  try {
    const response = await axios.post(
      `${SERVER_URL}/api/web3/consensus-divergence`,
      { days, category },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      const data = response.data.data;
      
      console.log('📊 共识观点:');
      if (data.consensus && data.consensus.length > 0) {
        data.consensus.forEach((item: any, index: number) => {
          console.log(`\n   ${index + 1}. ${item.point}`);
          console.log(`      支持数: ${item.support_count}`);
          console.log(`      置信度: ${(item.confidence * 100).toFixed(1)}%`);
        });
      } else {
        console.log('   （暂无共识观点）');
      }
      
      console.log('\n\n⚡ 分歧话题:');
      if (data.divergence && data.divergence.length > 0) {
        data.divergence.forEach((item: any, index: number) => {
          console.log(`\n   ${index + 1}. ${item.topic}`);
          console.log(`      分歧强度: ${(item.intensity * 100).toFixed(1)}%`);
          item.viewpoints.forEach((vp: any, vpIndex: number) => {
            console.log(`\n      观点 ${vpIndex + 1}: ${vp.viewpoint}`);
            console.log(`        支持数: ${vp.support_count}`);
            console.log(`        情绪: ${vp.sentiment}`);
          });
        });
      } else {
        console.log('   （暂无分歧话题）');
      }
      
      if (data.summary) {
        console.log('\n\n📝 总结:');
        console.log(`   ${data.summary}`);
      }
    } else {
      console.error(`❌ 分析失败: ${response.data.error}`);
    }
  } catch (error: any) {
    console.error(`❌ 请求失败: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * 获取市场情绪
 */
async function getMarketSentiment(
  days: number = 7,
  category?: string,
  authToken: string
) {
  console.log(`\n📈 获取市场情绪（最近 ${days} 天${category ? `，分类: ${category}` : ''}）...\n`);
  
  try {
    const params: any = { days };
    if (category) params.category = category;
    
    const response = await axios.get(
      `${SERVER_URL}/api/web3/market-sentiment`,
      {
        params,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    if (response.data.success) {
      const data = response.data.data;
      
      console.log(`整体情绪: ${data.overall_sentiment.toUpperCase()}`);
      console.log(`情绪分数: ${data.sentiment_score}`);
      console.log(`\n情绪分布:`);
      console.log(`  看涨: ${data.breakdown.bullish.count} (${data.breakdown.bullish.percentage}%)`);
      console.log(`  看跌: ${data.breakdown.bearish.count} (${data.breakdown.bearish.percentage}%)`);
      console.log(`  中性: ${data.breakdown.neutral.count} (${data.breakdown.neutral.percentage}%)`);
      console.log(`\n总推文数: ${data.total_tweets}`);
    } else {
      console.error(`❌ 获取失败: ${response.data.error}`);
    }
  } catch (error: any) {
    console.error(`❌ 请求失败: ${error.response?.data?.error || error.message}`);
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!AUTH_TOKEN) {
    console.error('❌ 请设置 AUTH_TOKEN 环境变量（需要先登录获取 token）');
    console.log('\n获取 token 方法:');
    console.log('1. 访问 Dashboard 登录');
    console.log('2. 在浏览器控制台运行: localStorage.getItem("authToken")');
    console.log('3. 设置环境变量: export AUTH_TOKEN="your_token"');
    process.exit(1);
  }
  
  switch (command) {
    case 'analyze':
      const days = parseInt(args[1]) || 7;
      const limit = parseInt(args[2]) || 100;
      await batchAnalyzeTweets(days, limit, AUTH_TOKEN);
      break;
      
    case 'consensus':
      const consensusDays = parseInt(args[1]) || 7;
      const category = args[2];
      await analyzeConsensusDivergence(consensusDays, category, AUTH_TOKEN);
      break;
      
    case 'sentiment':
      const sentimentDays = parseInt(args[1]) || 7;
      const sentimentCategory = args[2];
      await getMarketSentiment(sentimentDays, sentimentCategory, AUTH_TOKEN);
      break;
      
    default:
      console.log('使用方法:');
      console.log('  bun run scripts/analyze-web3-tweets.ts analyze [days] [limit]');
      console.log('  bun run scripts/analyze-web3-tweets.ts consensus [days] [category]');
      console.log('  bun run scripts/analyze-web3-tweets.ts sentiment [days] [category]');
      console.log('\n示例:');
      console.log('  bun run scripts/analyze-web3-tweets.ts analyze 7 100');
      console.log('  bun run scripts/analyze-web3-tweets.ts consensus 7 defi');
      console.log('  bun run scripts/analyze-web3-tweets.ts sentiment 7');
  }
}

main().catch(console.error);

