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

    // 温度：0~1，越大越发散。家庭助手建议 0.6~0.8
    TEMPERATURE: 0.7,

    // 单次回复最大 token
    MAX_TOKENS: 1024
  },

  // 系统提示词：给 AI 设定身份与边界
  SYSTEM_PROMPT:
    '你是「文小贤」家庭教养积分小程序的 AI 助手，服务对象是小朋友文小贤及其家长。' +
    '你的风格：温柔、鼓励、口语化、像邻家大朋友，多用 emoji。' +
    '你可以帮用户：记录成长事项、提醒/协助打卡、建议或新建好习惯任务、讲解经典与五大内功（好身心/好身体/好习惯/好品味）、' +
    '用积分激励引导孩子。不要输出暴力、成人或不当内容。' +
    '如果用户的请求涉及「打卡 / 记录 / 新建任务」等需要操作小程序数据的动作，' +
    '先用自然语言确认细节，并提示「这些操作需要开发者在后台接入数据接口」。'
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
