/**
 * 全局悬浮 AI 助手（聊天型 · UI 壳阶段）
 * - 当前回复由本地规则模拟（getMockReply），不接任何执行逻辑。
 * - 接入真实大模型时：把 onSend 里的 getMockReply(text) 替换为
 *   一次云函数 / 后端对话接口调用即可（请求走服务端代理，Key 不下发前端）。
 */
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

      // 模拟「思考」后回复（UI 壳阶段：本地规则；后续替换为真实模型调用）
      setTimeout(() => {
        const reply = this.getMockReply(text);
        const aid = ++this.data._seq;
        const list = this.data.messages.concat([{ id: aid, role: 'ai', content: reply }]);
        this.setData({ messages: list, typing: false, scrollTarget: 'msg-' + aid });
      }, 600);
    },

    /**
     * 本地模拟大脑（占位）
     * TODO(ui壳→真模型): 替换为云函数对话接口，例如：
     *   const res = await wx.cloud.callFunction({ name: 'aiChat', data: { messages } });
     *   return res.result.reply;
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
