Component({
  data: {
    selected: 0,
    hidden: false,
    list: [
      { pagePath: '/pages/index/index', text: '首页', idx: 0 },
      { pagePath: '/pages/tasks/tasks', text: '任务', idx: 1 },
      { pagePath: '/pages/classics/classics', text: '经典', idx: 2 },
      { pagePath: '/pages/profile/profile', text: '我的', idx: 3 }
    ]
  },
  methods: {
    switchTab(e) {
      const path = e.currentTarget.dataset.path;
      wx.switchTab({ url: path });
    }
  }
});
