import { TwitterOpenApi } from "twitter-openapi-typescript";
import axios from "axios";
import { TwitterApi } from 'twitter-api-v2';

export const _xClient = async (TOKEN: string) => {
  // 验证 Token 是否为空
  if (!TOKEN || TOKEN.trim() === '') {
    throw new Error('❌ AUTH_TOKEN 未配置或为空！\n请检查 GitHub Secrets 中的 AUTH_TOKEN 是否正确配置。');
  }
  
  console.log("🚀 ~ const_xClient= ~ TOKEN:", TOKEN.substring(0, 10) + '...' + TOKEN.substring(TOKEN.length - 5))
  const resp = await axios.get("https://x.com/manifest.json", {
    headers: {
      cookie: `auth_token=${TOKEN}`,
    },
    maxRedirects: 5, // 限制重定向次数，避免循环
  });
  
  const resCookie = resp.headers["set-cookie"] as string[];
  const cookieObj = resCookie.reduce((acc: Record<string, string>, cookie: string) => {
    const [name, value] = cookie.split(";")[0].split("=");
    acc[name] = value;
    return acc;
  }, {});

  console.log("🚀 ~ cookieObj ~ cookieObj:", JSON.stringify(cookieObj, null, 2))

  const api = new TwitterOpenApi();
  const client = await api.getClientFromCookies({...cookieObj, auth_token: TOKEN});
  return client;
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
