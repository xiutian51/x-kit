/**
 * 发送推文数据到 Flask 服务器
 * 在 GitHub Actions 中调用，将生成的 JSON 文件发送到服务器
 */

import fs from 'fs-extra';
import axios from 'axios';
import dayjs from 'dayjs';

interface TweetData {
  user: {
    screenName: string;
    name: string;
    profileImageUrl: string;
    description: string;
    followersCount: number;
    friendsCount: number;
    location: string;
  };
  images: string[];
  videos: string[];
  tweetUrl: string;
  fullText: string;
}

/**
 * 发送推文数据到服务器
 */
async function sendToServer() {
  // 从环境变量读取配置
  const apiUrl = process.env.FLASK_API_URL;
  const apiKey = process.env.FLASK_API_KEY;
  
  if (!apiUrl) {
    console.error('❌ 错误: FLASK_API_URL 环境变量未设置');
    process.exit(1);
  }
  
  if (!apiKey) {
    console.error('❌ 错误: FLASK_API_KEY 环境变量未设置');
    process.exit(1);
  }
  
  // 获取今天的日期
  const today = dayjs().format('YYYY-MM-DD');
  const jsonFile = `tweets/${today}.json`;
  
  // 检查文件是否存在
  if (!fs.existsSync(jsonFile)) {
    console.log(`ℹ️ 文件不存在: ${jsonFile}，跳过发送`);
    return;
  }
  
  try {
    // 读取 JSON 文件
    console.log(`📖 读取文件: ${jsonFile}`);
    const tweets: TweetData[] = await fs.readJSON(jsonFile);
    
    if (!Array.isArray(tweets) || tweets.length === 0) {
      console.log(`ℹ️ 文件为空或格式错误: ${jsonFile}，跳过发送`);
      return;
    }
    
    console.log(`📊 准备发送 ${tweets.length} 条推文数据`);
    
    // 构造请求数据
    const requestData = {
      date: today,
      source_file: `${today}.json`,
      tweets: tweets
    };
    
    // 发送到服务器
    console.log(`🚀 发送数据到: ${apiUrl}/api/tweets/upload`);
    const response = await axios.post(
      `${apiUrl}/api/tweets/upload`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        timeout: 30000  // 30秒超时
      }
    );
    
    if (response.data.success) {
      const { data } = response.data;
      console.log('✅ 数据发送成功！');
      console.log(`   - 总数: ${data.total}`);
      console.log(`   - 新增: ${data.new}`);
      console.log(`   - 重复: ${data.duplicates}`);
      console.log(`   - 错误: ${data.errors || 0}`);
    } else {
      console.error('❌ 服务器返回错误:', response.data.error);
      process.exit(1);
    }
    
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // 服务器返回了错误状态码
        console.error(`❌ 服务器错误 (${error.response.status}):`, error.response.data);
      } else if (error.request) {
        // 请求已发送但没有收到响应
        console.error('❌ 无法连接到服务器:', error.message);
        console.error('   请检查 FLASK_API_URL 是否正确，服务器是否运行');
      } else {
        // 请求配置错误
        console.error('❌ 请求配置错误:', error.message);
      }
    } else {
      console.error('❌ 发送数据时出错:', error);
    }
    process.exit(1);
  }
}

// 运行
if (import.meta.main) {
  sendToServer().catch(error => {
    console.error('❌ 执行失败:', error);
    process.exit(1);
  });
}

