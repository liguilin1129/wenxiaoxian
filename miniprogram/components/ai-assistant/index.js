/**
 * 全局悬浮 AI 助手（聊天型）
 * - AI_MODE='deepseek'：调用 DeepSeek 真实大模型（前端直连，Key 见 utils/ai-config.js）
 * - AI_MODE='mock'：本地规则模拟（兜底/演示）
 */
const aiConfig = require('../../utils/ai-config.js');

Component({
  data: {
    showPanel: false,
    draft: '',
    typing: false,
    scrollTarget: '',
    kbBottom: '0px',
    messages: [
      {
        id: 1,
        role: 'ai',
        content: '嗨，我是小贤的 AI 助手 🤖\n有什么想聊的，或者想让我帮你的事，都可以告诉我～'
      }
    ],
    _seq: 1
  },

  methods: {
    onToggle() {
      const show = !this.data.showPanel;
      this.setData({ showPanel: show });
      this.setTabBarHidden(show);
    },

    onClose() {
      this.setData({ showPanel: false });
      this.setTabBarHidden(false);
    },

    // 打开聊天面板时把底部导航栏下移，避免遮挡输入框
    setTabBarHidden(hidden) {
      try {
        const pages = getCurrentPages();
        const page = pages[pages.length - 1];
        const tabBar = page && page.getTabBar && page.getTabBar();
        if (tabBar) tabBar.setData({ hidden: !!hidden });
      } catch (e) {}
    },

    onInput(e) {
      this.setData({ draft: e.detail.value });
    },

    // 键盘避让：聚焦时把面板抬到键盘上方，失焦时还原
    onFocus(e) {
      const h = (e.detail && e.detail.height) ? e.detail.height : 0;
      this.setData({ kbBottom: h + 'px' });
    },
    onBlur() {
      this.setData({ kbBottom: '0px' });
    },

    onSend() {
      const text = (this.data.draft || '').trim();
      if (!text || this.data.typing) return;

      const uid = ++this.data._seq;
      const messages = this.data.messages.concat([{ id: uid, role: 'user', content: text }]);
      this.setData({ messages, draft: '', typing: true, scrollTarget: 'msg-' + uid });

      // 根据配置选择真实模型或本地模拟
      if (aiConfig.AI_MODE === 'deepseek') {
        this.callDeepSeek(text);
      } else {
        this.mockReply(text);
      }
    },

    // 构造发给模型的消息数组（系统提示 + 历史对话）
    buildApiMessages() {
      const history = this.data.messages
        .filter(m => m.role === 'user' || m.role === 'ai')
        .map(m => ({
          role: m.role === 'ai' ? 'assistant' : m.role,
          content: m.content
        }));
      return [{ role: 'system', content: aiConfig.SYSTEM_PROMPT }].concat(history);
    },

    // 调用 DeepSeek 真实大模型
    callDeepSeek(text) {
      const self = this;
      const { ENDPOINT, API_KEY, MODEL, TEMPERATURE, MAX_TOKENS } = aiConfig.DEEPSEEK;
      const apiMessages = this.buildApiMessages();

      wx.request({
        url: ENDPOINT,
        method: 'POST',
        timeout: 30000,
        header: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + API_KEY
        },
        data: {
          model: MODEL,
          messages: apiMessages,
          temperature: TEMPERATURE,
          max_tokens: MAX_TOKENS,
          stream: false
        },
        success(res) {
          let reply = '';
          try {
            reply = res.data.choices[0].message.content.trim();
          } catch (e) {
            reply = '抱歉，我没能理解这次的回复格式，请再试一次 🙏';
          }
          self.appendAiReply(reply);
        },
        fail(err) {
          console.error('[AI] DeepSeek 请求失败', err);
          // 失败兜底：退回本地模拟，保证对话不中断
          wx.showToast({ title: '模型连接失败，已切换演示回复', icon: 'none' });
          self.appendAiReply(self.getMockReply(text));
        }
      });
    },

    // 把 AI 回复追加到消息列表
    appendAiReply(reply) {
      const aid = ++this.data._seq;
      const list = this.data.messages.concat([{ id: aid, role: 'ai', content: reply }]);
      this.setData({ messages: list, typing: false, scrollTarget: 'msg-' + aid });
    },

    // 本地模拟回复（兜底/演示）
    mockReply(text) {
      setTimeout(() => {
        this.appendAiReply(this.getMockReply(text));
      }, 600);
    },

    /**
     * 本地模拟大脑（占位 / 兜底）
     */
    getMockReply(text) {
      if (/打卡|完成|做了|做到/.test(text)) {
        return '收到～（这是界面演示，接入真实模型后我可以帮你一键打卡 ✅）';
      }
      if (/记录|记一下|备忘|记着/.test(text)) {
        return '好的，我记下了～（演示模式，真实模型接入后我会写入你的成长记录 📝）';
      }
      if (/任务|待办|新建|加一个/.test(text)) {
        return '想加什么任务呢？（演示模式，接入模型后我能直接帮你新建任务 ➕）';
      }
      if (/你好|hi|hello|在吗/i.test(text)) {
        return '你好呀 👋 我是小贤的 AI 助手，随时准备帮你记录、打卡、安排任务～';
      }
      return '嗯嗯，我在听～这是一个 UI 演示，等接入真实大模型，我就能真正陪你聊天、帮你办事啦 💬';
    },

    preventMove() {}
  }
});
