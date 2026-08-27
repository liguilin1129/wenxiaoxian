/**
 * 全局悬浮 AI 助手（聊天型）
 * - AI_MODE='deepseek'：调用 DeepSeek 真实大模型（前端直连，Key 见 utils/ai-config.js）
 * - AI_MODE='mock'：本地规则模拟（兜底/演示）
 */
const aiConfig = require('../../utils/ai-config.js');
const store = require('../../utils/store.js');

Component({
  data: {
    showPanel: false,
    draft: '',
    typing: false,
    scrollTarget: '',
    kbBottom: '0px',
    bodyHeight: 0,
    fabOffset: { x: 0, y: 0 },
    fabMoving: false,
    messages: [
      {
        id: 1,
        role: 'ai',
        content: '嗨，我是小贤的 AI 助手 🤖\n有什么想聊的，或者想让我帮你的事，都可以告诉我～'
      }
    ],
    _seq: 1
  },

  // 页面重新显示时把 AI 按钮复位（位置不持久化）
  pageLifetimes: {
    show() {
      this.resetFab();
    }
  },

  methods: {
    // 把悬浮按钮复位到默认位置（位置不持久化，仅当前会话/页面有效）
    resetFab() {
      this.setData({ fabOffset: { x: 0, y: 0 }, fabMoving: false });
    },

    onToggle() {
      const show = !this.data.showPanel;
      this.setData({ showPanel: show });
      this.setTabBarHidden(show);
      if (show) {
        // 面板渲染后再算消息区高度，避免 scroll-view 被内容撑开
        setTimeout(() => this.computeBodyHeight(), 50);
      }
    },

    // ---- 悬浮按钮拖动（位置不持久化，跨页/重启重置）----
    onFabTouchStart(e) {
      const t = e.touches[0];
      this._touchStart = { x: t.clientX, y: t.clientY };
      this._touchBase = this.data.fabOffset;
      this._touchMoved = false;
      this.setData({ fabMoving: true });
    },

    onFabTouchMove(e) {
      if (!this._touchStart) return;
      const t = e.touches[0];
      const dx = t.clientX - this._touchStart.x;
      const dy = t.clientY - this._touchStart.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        this._touchMoved = true;
      }
      const base = this._touchBase || { x: 0, y: 0 };
      this.setData({ fabOffset: { x: base.x + dx, y: base.y + dy } });
    },

    onFabTouchEnd() {
      const moved = this._touchMoved;
      this._touchStart = null;
      this._touchBase = null;
      this.setData({ fabMoving: false });
      // 几乎没移动，当作点击打开面板
      if (!moved) {
        this.onToggle();
      }
    },

    // 动态计算消息区高度 = 面板高 - 头部 - 输入栏
    computeBodyHeight() {
      const query = wx.createSelectorQuery().in(this);
      query.select('.ai-panel').boundingClientRect();
      query.select('.panel-header').boundingClientRect();
      query.select('.chat-input-bar').boundingClientRect();
      query.exec((res) => {
        const panel = res[0], header = res[1], input = res[2];
        if (panel && header && input) {
          const h = panel.height - header.height - input.height;
          this.setData({ bodyHeight: Math.max(h, 100) });
        }
      });
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
      // 键盘高度变化后面板可用高度改变，重新计算
      setTimeout(() => this.computeBodyHeight(), 50);
    },
    onBlur() {
      this.setData({ kbBottom: '0px' });
      setTimeout(() => this.computeBodyHeight(), 50);
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
          if (res.statusCode === 200 && res.data && res.data.choices && res.data.choices.length) {
            reply = res.data.choices[0].message.content.trim();
          } else {
            const errMsg = (res.data && res.data.error) ? res.data.error.message : ('HTTP ' + res.statusCode);
            console.error('[AI] DeepSeek 错误:', errMsg);
            reply = '抱歉，模型返回了错误：' + errMsg + ' 🙏';
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

    // 把 AI 回复追加到消息列表，并解析可执行动作
    appendAiReply(reply) {
      const aid = ++this.data._seq;
      const actions = this.parseActions(reply);
      const list = this.data.messages.concat([{ id: aid, role: 'ai', content: reply, actions: actions }]);
      this.setData({ messages: list, typing: false, scrollTarget: 'msg-' + aid });
    },

    // 从 AI 文本中提取可执行动作（积分、任务）
    parseActions(text) {
      const actions = [];
      // 1) 奖励/记 X 分/积分：奖励 10 个积分、记 10 分、+10 分
      const ptsMatch = text.match(/(?:奖励|记|加|\+)\s*(\d+)\s*(?:个)?(?:积分|分)/);
      if (ptsMatch) {
        const pts = parseInt(ptsMatch[1], 10);
        actions.push({ type: 'record', points: pts, label: '确认记 ' + pts + ' 分' });
      }
      // 2) 添加任务：「每日小管家」、设一个“每日小管家”任务
      const taskMatch = text.match(/[「\"']([^「\"']+?)[\"''」](?:.*任务)|(?:设一个|添加).*?([每日常][^\s，。]+)(?:任务)?/);
      if (taskMatch) {
        const name = taskMatch[1] || taskMatch[2];
        if (name && name.length <= 12) {
          actions.push({ type: 'addTask', name: name, label: '添加「' + name + '」为每日任务' });
        }
      }
      return actions;
    },

    // 执行 AI 建议动作
    handleAction(e) {
      const act = e.currentTarget.dataset.action;
      if (!act) return;
      if (act.type === 'record') {
        const res = store.aiRecordBonus('AI记录', act.points);
        wx.showToast({ title: '已记 ' + act.points + ' 分，当前 ' + res.points + ' 分', icon: 'none' });
      } else if (act.type === 'addTask') {
        store.addDailyTask(act.name, act.points || 5);
        wx.showToast({ title: '已添加「' + act.name + '」', icon: 'none' });
      }
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
      if (/打扫|卫生|整理|主动|帮忙|做了好事/.test(text)) {
        return '哇！小贤真棒呀！自己主动打扫卫生，这可是特别好的习惯呢！🧹✨\n\n我来帮你记一下：今天小贤自己打扫了卫生，奖励 10 个积分，对不对？点下面的按钮就能真正记到小贤的账户里～\n\n对了，打扫卫生这个习惯特别好，要不要我帮你给小贤设一个「每日小管家」的任务呀？比如每天整理自己的玩具或者书桌，完成一次就能攒积分，小贤会越来越有责任感呢！☀️';
      }
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
