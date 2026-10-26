# 文小贤后台管理系统技术方案

## 已确定技术栈

- 管理端：Vue 3、TypeScript、Vite、Element Plus、Pinia、ECharts。
- 服务端：NestJS、TypeScript、Prisma、OpenAPI/Swagger。
- 数据与基础设施：PostgreSQL 16、Redis、MinIO；Docker Compose 本地编排。

## 数据设计原则

PostgreSQL 是业务唯一事实来源。积分、成长银行、审核和订单等核心操作通过事务执行；积分流水不可更新或删除，只允许写入冲正记录。`PointLedger.idempotencyKey` 有唯一约束，避免网络重试造成重复发放。

Redis 只用于缓存、限流、队列和短期幂等控制；MinIO 只存图片和附件；小程序本地缓存仅用于离线草稿和体验优化。

## 当前第一期骨架

- `backend/`：NestJS 服务、健康检查、Swagger、Prisma 和管理员/权限/家庭用户/积分流水/内容/审计基础模型。
- `admin/`：Vue 管理端布局和数据概览页，已预留用户、审核、任务积分、成长银行、挑战、商城、审计模块入口。
- 根目录 `docker-compose.yml`：PostgreSQL、Redis、MinIO 的本地开发依赖。

## 启动顺序

1. 复制 `backend/.env.example` 为 `backend/.env`。
2. 在 `backend/` 和 `admin/` 分别执行 `npm install`。
3. 根目录执行 `docker compose up -d`。
4. 在 `backend/` 执行 `npm run prisma:generate`、`npm run prisma:migrate -- --name init`、`npm run prisma:seed`，然后 `npm run dev`。
5. 在 `admin/` 执行 `npm run dev`，访问 `http://localhost:5173`；接口文档为 `http://localhost:3001/api/docs`。

本地 PostgreSQL 映射到主机 `5433` 端口，以免占用或误连开发机上已有的 `5432` 实例。

## 第一批可用模块

- 管理员登录：`POST /api/admin/auth/login`，使用 HMAC 签名令牌，令牌有效期 8 小时；所有管理数据接口要求 `Authorization: Bearer <token>`。
- 用户/家庭查询：`GET /api/admin/users?page=1&pageSize=20&keyword=`，支持按昵称、微信标识和家庭名称搜索。
- 积分流水查询：`GET /api/admin/point-ledgers?page=1&pageSize=20&keyword=&type=EARN|SPEND|REVERSAL`。

复制 `backend/.env.example` 为 `backend/.env` 后，先将 `ADMIN_TOKEN_SECRET` 改为足够长的随机值。执行 `npm run prisma:seed` 会创建由 `SEED_ADMIN_EMAIL` 和 `SEED_ADMIN_PASSWORD` 配置的本地管理员；示例账号仅限本地开发，首次运行后必须修改密码。
