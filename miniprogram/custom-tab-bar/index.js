Component({
  data: {
    selected: 0,
    // 左右各2个Tab + 中间凸起按钮（不是Tab页）
    list: [
      { pagePath: '/pages/index/index', text: '首页', icon: 'home', iconActive: 'home-fill' },
      { pagePath: '/pages/tasks/tasks', text: '任务', icon: 'checkbox', iconActive: 'checkbox-filled' },
      { pagePath: '/pages/report/report', text: '成长', icon: 'chart', iconActive: 'chart-fill' },
      { pagePath: '/pages/profile/profile', text: '我的', icon: 'user', iconActive: 'user-fill' }
    ]
  },
  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index;
      const item = this.data.list[index];
      if (item) {
        wx.switchTab({ url: item.pagePath });
      }
    },
    onCenterTap() {
      // 中间"+"按钮 → 跳转到今日打卡页
      wx.navigateTo({ url: '/pages/checkin/checkin' });
    }
  }
});
