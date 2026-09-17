/**
 * 全局悬浮 AI 助手（聊天型）
 * - AI_MODE='deepseek'：调用 DeepSeek 真实大模型（前端直连，Key 见 utils/ai-config.js）
 * - AI_MODE='mock'：本地规则模拟（兜底/演示）
 */
const aiConfig = require('../../utils/ai-config.js');
const store = require('../../utils/store.js');

Component({
  properties: {
    // 底部导航页由导航栏的 AI 按钮打开；其它详情页保留一个不可拖动的快捷入口。
    tabMode: { type: Boolean, value: false }
  },
  data: {
    showPanel: false,
    draft: '',
    typing: false,
    voiceRecording: false,
    inputMode: 'text',
    scrollTarget: '',
    kbBottom: '0px',
    bodyHeight: 0,
    messages: [
      {
        id: 1,
        role: 'ai',
        content: '你好，我是小贤的 AI 助手。\n可以帮你记录打卡、安排任务或解答成长问题。'
      }
    ],
    _seq: 1
  },

  lifetimes: {
    detached() {
      clearTimeout(this._keyboardTimer);
      if (this._recordManager && this.data.voiceRecording) this._recordManager.stop();
    }
  },

  methods: {
    onToggle() {
      const show = !this.data.showPanel;
      if (show) return this.openPanel();
      this.onClose();
    },

    openPanel() {
      if (this.data.showPanel) return;
      const show = true;
      this.setData({ showPanel: show });
      this.setTabBarHidden(show);
      if (show) {
        // 面板渲染后再算消息区高度，避免 scroll-view 被内容撑开
        setTimeout(() => this.computeBodyHeight(), 50);
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
      clearTimeout(this._keyboardTimer);
      this._keyboardHeight = 0;
      this.setData({ showPanel: false, kbBottom: '0px' });
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

    switchToVoice() {
      if (this.data.typing) return;
      wx.hideKeyboard({});
      this.setData({ inputMode: 'voice' });
    },

    switchToText() {
      if (this.data.voiceRecording) this.stopVoiceInput();
      this.setData({ inputMode: 'text' });
    },

    // 微信同声传译插件提供实时语音转文字；插件未开通时不影响普通文字聊天。
    initVoiceRecognition() {
      if (this._recordManager) return true;
      try {
        const plugin = requirePlugin('WechatSI');
        const manager = plugin.getRecordRecognitionManager();
        manager.onRecognize = (res) => {
          if (!this.data.voiceRecording) return;
          const result = String((res && res.result) || '').trim();
          if (result) this.setData({ draft: result });
        };
        manager.onStop = (res) => {
          const result = String((res && res.result) || '').trim();
          this.setData({ voiceRecording: false, inputMode: 'text' });
          if (result) {
            this.setData({ draft: result });
          } else if (!this.data.draft) {
            wx.showToast({ title: '没有识别到内容，请再试一次', icon: 'none' });
          }
        };
        manager.onError = (err) => {
          console.error('[AI] 语音识别失败', err);
          this.setData({ voiceRecording: false });
          wx.showToast({ title: '语音识别失败，请检查网络或权限', icon: 'none' });
        };
        this._recordManager = manager;
        return true;
      } catch (err) {
        console.error('[AI] 微信同声传译插件不可用', err);
        wx.showModal({
          title: '语音输入暂不可用',
          content: '请先在小程序后台的“设置 → 第三方服务 → 插件管理”添加“微信同声传译”插件，然后重新编译。',
          showCancel: false
        });
        return false;
      }
    },

    startVoiceInput() {
      if (this.data.typing || this.data.voiceRecording) return;
      wx.authorize({
        scope: 'scope.record',
        success: () => {
          if (!this.initVoiceRecognition()) return;
          this.setData({ voiceRecording: true });
          this._recordManager.start({ lang: 'zh_CN' });
        },
        fail: () => {
          wx.showModal({
            title: '需要麦克风权限',
            content: '请允许使用麦克风，才能把语音转换成文字。',
            confirmText: '去设置',
            success: (res) => { if (res.confirm) wx.openSetting(); }
          });
        }
      });
    },

    stopVoiceInput() {
      if (!this.data.voiceRecording || !this._recordManager) return;
      this._recordManager.stop();
    },

    // 焦点事件用于首帧兜底；实际高度以 keyboardheightchange 为准，避免不同设备键盘高度不一致。
    onKbFocus(e) {
      const h = Number(e.detail && e.detail.height) || 0;
      if (h > 0) this.updateKeyboardHeight(h, 0);
      this.scheduleKeyboardLayout(0);
    },
    onKbHeightChange(e) {
      const detail = e.detail || {};
      this.updateKeyboardHeight(Number(detail.height) || 0, Number(detail.duration) || 0);
    },
    updateKeyboardHeight(height, duration) {
      if (height === this._keyboardHeight) return;
      this._keyboardHeight = height;
      this.setData({ kbBottom: height + 'px' });
      this.scheduleKeyboardLayout(duration);
    },
    scheduleKeyboardLayout(duration) {
      clearTimeout(this._keyboardTimer);
      this._keyboardTimer = setTimeout(() => {
        if (!this.data.showPanel) return;
        this.computeBodyHeight();
        const msgs = this.data.messages;
        if (!msgs.length) return;
        const target = 'msg-' + msgs[msgs.length - 1].id;
        this.setData({ scrollTarget: '' });
        setTimeout(() => this.setData({ scrollTarget: target }), 20);
      }, Math.max(0, duration) + 30);
    },
    // 键盘收起：取消偏移并重算消息区高度。
    onKbBlur() {
      this._keyboardHeight = 0;
      this.setData({ kbBottom: '0px' });
      this.scheduleKeyboardLayout(0);
    },

    onSend() {
      const text = (this.data.draft || '').trim();
      if (!text || this.data.typing) return;

      const uid = ++this.data._seq;
      const messages = this.data.messages.concat([{ id: uid, role: 'user', content: text }]);
      this.setData({ messages, draft: '', typing: true, scrollTarget: 'msg-' + uid });

      // 打卡指令由本地规则直接处理，不依赖模型是否可用。
      // 例如：我今天完成了扫地任务，帮我打卡扫地任务，积分10分
      const checkinAction = this.parseCheckinCommand(text);
      if (checkinAction) {
        this.appendAiReply(
          '已识别到「' + checkinAction.name + '」打卡，奖励 ' + checkinAction.points +
          ' 分。确认后会写入积分流水。',
          [checkinAction]
        );
        return;
      }

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
            reply = '模型暂时无法回复：' + errMsg + '。请稍后再试。';
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
    appendAiReply(reply, providedActions) {
      const aid = ++this.data._seq;
      const content = this.formatAiReply(reply);
      const actions = Array.isArray(providedActions) ? providedActions : this.parseActions(content);
      const list = this.data.messages.concat([{ id: aid, role: 'ai', content: content, actions: actions }]);
      this.setData({ messages: list, typing: false, scrollTarget: 'msg-' + aid });
    },

    // 即使模型偶尔没有完全遵守提示词，也统一输出为简洁、易读的聊天文本。
    formatAiReply(reply) {
      let content = String(reply || '')
        .replace(/\r\n?/g, '\n')
        .replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, '')
        .replace(/[！!]{2,}/g, '！')
        .replace(/[？?]{2,}/g, '？')
        .replace(/[～~]+/g, '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      if (!content) return '我已收到。请告诉我需要帮你处理什么。';

      // 模型把多句内容挤在同一行时，每两句分成一个短段落。
      if (content.indexOf('\n') === -1 && content.length > 90) {
        const sentences = content.match(/[^。！？!?]+[。！？!?]?/g) || [content];
        const paragraphs = [];
        for (let i = 0; i < sentences.length; i += 2) {
          paragraphs.push(sentences.slice(i, i + 2).join('').trim());
        }
        content = paragraphs.filter(Boolean).join('\n\n');
      }

      return content.slice(0, 420).trim();
    },

    // 识别“完成任务 + 打卡 + 积分”的自然语言，返回需要用户确认的打卡动作。
    parseCheckinCommand(text) {
      // 先统一空格和中英文标点，避免口述输入的格式差异导致落入普通聊天回复。
      const source = String(text || '').replace(/\s+/g, '').replace(/[，,。；;！!？?]/g, '，');
      if (!/(?:打卡|完成了?|做完了?|做了|做到)/.test(source) || !/(?:积分|\d+\s*分)/.test(source)) return null;

      const pointMatch = source.match(/(?:积分|奖励|加)\s*([1-9]\d{0,3})\s*(?:个)?(?:积分|分)?|([1-9]\d{0,3})\s*(?:个)?积分|([1-9]\d{0,3})\s*分/);
      const points = pointMatch && parseInt(pointMatch[1] || pointMatch[2] || pointMatch[3], 10);
      if (!points || points > 1000) return null;

      const patterns = [
        /(?:帮我)?打卡[：:]?\s*([^，\d]{1,18}?)(?:任务)?(?=，|$)/,
        /([^，\d]{1,18}?)(?:任务)?(?:完成了?|做完了?)(?=，|$)/,
        /(?:完成了?|做完了?)\s*([^，\d]{1,18}?)(?:任务)?(?=，|$)/,
        /(?:任务[是：:]?)\s*([^，\d]{1,18}?)(?:任务)?(?=，|$)/
      ];
      let rawName = '';
      for (let i = 0; i < patterns.length; i++) {
        const match = source.match(patterns[i]);
        if (match) {
          rawName = match[1];
          break;
        }
      }
      // 任务关键词优先于泛化正则，避免“我扫地完成了”误把“了”当成任务名。
      const taskMatch = source.match(/(扫地|拖地|洗碗|整理书桌|整理玩具|倒垃圾|阅读|背诵|练字|运动)/);
      if (taskMatch) rawName = taskMatch[1];
      const name = rawName.replace(/^(?:我今天|今天|我|一下|：|:)/, '').replace(/任务$/, '').trim();
      if (!name || name.length > 12) return null;

      return {
        id: 'checkin_' + Date.now(),
        type: 'checkin',
        name: name,
        points: points,
        label: '确认打卡「' + name + '」+ ' + points + ' 分'
      };
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
      if (!act || act.done) return;
      if (act.type === 'checkin') {
        const res = store.aiRecordBonus(act.name, act.points);
        if (!res) {
          wx.showToast({ title: '打卡信息无效，请重新发送', icon: 'none' });
          return;
        }
        this.markActionDone(act.id, '已打卡「' + act.name + '」✓');
        wx.showToast({ title: '已打卡 +' + act.points + ' 分，当前 ' + res.points + ' 分', icon: 'none' });
      } else if (act.type === 'record') {
        const res = store.aiRecordBonus('AI记录', act.points);
        if (res) wx.showToast({ title: '已记 ' + act.points + ' 分，当前 ' + res.points + ' 分', icon: 'none' });
      } else if (act.type === 'addTask') {
        store.addDailyTask(act.name, act.points || 5);
        wx.showToast({ title: '已添加「' + act.name + '」', icon: 'none' });
      }
    },

    // 已完成的确认按钮就地变为状态文字，避免用户重复点击记分。
    markActionDone(actionId, label) {
      const messages = this.data.messages.map((message) => {
        if (!message.actions || !message.actions.length) return message;
        return Object.assign({}, message, {
          actions: message.actions.map((action) => {
            if (action.id !== actionId) return action;
            return Object.assign({}, action, { done: true, label: label });
          })
        });
      });
      this.setData({ messages: messages });
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
        return '可以记录这次表现。\n请告诉我任务名称和积分，例如“完成扫地任务，打卡 10 分”。';
      }
      if (/打卡|完成|做了|做到/.test(text)) {
        return '可以帮你打卡。请补充任务名称和积分，例如“阅读 20 分钟，打卡 10 分”。';
      }
      if (/记录|记一下|备忘|记着/.test(text)) {
        return '已收到。请补充需要记录的具体内容和日期。';
      }
      if (/任务|待办|新建|加一个/.test(text)) {
        return '请告诉我任务名称、积分和是否每天重复。';
      }
      if (/你好|hi|hello|在吗/i.test(text)) {
        return '你好。我可以帮你记录、打卡和安排任务。';
      }
      return '我已收到。请告诉我希望我帮你完成什么。';
    },

    preventMove() {}
  }
});
