import { XAuthClient } from "./utils.ts";
// @ts-ignore
import { get } from "lodash";
import fs from "fs-extra";

/**
 * 获取当前账号的关注列表并保存到 accounts 文件夹
 */
async function fetchFollowingList() {
  const client = await XAuthClient();

  console.log("📥 开始获取当前账号的关注列表...\n");
  
  // 从 client 的 cookie 中获取当前用户的 userId
  // twid cookie 格式: "u%3D<userId>" 或 "u=<userId>"
  let currentUserId = "";
  
  try {
    // @ts-ignore - 使用 _xClient 附加的 _cookies 属性
    const cookies = (client as any)._cookies || {};
    const twid = cookies.twid || "";
    
    if (twid) {
      // 解析 twid: "u%3D958932716304531456" -> "958932716304531456"
      const match = twid.match(/u(?:%3D|=)(\d+)/);
      if (match && match[1]) {
        currentUserId = match[1];
        console.log(`✅ 当前用户 ID: ${currentUserId}\n`);
      }
    }
    
    if (!currentUserId) {
      throw new Error("无法从 Cookie 中获取当前用户 ID");
    }
  } catch (error: any) {
    console.error("❌ 获取当前用户 ID 失败:", error.message);
    throw error;
  }

  // 获取关注列表
  let cursor: string | undefined = undefined;
  let allFollowing: any[] = [];
  let pageCount = 0;

  try {
    do {
      try {
        // 使用从 cookie 中提取的当前用户 ID
        const params: any = {
          userId: currentUserId,
          count: 100,
        };

        if (cursor) {
          params.cursor = cursor;
        }

        const response = await client.getUserListApi().getFollowing(params);

        // 从响应中提取用户数据
        const users = response.data.data || [];
        
        if (users.length > 0) {
          allFollowing.push(...users);
          pageCount++;
          console.log(`📄 第 ${pageCount} 页: 获取到 ${users.length} 个用户`);
        } else {
          console.log(`📄 第 ${pageCount + 1} 页: 没有更多用户`);
        }

        // 获取下一页的 cursor
        // @ts-ignore
        // cursor.bottom 是一个对象，需要取其中的 value 字段
        const bottomCursor = response.data.cursor?.bottom;
        cursor = bottomCursor?.value || undefined;
        
        if (cursor) {
          console.log(`   🔍 下一页 Cursor: ${cursor}`);
        }
        
        // 避免请求过快
        if (cursor) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        console.error(`❌ 获取关注列表时出错:`, error.message);
        console.error(`   完整错误:`, error);
        if (error.response) {
          console.error(`   状态码: ${error.response.status}`);
          console.error(`   响应:`, JSON.stringify(error.response.data, null, 2));
        }
        break;
      }
    } while (cursor);

    console.log(`\n✅ 总共获取到 ${allFollowing.length} 个关注用户\n`);

    // 确保 accounts 文件夹存在
    if (!fs.existsSync("./accounts")) {
      fs.mkdirSync("./accounts", { recursive: true });
    }

    // 保存每个用户的完整信息到 accounts 文件夹
    let savedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;

    for (const userData of allFollowing) {
      // 从 UserApiUtilsData 中提取用户对象
      // userData 的结构可能是 { raw: UserResults, user: User | undefined }
      // 我们需要从 raw.result 中获取完整的用户对象
      let userResult = get(userData, "raw.result", null);
      
      // 如果 raw.result 不存在，尝试其他路径
      if (!userResult) {
        userResult = get(userData, "user", null);
      }
      
      // 如果还是没有，尝试直接从 userData 获取
      if (!userResult && userData && typeof userData === 'object') {
        // 检查是否已经是用户对象格式
        if (userData.legacy && userData.restId) {
          userResult = userData;
        }
      }
      
      if (!userResult) {
        console.log(`⚠️  跳过无效用户数据`);
        skippedCount++;
        continue;
      }

      const screenName = get(userResult, "legacy.screenName", "");
      
      if (!screenName) {
        console.log(`⚠️  跳过无效用户数据（无 screenName）`);
        skippedCount++;
        continue;
      }

      const filePath = `./accounts/${screenName}.json`;
      const fileExists = fs.existsSync(filePath);
      
      // 如果文件已存在，可以选择更新或跳过
      if (fileExists) {
        // 更新现有文件（保持最新数据）
        fs.writeFileSync(filePath, JSON.stringify(userResult, null, 2));
        console.log(`🔄 ${screenName} 已更新`);
        updatedCount++;
      } else {
        // 保存新用户数据，保持原有格式（与 accounts 文件夹中现有文件格式一致）
        // userResult 应该包含完整的用户对象，包括 typename, legacy, restId 等字段
        fs.writeFileSync(filePath, JSON.stringify(userResult, null, 2));
        console.log(`✅ ${screenName} 已保存`);
        savedCount++;
      }
      
      // 避免写入过快
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    console.log(`\n📊 统计:`);
    console.log(`   - 新保存: ${savedCount} 个用户`);
    console.log(`   - 已更新: ${updatedCount} 个用户`);
    console.log(`   - 已跳过: ${skippedCount} 个用户`);
    console.log(`   - 总计: ${allFollowing.length} 个用户`);
  } catch (error: any) {
    console.error("❌ 处理关注列表时出错:", error.message);
    if (error.response) {
      console.error(`   状态码: ${error.response.status}`);
      console.error(`   响应:`, JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

// 运行脚本
fetchFollowingList().catch(console.error);
