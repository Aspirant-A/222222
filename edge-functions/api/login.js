// 用户key前缀，与注册接口保持一致
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
        if (!username || !password) {
            return new Response(JSON.stringify({ msg: '账号和密码不能为空' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json;charset=utf-8' }
            });
        }

        // 拼接用户唯一Key
        const userKey = `${USER_KEY_PREFIX}${username}`;
        // 【关键】替换为你控制台的KV实际变量名！！！
        const storedPwd = await my_kv.get(userKey);
        
        // 校验账号是否存在
        if (!storedPwd) {
            return new Response(JSON.stringify({ msg: '账号未注册，请先注册' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json;charset=utf-8' }
            });
        }

        // 【去掉加密校验】直接对比明文密码
        if (password !== storedPwd) {
            return new Response(JSON.stringify({ msg: '账号或密码错误' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json;charset=utf-8' }
            });
        }

        // 登录成功响应
        return new Response(JSON.stringify({ msg: '登录成功', success: true, username }), {
            status: 200,
            headers: { 'Content-Type': 'application/json;charset=utf-8' }
        });

    } catch (error) {
        console.error('登录接口异常：', error);
        return new Response(JSON.stringify({ msg: '服务器内部错误，请稍后再试' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json;charset=utf-8' }
        });
    }
}
