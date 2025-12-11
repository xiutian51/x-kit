import { TwitterOpenApi } from "twitter-openapi-typescript";
import axios from "axios";
import { TwitterApi } from 'twitter-api-v2';

export const _xClient = async (TOKEN: string) => {
  // 验证 Token 是否为空
  if (!TOKEN || TOKEN.trim() === '') {
    throw new Error('❌ AUTH_TOKEN 未配置或为空！\n请检查 GitHub Secrets 中的 AUTH_TOKEN 是否正确配置。');
  }
  
  console.log("🚀 ~ const_xClient= ~ TOKEN:", TOKEN.substring(0, 10) + '...' + TOKEN.substring(TOKEN.length - 5))
  console.log("🌐 正在连接 x.com，请稍候...")
  
  try {
    const resp = await axios.get("https://x.com/manifest.json", {
      headers: {
        cookie: `auth_token=${TOKEN}`,
      },
      maxRedirects: 5, // 限制重定向次数，避免循环
      timeout: 30000, // 30秒超时
    });
  
    console.log("✅ 成功连接到 x.com")
    
    const resCookie = resp.headers["set-cookie"] as string[];
    const cookieObj = resCookie.reduce((acc: Record<string, string>, cookie: string) => {
      const [name, value] = cookie.split(";")[0].split("=");
      acc[name] = value;
      return acc;
    }, {});

    console.log("🚀 ~ cookieObj ~ cookieObj:", JSON.stringify(cookieObj, null, 2))

    const api = new TwitterOpenApi();
    const fullCookies = {...cookieObj, auth_token: TOKEN};
    const client = await api.getClientFromCookies(fullCookies);
    // 将 cookies 附加到 client 对象上，方便后续使用
    (client as any)._cookies = fullCookies;
    return client;
  } catch (error: any) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error('❌ 连接超时！\n' +
        '可能原因：\n' +
        '1. 需要配置代理访问 x.com（在中国大陆必需）\n' +
        '2. 网络连接不稳定\n' +
        '3. x.com 服务暂时不可用\n\n' +
        '建议：检查网络连接或配置 HTTP_PROXY/HTTPS_PROXY 环境变量');
    } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
      throw new Error('❌ 无法解析域名 x.com！\n' +
        '可能原因：\n' +
        '1. DNS 解析失败\n' +
        '2. 需要配置代理（在中国大陆必需）\n' +
        '3. 网络连接问题\n\n' +
        '建议：检查网络连接或配置代理');
    } else {
      throw new Error(`❌ 连接 x.com 失败: ${error.message}\n` +
        '请检查：\n' +
        '1. 网络连接是否正常\n' +
        '2. 是否需要配置代理\n' +
        '3. AUTH_TOKEN 是否有效');
    }
  }
};

export const xGuestClient = () => _xClient(process.env.GET_ID_X_TOKEN!);
export const XAuthClient = () => _xClient(process.env.AUTH_TOKEN!);


export const login = async (AUTH_TOKEN: string) => {
  const resp = await axios.get("https://x.com/manifest.json", {
    headers: {
      cookie: `auth_token=${AUTH_TOKEN}`,
    },
  });
  
  const resCookie = resp.headers["set-cookie"] as string[];
  const cookie = resCookie.reduce((acc: Record<string, string>, cookie: string) => {
    const [name, value] = cookie.split(";")[0].split("=");
    acc[name] = value;
    return acc;
  }, {});
  cookie.auth_token = AUTH_TOKEN;

  const api = new TwitterOpenApi();
  const client = await api.getClientFromCookies(cookie);

  const plugin = {
    onBeforeRequest: async (params: any) => {
      params.computedParams.headers = {
        ...params.computedParams.headers,
        ...client.config.apiKey,
        'x-csrf-token': cookie.ct0,
        'x-twitter-auth-type': 'OAuth2Session',
        authorization: `Bearer ${TwitterOpenApi.bearer}`,
        cookie: api.cookieEncode(cookie),
      };
      params.requestOptions.headers = {
        ...params.requestOptions.headers,
        ...client.config.apiKey,
        'x-csrf-token': cookie.ct0,
        'x-twitter-auth-type': 'OAuth2Session',
        authorization: `Bearer ${TwitterOpenApi.bearer}`,
        cookie: api.cookieEncode(cookie),
      };
    },
  };

  const legacy = new TwitterApi('_', { plugins: [plugin] });

  return { client, legacy };
}
