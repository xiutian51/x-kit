/**
 * Cookie 解析工具
 * 用于解析浏览器复制的完整 Cookie 字符串
 */

/**
 * 解析 Cookie 字符串为对象
 * @param cookieString - 完整的 Cookie 字符串（从浏览器复制）
 * @returns Cookie 对象
 */
export function parseCookieString(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  
  // 移除可能的换行和多余空格
  const cleaned = cookieString.trim().replace(/\s+/g, ' ');
  
  // 按分号分割
  cleaned.split(';').forEach(cookie => {
    const trimmed = cookie.trim();
    if (!trimmed) return;
    
    const [name, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('='); // 处理值中包含 = 的情况
    
    if (name && value) {
      // 移除值的引号（如果有）
      cookies[name.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
  });
  
  return cookies;
}

/**
 * 从 Cookie 字符串中提取 auth_token
 * @param cookieString - 完整的 Cookie 字符串
 * @returns auth_token 值
 */
export function extractAuthToken(cookieString: string): string | null {
  const cookies = parseCookieString(cookieString);
  return cookies.auth_token || null;
}

/**
 * 从 Cookie 字符串中提取 ct0 (CSRF token)
 * @param cookieString - 完整的 Cookie 字符串
 * @returns ct0 值
 */
export function extractCt0(cookieString: string): string | null {
  const cookies = parseCookieString(cookieString);
  return cookies.ct0 || null;
}

/**
 * 提取关键 Cookie（auth_token 和 ct0）
 * @param cookieString - 完整的 Cookie 字符串
 * @returns 包含 auth_token 和 ct0 的对象
 */
export function extractKeyCookies(cookieString: string): {
  auth_token: string | null;
  ct0: string | null;
} {
  const cookies = parseCookieString(cookieString);
  return {
    auth_token: cookies.auth_token || null,
    ct0: cookies.ct0 || null,
  };
}

// 如果直接运行此文件，可以测试解析
if (import.meta.main) {
  const testCookie = `kdt=3r31WYvd4qNUBudUpMxe2XI0FWLIn9SQZPff6MIE; g_state={"i_l":0}; __cuid=0d0c8038d99f45bba8a7447212a4e390; personalization_id="v1_rS8354pynIpFgeir32fN3Q=="; d_prefs=MToxLGNvbnNlbnRfdmVyc2lvbjoyLHRleHRfdmVyc2lvbjoxMDAw; first_ref=https%3A%2F%2Fx.com%2Fhome; ads_prefs="HBERAAA="; auth_multi="1142432712872976385:655e21f757857c454dcbfea1619b4ca8c065e131"; auth_token=c6458d4841dc6d8289651c3b6e6b9c26d904b062; guest_id_ads=v1%3A176365021370178887; guest_id_marketing=v1%3A176365021370178887; guest_id=v1%3A176365021370178887; twid=u%3D958932716304531456; ct0=381d858c3888c49643de120fc8a6e9832a55c09be1f501df98dbaa4296b4606c516e8f6cfa1e2ff80cfc8fada8a07b017a831fd1de1ab7ae2db1ed73494f5eef46cb13b363c09dc5dd691a250e95e731`;
  
  console.log('解析的 Cookie:');
  console.log(JSON.stringify(parseCookieString(testCookie), null, 2));
  
  console.log('\n关键 Cookie:');
  console.log(JSON.stringify(extractKeyCookies(testCookie), null, 2));
  
  console.log('\n提取的 auth_token:');
  console.log(extractAuthToken(testCookie));
  
  console.log('\n提取的 ct0:');
  console.log(extractCt0(testCookie));
}

