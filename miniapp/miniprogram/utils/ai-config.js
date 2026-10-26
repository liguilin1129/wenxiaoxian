/**
 * AI 助手配置（前端直连 DeepSeek 模式）
 * ------------------------------------------------------------------
 * ⚠️ 安全提醒：
 *    - 此文件把 API Key 打进小程序包，任何人反编译都能提取。
 *    - 仅适合「个人开发 / 调试 / 自用」。若要做正式发布版，
 *      请把 Key 移到微信云函数（见 ai-config.cloud.js 说明），前端只调云函数。
 *
 * 使用步骤：
 *   1. 把 DEEPSEEK.API_KEY 的值换成你自己的 Key（sk- 开头）
 *   2. 开发者工具「详情 → 本地设置」勾选「不校验合法域名、TLS 版本以及 HTTPS 证书」
 *      （真机 / 体验版还需在小程序后台「开发设置 → 服务器域名 → request 合法域名」
 *       添加 https://api.deepseek.com）
 *   3. AI_MODE 设为 'deepseek' 即生效；改回 'mock' 可随时退回演示模式。
 */

const config = {
  // 'deepseek' = 调用真实模型；'mock' = 本地规则模拟（兜底/演示）
  AI_MODE: 'deepseek',

  DEEPSEEK: {
    // 占位 Key；真实 Key 由 ai-config.secret.js 覆盖（该文件被 .gitignore 忽略，不入库）
    API_KEY: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',

    // DeepSeek 对话接口
    ENDPOINT: 'https://api.deepseek.com/chat/completions',

    // 模型：deepseek-chat（通用对话） / deepseek-reasoner（深度推理）
    MODEL: 'deepseek-chat',

    // 温度越低越稳定，减少过度发挥和冗长表达。
    TEMPERATURE: 0.4,

    // 单次回复最大 token
    MAX_TOKENS: 320
  },

  // 系统提示词：给 AI 设定身份与边界
  SYSTEM_PROMPT:
    '你是「文小贤」家庭教养积分小程序的 AI 助手，服务对象是小朋友文小贤及其家长。' +
    '表达应温和、直接、易读，像可靠的家庭成长顾问。' +
    '回答规范（必须遵守）：先给结论；默认 2 至 4 句、120 字以内；复杂问题最多列 3 个简短要点，每个要点单独成行。' +
    '使用自然短段落，不复述用户完整问题。不要使用 emoji、颜文字、波浪号、重复标点、星号强调或夸张语气。' +
    '你可以帮用户：记录成长事项、提醒/协助打卡、建议或新建好习惯任务、讲解经典与五大内功（好身心/好身体/好习惯/好品味）、' +
    '用积分激励引导孩子。不要输出暴力、成人或不当内容。' +
    '如果用户的请求涉及「打卡 / 记录 / 新建任务」等需要操作小程序数据的动作，' +
    '先用自然语言确认任务名称和积分；确认按钮会由小程序负责写入本地积分流水，不要声称该功能尚未实现。'
};

// 本地密钥覆盖（不入库）：若存在 ai-config.secret.js，则用其中的 API_KEY 覆盖占位值
try {
  const secret = require('./ai-config.secret.js');
  if (secret && secret.API_KEY) {
    config.DEEPSEEK.API_KEY = secret.API_KEY;
  }
} catch (e) {
  // 无本地密钥文件时，使用占位 Key（需手动替换或放置 secret 文件）
}

module.exports = config;
