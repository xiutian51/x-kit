/**
 * 增强版 Dashboard 生成脚本
 * 包含更多功能和更好的可视化效果
 */

import fs from 'fs-extra';
import dayjs from 'dayjs';
import { readdir } from 'fs/promises';

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
 * 生成增强版 Dashboard HTML
 */
async function generateDashboard() {
  // 读取所有推文文件
  const tweetFiles = (await readdir('tweets'))
    .filter(file => file.endsWith('.json'))
    .map(file => `tweets/${file}`);
  const allTweets: TweetData[] = [];
  
  for (const file of tweetFiles) {
    try {
      const content = await fs.readJSON(file);
      if (Array.isArray(content)) {
        allTweets.push(...content);
      }
    } catch (error) {
      console.error(`Error reading ${file}:`, error);
    }
  }

  // 统计信息
  const totalTweets = allTweets.length;
  const uniqueUsers = new Set(allTweets.map(t => t.user.screenName)).size;
  const totalImages = allTweets.filter(t => t.images.length > 0).length;
  const totalVideos = allTweets.filter(t => t.videos.length > 0).length;
  
  // 按用户统计
  const userStats = new Map<string, { count: number; user: TweetData['user'] }>();
  allTweets.forEach(tweet => {
    const username = tweet.user.screenName;
    if (!userStats.has(username)) {
      userStats.set(username, { count: 0, user: tweet.user });
    }
    userStats.get(username)!.count++;
  });

  // 按日期统计
  const dateStats = new Map<string, number>();
  tweetFiles.forEach(file => {
    const match = file.match(/(\d{4}-\d{2}-\d{2})\.json$/);
    if (match) {
      const date = match[1];
      try {
        const content = fs.readJSONSync(file);
        dateStats.set(date, Array.isArray(content) ? content.length : 0);
      } catch (error) {
        dateStats.set(date, 0);
      }
    }
  });

  // 最近推文（最新10条）
  const recentTweets = allTweets.slice(0, 10);

  // 生成 HTML
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>X-Kit Dashboard - 推文数据可视化</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      color: #333;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    
    header {
      background: white;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      margin-bottom: 30px;
      text-align: center;
    }
    
    h1 {
      color: #667eea;
      font-size: 2.5em;
      margin-bottom: 10px;
    }
    
    .subtitle {
      color: #666;
      font-size: 1.1em;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .stat-card {
      background: white;
      padding: 25px;
      border-radius: 15px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      text-align: center;
      transition: transform 0.3s;
    }
    
    .stat-card:hover {
      transform: translateY(-5px);
    }
    
    .stat-value {
      font-size: 2.5em;
      font-weight: bold;
      color: #667eea;
      margin-bottom: 10px;
    }
    
    .stat-label {
      color: #666;
      font-size: 1em;
    }
    
    .section {
      background: white;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 1.8em;
      color: #333;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 3px solid #667eea;
    }
    
    .search-box {
      margin-bottom: 20px;
      padding: 15px;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      font-size: 1em;
      width: 100%;
      max-width: 400px;
    }
    
    .search-box:focus {
      outline: none;
      border-color: #667eea;
    }
    
    .user-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 15px;
    }
    
    .user-card {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 10px;
      border-left: 4px solid #667eea;
      transition: all 0.3s;
      cursor: pointer;
    }
    
    .user-card:hover {
      background: #e9ecef;
      transform: translateX(5px);
    }
    
    .user-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    
    .user-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
    }
    
    .user-info h3 {
      color: #333;
      font-size: 1.1em;
      margin-bottom: 5px;
    }
    
    .user-info .username {
      color: #667eea;
      font-size: 0.9em;
    }
    
    .user-stats {
      display: flex;
      gap: 15px;
      margin-top: 10px;
      font-size: 0.9em;
      color: #666;
    }
    
    .tweet-count {
      background: #667eea;
      color: white;
      padding: 5px 10px;
      border-radius: 20px;
      font-weight: bold;
    }
    
    .chart-container {
      margin-top: 20px;
      height: 400px;
      position: relative;
    }
    
    .tweet-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    
    .tweet-item {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 10px;
      border-left: 4px solid #667eea;
    }
    
    .tweet-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    
    .tweet-text {
      color: #333;
      line-height: 1.6;
      margin-bottom: 10px;
    }
    
    .tweet-link {
      color: #667eea;
      text-decoration: none;
      font-size: 0.9em;
    }
    
    .tweet-link:hover {
      text-decoration: underline;
    }
    
    .footer {
      text-align: center;
      color: white;
      padding: 20px;
      margin-top: 30px;
    }
    
    .last-update {
      color: rgba(255,255,255,0.8);
      font-size: 0.9em;
      margin-top: 10px;
    }
    
    .hidden {
      display: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📊 X-Kit Dashboard</h1>
      <p class="subtitle">推文数据可视化分析</p>
    </header>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${totalTweets.toLocaleString()}</div>
        <div class="stat-label">总推文数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${uniqueUsers}</div>
        <div class="stat-label">用户数量</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalImages}</div>
        <div class="stat-label">包含图片的推文</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalVideos}</div>
        <div class="stat-label">包含视频的推文</div>
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">📈 每日推文统计</h2>
      <div class="chart-container">
        <canvas id="tweetChart"></canvas>
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">👥 用户活跃度排行</h2>
      <input type="text" class="search-box" id="searchInput" placeholder="搜索用户...">
      <div class="user-list" id="userList">
        ${Array.from(userStats.entries())
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 50)
          .map(([username, { count, user }]) => `
            <div class="user-card" data-name="${escapeHtml(user.name.toLowerCase())}" data-username="${username.toLowerCase()}">
              <div class="user-header">
                <img src="${user.profileImageUrl}" alt="${escapeHtml(user.name)}" class="user-avatar" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ccircle cx=%2250%22 cy=%2250%22 r=%2240%22 fill=%22%23667eea%22/%3E%3Ctext x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2240%22%3E${username[0].toUpperCase()}%3C/text%3E%3C/svg%3E'">
                <div class="user-info">
                  <h3>${escapeHtml(user.name)}</h3>
                  <div class="username">@${username}</div>
                </div>
              </div>
              <div class="user-stats">
                <span class="tweet-count">${count} 条推文</span>
                <span>👥 ${user.followersCount.toLocaleString()}</span>
                <span>👤 ${user.friendsCount.toLocaleString()}</span>
              </div>
            </div>
          `)
          .join('')}
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">📝 最新推文</h2>
      <div class="tweet-list">
        ${recentTweets.map(tweet => `
          <div class="tweet-item">
            <div class="tweet-header">
              <img src="${tweet.user.profileImageUrl}" alt="${escapeHtml(tweet.user.name)}" class="user-avatar" style="width: 40px; height: 40px;">
              <div>
                <strong>${escapeHtml(tweet.user.name)}</strong>
                <span class="username">@${tweet.user.screenName}</span>
              </div>
            </div>
            <div class="tweet-text">${escapeHtml(tweet.fullText)}</div>
            <a href="${tweet.tweetUrl}" target="_blank" class="tweet-link">查看原文 →</a>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="footer">
      <p>Generated by X-Kit Dashboard</p>
      <p class="last-update">最后更新: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}</p>
    </div>
  </div>
  
  <script>
    // Chart.js 配置
    const ctx = document.getElementById('tweetChart').getContext('2d');
    const dateData = ${JSON.stringify(Array.from(dateStats.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-30))};
    
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: dateData.map(([date]) => date.split('-').slice(1).join('/')),
        datasets: [{
          label: '推文数量',
          data: dateData.map(([, count]) => count),
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
    
    // 搜索功能
    const searchInput = document.getElementById('searchInput');
    const userList = document.getElementById('userList');
    const userCards = userList.querySelectorAll('.user-card');
    
    searchInput.addEventListener('input', (e) => {
      const keyword = e.target.value.toLowerCase();
      userCards.forEach(card => {
        const name = card.getAttribute('data-name');
        const username = card.getAttribute('data-username');
        if (name.includes(keyword) || username.includes(keyword)) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
    
    // 用户卡片点击跳转
    userCards.forEach(card => {
      card.addEventListener('click', () => {
        const username = card.querySelector('.username').textContent.replace('@', '');
        window.open(\`https://x.com/\${username}\`, '_blank');
      });
    });
  </script>
</body>
</html>`;

  // 保存 HTML 文件
  const outputPath = 'dashboard/index.html';
  await fs.ensureDir('dashboard');
  await fs.writeFile(outputPath, html);
  
  console.log(`✅ Dashboard 已生成: ${outputPath}`);
  console.log(`📊 统计信息:`);
  console.log(`   - 总推文数: ${totalTweets}`);
  console.log(`   - 用户数量: ${uniqueUsers}`);
  console.log(`   - 包含图片: ${totalImages}`);
  console.log(`   - 包含视频: ${totalVideos}`);
}

/**
 * HTML 转义函数
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// 运行生成
if (import.meta.main) {
  generateDashboard().catch(console.error);
}

