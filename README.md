# 文小贤 · 家庭教养积分小程序

基于《文小贤_家庭教养积分小程序_UI设计稿.pdf》（Light UI Kit 风格）实现的**可运行微信小程序**。

> 数据均为本地 mock（无需后端 / 无需云开发），可直接在微信开发者工具中预览全部交互。

## 如何运行

1. 打开 **微信开发者工具** → 导入项目。
2. 项目目录选择：`训练记录小程序/文小贤小程序/`（即本文件夹，内含 `project.config.json`）。
3. AppID：默认填的是 `touristappid`（游客模式，无需账号即可预览）。如需真机预览/上传，请改成你自己的小程序 AppID。
4. 编译后即可在模拟器中看到 **引导签约页 → 首页仪表盘**，并开始体验打卡、积分、兑换等交互。

## 功能与界面（共 10 屏）

| 页面 | 路由 | 说明 |
|------|------|------|
| 引导签约 | `pages/guide/guide` | 首屏，签订四大维度成长合约（已签约会记住，下次直达首页） |
| 首页仪表盘 | `pages/index/index` | 积分等级、连续打卡、四维成长、今日待打卡、经典推荐（Tab） |
| 鼓励任务中心 | `pages/tasks/tasks` | 按维度分组的任务与奖励行为，可筛选（Tab） |
| 任务详情 | `pages/task-detail/task-detail` | 设计目的 / 内功 / 经典 / 奖励行为 / 培养方式 |
| 今日打卡 | `pages/checkin/checkin` | 勾选打卡，实时累计今日积分与完成数 |
| 积分明细 | `pages/points/points` | 积分流水，按 获得 / 消耗 筛选 |
| 经典学习 | `pages/classics/classics` | 17 部经典阅读进度网格（Tab） |
| 奖励兑换 | `pages/rewards/rewards` | 用积分兑换心愿，余额不足会提示 |
| 成长报告 | `pages/report/report` | 四维表现 + 五类内功 + 本周累计 |
| 我的 | `pages/profile/profile` | 个人信息、合约、入口菜单（Tab） |

## 目录结构

```
文小贤小程序/
├── project.config.json        # 工程配置（appid: touristappid）
└── miniprogram/
    ├── app.js / app.json / app.wxss   # 全局逻辑、路由、设计系统
    ├── custom-tab-bar/                # 自定义底部 Tab（emoji 图标，免 PNG 资源）
    ├── utils/
    │   ├── mock.js                    # 全部模拟数据（4维度/6任务/17经典/奖励/内功…）
    │   └── store.js                   # 全局状态读写（打卡、兑换、签约）
    └── pages/                         # 10 个页面，每页 .js/.json/.wxml/.wxss
```

## 设计系统（Light UI Kit）

- 主色 Indigo `#6366F1`（含 `#8B5CF6` 渐变）；页面底 `#F5F5F7`；卡片纯白 + 极轻阴影。
- 四维配色：好身心 `#FB7185` / 好身体 `#34D399` / 好习惯 `#6366F1` / 好品味 `#FBBF24`。
- 全部令牌定义在 `app.wxss` 的 `page{}` 下（CSS 变量），改主题只需改这一处。

## 交互说明

- 打卡：在「今日打卡」勾选，积分实时累加并写入流水；再次点击可取消。
- 兑换：余额足够则扣分并提示成功，不足弹出差额提示。
- 签约状态用 `wx.setStorageSync('signed')` 持久化；「我的 → 退出成长花园」可清除并重签。

## 后续可扩展方向

- 接入云开发 / 自有后端，替换 `utils/mock.js` 为真实接口（封装在 `utils/store.js`）。
- 经典阅读增加详情页（`pages/classic-detail`）。
- 加入订阅消息提醒（打卡提醒）、家长端审核流。
