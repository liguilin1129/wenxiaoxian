Component({
  data: {
    selected: 0,
    hidden: false,
    list: [
      { pagePath: '/pages/index/index', text: '首页', idx: 0 },
      { pagePath: '/pages/tasks/tasks', text: '任务', idx: 1 },
      { pagePath: '/pages/discover/discover', text: '发现', idx: 2 },
      { pagePath: '/pages/profile/profile', text: '我的', idx: 3 }
    ]
  },
  methods: {
    switchTab(e) {
      const path = e.currentTarget.dataset.path;
      wx.switchTab({ url: path });
    },
    openAiAssistant() {
      const pages = getCurrentPages();
      const page = pages[pages.length - 1];
      const assistant = page && page.selectComponent && page.selectComponent('#aiAssistant');
      if (assistant && typeof assistant.openPanel === 'function') assistant.openPanel();
    }
  }
});
