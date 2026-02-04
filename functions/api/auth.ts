// functions/api/auth.ts
// Cloudflare Pages Functions - GitHub OAuth for Decap CMS

interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

// GitHub OAuth URLs
const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';

// 認証開始（/api/auth にアクセスした場合）
export const onRequestGet = async (context: any) => {
  const url = new URL(context.request.url);
  
  // コールバックの場合
  if (url.searchParams.has('code')) {
    return handleCallback(context);
  }
  
  // 認証開始
  const { GITHUB_CLIENT_ID } = context.env;
  
  if (!GITHUB_CLIENT_ID) {
    return new Response('GITHUB_CLIENT_ID is not configured', { status: 500 });
  }
  
  const scope = 'repo,user';
  const redirectUri = `${url.origin}/api/auth`;
  
  const authUrl = new URL(GITHUB_AUTHORIZE_URL);
  authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('state', crypto.randomUUID());
  
  return Response.redirect(authUrl.toString(), 302);
};

// コールバック処理
async function handleCallback(context: any): Promise<Response> {
  const url = new URL(context.request.url);
  const code = url.searchParams.get('code');
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = context.env;
  
  if (!code) {
    return new Response('Missing code parameter', { status: 400 });
  }
  
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return new Response('GitHub OAuth is not configured', { status: 500 });
  }
  
  try {
    // アクセストークン取得
    const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    
    const tokenData = await tokenResponse.json() as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };
    
    if (tokenData.error || !tokenData.access_token) {
      console.error('Token error:', tokenData);
      return new Response(`OAuth error: ${tokenData.error_description || tokenData.error}`, { status: 400 });
    }
    
    const accessToken = tokenData.access_token;
    
    // ユーザー情報取得（ログ用）
    const userResponse = await fetch(GITHUB_USER_URL, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'Decap-CMS-OAuth',
      },
    });
    
    const userData = await userResponse.json() as { login?: string };
    console.log(`GitHub OAuth success: ${userData.login}`);

    // Decap CMS が期待する postMessage 形式（文字列）をサーバー側で生成して埋め込みます。
    // 例: authorization:github:success:{"token":"...","provider":"github"}
    const decapMessage = `authorization:github:success:${JSON.stringify({
      token: accessToken,
      provider: 'github',
    })}`;
    
    // Decap CMS用のコールバックHTML
    const html = `
<!doctype html>
<html>
<head>
  <title>認証完了</title>
</head>
<body>
  <script>
    (function() {
      function receiveMessage(e) {
        console.log("receiveMessage %o", e);
        window.opener.postMessage(
          ${JSON.stringify(decapMessage)},
          e.origin
        );
        window.close();
      }
      window.addEventListener("message", receiveMessage, false);
      window.opener.postMessage("authorizing:github", "*");
    })();
  </script>
  <p>認証処理中...</p>
</body>
</html>
    `;
    
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
    
  } catch (error) {
    console.error('OAuth error:', error);
    return new Response(`Internal server error: ${error}`, { status: 500 });
  }
}

// POSTリクエストのハンドリング（Decap CMSの一部バージョンで必要）
export const onRequestPost = async (context: any) => {
  return onRequestGet(context);
};
