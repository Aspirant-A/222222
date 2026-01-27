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
        // 非空兜底，避免解构报错
        const { username, password } = requestData || {};
        if (!username || !password || password.length < 6) {
            return new Response(JSON.stringify({ msg: '账号不能为空，密码至少6位' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json;charset=utf-8' }
            });
        }

        // 拼接用户唯一Key
        const userKey = `${USER_KEY_PREFIX}${username}`;
        // 【关键】替换为你控制台的KV实际变量名！！！
        const existingUser = await my_kv.get(userKey);
        
        // 校验账号是否已存在
        if (existingUser) {
            return new Response(JSON.stringify({ msg: '账号已存在，请更换账号' }), {
                status: 409,
                headers: { 'Content-Type': 'application/json;charset=utf-8' }
            });
        }

        // 【去掉加密】直接将明文密码写入KV存储
        await my_kv.put(userKey, password);

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
