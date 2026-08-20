Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/index/index', text: '首页', icon: '🏠' },
      { pagePath: '/pages/tasks/tasks', text: '任务', icon: '📋' },
      { pagePath: '/pages/classics/classics', text: '经典', icon: '📚' },
      { pagePath: '/pages/profile/profile', text: '我的', icon: '👤' }
    ]
  },
  methods: {
    switchTab(e) {
      const path = e.currentTarget.dataset.path;
      wx.switchTab({ url: path });
    }
  }
});
