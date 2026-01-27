// 内置依赖，无需额外安装
const bcrypt = require('bcrypt');

// KV实例名（必须和注册接口一致：user-kv）
const KV_INSTANCE = 'user-kv';
// 用户key前缀，和注册接口保持一致
const USER_KEY_PREFIX = 'user_';

// Edge Function标准导出（固定写法）
addEventListener('fetch', event => {
    event.respondWith(handleLogin(event.request));
});

// 登录核心逻辑
async function handleLogin(req) {
    // 仅支持POST请求
    if (req.method !== 'POST') {
        return new Response('仅支持POST请求！', { status: 405 });
    }

    try {
        // 接收前端传递的账号密码
        const { username, password } = await req.json();

        // 基础参数校验
        if (!username || !password) {
            return new Response('账号密码不能为空！', { status: 400 });
        }

        // 1. 打开KV实例（关键：必须先在控制台绑定）
        const kv = await edgeone.kv.get(KV_INSTANCE);
        if (!kv) {
            return new Response('KV数据库连接失败！', { status: 500 });
        }

        // 2. 拼接KV的key，查询用户加密密码
        const userKey = `${USER_KEY_PREFIX}${username}`;
        const hashedPassword = await kv.get(userKey);
        
        // 无数据 = 账号未注册
        if (!hashedPassword) {
            return new Response('账号未注册！', { status: 404 });
        }

        // 3. 校验密码（加密后对比，防止明文泄露）
        const passwordMatch = await bcrypt.compare(password, hashedPassword);
        if (!passwordMatch) {
            return new Response('账号或密码错误！', { status: 401 });
        }

        // 登录成功响应，返回用户名
        return new Response(JSON.stringify({
            success: true,
            username: username
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json;charset=utf-8' }
        });

    } catch (error) {
        console.error('登录接口异常：', error);
        return new Response('服务器内部错误！', { status: 500 });
    }
}