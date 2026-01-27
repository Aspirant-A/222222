// 内置依赖，无需额外安装
const bcrypt = require('bcrypt');

// KV实例名（必须和EdgeOne控制台创建的一致：user-kv）
const KV_INSTANCE = 'user-kv';
// 用户key前缀，避免KV数据冲突
const USER_KEY_PREFIX = 'user_';

// Edge Function标准导出（固定写法）
addEventListener('fetch', event => {
    event.respondWith(handleRegister(event.request));
});

// 注册核心逻辑
async function handleRegister(req) {
    // 仅支持POST请求
    if (req.method !== 'POST') {
        return new Response('仅支持POST请求！', { status: 405 });
    }

    try {
        // 接收前端传递的账号密码
        const { username, password } = await req.json();

        // 基础参数校验
        if (!username || !password || password.length < 6) {
            return new Response('账号不能为空，密码至少6位！', { status: 400 });
        }

        // 1. 打开KV实例（关键：必须先在控制台绑定）
        const kv = await edgeone.kv.get(KV_INSTANCE);
        if (!kv) {
            return new Response('KV数据库连接失败！', { status: 500 });
        }

        // 2. 拼接KV的key，查询账号是否已存在
        const userKey = `${USER_KEY_PREFIX}${username}`;
        const existingPwd = await kv.get(userKey);
        if (existingPwd) {
            return new Response('账号已存在！', { status: 409 });
        }

        // 3. 密码加密（安全存储，防止明文泄露）
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. 存入KV数据库
        await kv.put(userKey, hashedPassword);

        // 注册成功响应
        return new Response(JSON.stringify({ success: true }), {
            status: 201,
            headers: { 'Content-Type': 'application/json;charset=utf-8' }
        });

    } catch (error) {
        console.error('注册接口异常：', error);
        return new Response('服务器内部错误！', { status: 500 });
    }
}