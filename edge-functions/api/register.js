const bcrypt = require('bcrypt');
const USER_KEY_PREFIX = 'user_';

// 新规则标准导出，直接用绑定名my_kv
export async function onRequest({ request }) {
    if (request.method !== 'POST') {
        return new Response('仅支持POST请求！', { status: 405 });
    }

    try {
        const { username, password } = await request.json();
        if (!username || !password || password.length < 6) {
            return new Response('账号不能为空，密码至少6位！', { 
                status: 400,
                headers: { 'Content-Type': 'application/json;charset=utf-8' }
            });
        }

        const userKey = `${USER_KEY_PREFIX}${username}`;
        // 直接用绑定名my_kv调用get，无需获取实例
        const existingPwd = await my_kv.get(userKey);
        if (existingPwd) {
            return new Response('账号已存在！', { 
                status: 409,
                headers: { 'Content-Type': 'application/json;charset=utf-8' }
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // 直接用绑定名my_kv调用put
        await my_kv.put(userKey, hashedPassword);

        return new Response(JSON.stringify({ success: true }), {
            status: 201,
            headers: { 'Content-Type': 'application/json;charset=utf-8' }
        });

    } catch (error) {
        console.error('注册接口异常：', error);
        return new Response('服务器内部错误！', { 
            status: 500,
            headers: { 'Content-Type': 'application/json;charset=utf-8' }
        });
    }
}
