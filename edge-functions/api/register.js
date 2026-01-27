// 用户key前缀，避免KV数据冲突
const USER_KEY_PREFIX = 'user_';

// EdgeOne 新规则标准导出
export async function onRequest({ request }) {
    // 仅允许POST请求
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ msg: '仅支持POST请求' }), {
            status: 405,
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'Allow': 'POST'
            }
        });
    }

    try {
        // 解析并校验请求体
        let requestData;
        try {
            requestData = await request.json();
        } catch (e) {
            return new Response(JSON.stringify({ msg: '请求体必须为标准JSON' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json;charset=utf-8' }
            });
        }
        const { username, password } = requestData || {};
        if (!username || !password || password.length < 6) {
            return new Response(JSON.stringify({ msg: '账号不能为空，密码至少6位' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json;charset=utf-8' }
            });
        }

        // 拼接用户唯一Key
        const userKey = `${USER_KEY_PREFIX}${username}`;
        // 直接调用EdgeOne绑定的KV变量（替换为你的实际KV变量名！）
        const existingUser = await my_kv.get(userKey);
        
        // 校验账号是否已存在
        if (existingUser) {
            return new Response(JSON.stringify({ msg: '账号已存在，请更换账号' }), {
                status: 409,
                headers: { 'Content-Type': 'application/json;charset=utf-8' }
            });
        }

        // 原生Web Crypto API：密码哈希加密（无需任何依赖，EdgeOne原生支持）
        const hashedPassword = await hashPassword(password);
        // 写入KV存储（存储加密后的密码）
        await my_kv.put(userKey, hashedPassword);

        // 注册成功响应
        return new Response(JSON.stringify({ msg: '注册成功，即将跳转登录页', success: true }), {
            status: 201,
            headers: { 'Content-Type': 'application/json;charset=utf-8' }
        });

    } catch (error) {
        console.error('注册接口异常：', error);
        return new Response(JSON.stringify({ msg: '服务器内部错误，请稍后再试' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json;charset=utf-8' }
        });
    }
}

// 密码哈希加密核心函数（Web Crypto API，原生无依赖）
async function hashPassword(password) {
    // 1. 将密码转为UTF-8编码的二进制数据
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    // 2. 生成SHA-256哈希值（二进制）
    const hash = await crypto.subtle.digest('SHA-256', data);
    // 3. 将二进制哈希值转为十六进制字符串（便于存储和后续校验）
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
