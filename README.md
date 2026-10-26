# 文小贤工作区

本仓库按可独立开发、运行和验收的边界整理为三个目录：

- `miniapp/`：微信小程序主体、云函数、小程序登录服务与小程序开发文档。使用微信开发者工具导入该目录。
- `admin-system/`：运营后台管理端、NestJS API、PostgreSQL/Redis/MinIO 本地编排与后台技术方案。
- `test-data/`：小程序 Node 验收脚本、页面预览 HTML 和视觉参考图，不包含生产运行代码。

## 常用入口

- 小程序说明：`miniapp/README.md`
- 后台说明：`admin-system/README.md`
- 小程序验收：在 `miniapp/` 目录运行 `node ../test-data/miniapp-tests/acceptance.js`
