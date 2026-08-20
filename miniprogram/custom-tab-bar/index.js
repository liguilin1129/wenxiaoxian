Component({
  data: {
    selected: 0,
    // 左侧2个Tab（idx 为全局真实索引，供高亮/跳转使用）
    leftList: [
      { idx: 0, pagePath: '/pages/index/index', text: '首页' },
      { idx: 1, pagePath: '/pages/tasks/tasks', text: '任务' }
    ],
    // 右侧2个Tab
    rightList: [
      { idx: 2, pagePath: '/pages/report/report', text: '成长' },
      { idx: 3, pagePath: '/pages/profile/profile', text: '我的' }
    ]
  },
  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index;
      const all = this.data.leftList.concat(this.data.rightList);
      const item = all[index];
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
