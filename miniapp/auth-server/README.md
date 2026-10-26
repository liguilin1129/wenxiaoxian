# 微信授权登录服务

这是小程序的最小登录后端，负责把微信一次性授权凭证换成用户标识；手机号授权为可选扩展。AppSecret 只能放在本服务的 `.env` 中，不能放进小程序代码。

## 启动

1. 需要 Node.js 18 或更新版本。
2. 复制 `.env.example` 为 `.env`，填写真实 `WECHAT_APP_SECRET` 和随机 `AUTH_TOKEN_SECRET`。
3. 执行 `npm start`。

服务监听 `POST /api/auth/wechat/login`，请求体为：

```json
{
  "loginCode": "wx.login 返回的 code",
  "profile": { "nickname": "用户昵称", "avatarUrl": "用户头像 URL" }
}
```

登录成功后，小程序会将返回的 `token` 放入 `Authorization: Bearer <token>` 请求头；可通过 `GET /api/auth/me` 获取当前已授权用户的昵称、头像等公开资料。该接口用于应用启动时核验本地登录缓存。

## 个人成长数据（开发阶段）

`GET /api/app/state` 与 `PUT /api/app/state` 需要携带同一登录令牌。它们按微信用户 ID 保存一份成长状态快照，包含打卡状态、资料、奖励、家庭会议和经典阅读进度；数据文件位于 `server/data/app-state.json`，已被 Git 忽略，不会提交到仓库。

这是开发阶段的轻量存储。正式上线前应迁移到具备访问控制、备份与并发保障的数据库。

生产环境必须使用 HTTPS，将服务域名加入微信公众平台的“request 合法域名”，并把 `server/data/users.json` 替换为受访问控制的数据库。
