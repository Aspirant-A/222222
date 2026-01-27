// 内置bcrypt，无需安装
const bcrypt = require('bcrypt');
// 用户key前缀，避免KV数据冲突
const USER_KEY_PREFIX = 'user_';

// EdgeOne Pages 新规则：必须用 export async function onRequest 导出
export async function onRequest({ request }) {
    // 仅允许POST请求，非POST直接返回405（带Allow响应头，规范浏览器提示）
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ msg: '仅支持POST请求' }), {
            status: 405,
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'Allow': 'POST' // 明确告诉浏览器允许的请求方法
            }
        });
    }

    try {
        // 捕获JSON解析异常（防止前端请求体格式错误导致接口崩溃）
        let requestData;
        try {
            requestData = await request.json();
        } catch (e) {
            return new Response(JSON.stringify({ msg: '请求体格式错误，必须为标准JSON' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json;charset=utf-8' }
            });
        }

        // 解构参数并二次校验（防止参数为空）
        const { username, password } = requestData || {};
        if (!username || !password || password.length < 6) {
            return new Response(JSON.stringify({ msg: '账号不能为空，密码至少6位' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json;charset=utf-8' }
            });
        }

        // 拼接用户唯一Key
        const userKey = `${USER_KEY_PREFIX}${username}`;
        // 直接调用KV绑定变量名（替换为你的实际KV变量名！！！）
        const existingPwd = await my_kv.get(userKey);

        // 账号已存在校验
        if (existingPwd) {
            return new Response(JSON.stringify({ msg: '账号已存在，请换一个' }), {
                status: 409,
                headers: { 'Content-Type': 'application/json;charset=utf-8' }
            });
        }

        // 密码加密（10轮盐值，安全存储）
        const hashedPwd = await bcrypt.hash(password, 10);
        // 写入KV存储
        await my_kv.put(userKey, hashedPwd);

        // 注册成功响应
        return new Response(JSON.stringify({ msg: '注册成功', success: true }), {
            status: 201,
            headers: { 'Content-Type': 'application/json;charset=utf-8' }
        });

    } catch (error) {
        // 捕获所有未知异常，避免接口崩溃
        console.error('注册接口异常：', error);
        return new Response(JSON.stringify({ msg: '服务器内部错误，请稍后再试' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json;charset=utf-8' }
        });
    }
}
