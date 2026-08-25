const mock = require('./utils/mock.js');
const store = require('./utils/store.js');

App({
  globalData: {
    signed: false,
    child: JSON.parse(JSON.stringify(mock.child)),
    dimensions: mock.dimensions,
    neigong: mock.neigong,
    todayTasks: mock.todayTasks.map(t => Object.assign({}, t)),
    tasks: mock.tasks,
    taskDetail: mock.taskDetail,
    classics: mock.classics,
    pointsHistory: mock.pointsHistory.map(p => Object.assign({}, p)),
    rewards: mock.rewards,
    discoverArticles: mock.discoverArticles,
    meetings: [],
    courses: mock.courses,
    cases: mock.cases
  },

  onLaunch() {
    const signed = wx.getStorageSync('signed');
    if (signed) {
      this.globalData.signed = true;
    }
    // 载入用户自定义资料（覆盖 mock 默认值），刷新不丢
    const saved = wx.getStorageSync('childProfile');
    if (saved && typeof saved === 'object') {
      this.globalData.child = Object.assign({}, this.globalData.child, saved);
    }
    // 恢复家长自定义奖品列表（覆盖 mock 默认 4 项），重启不丢
    const pr = wx.getStorageSync('parentRewards');
    if (Array.isArray(pr) && pr.length) {
      this.globalData.rewards = pr;
    }
    // 恢复打卡状态并重建积分/历史（必须在 childProfile 之后，points 由其确定性重建）
    store.initCheckIns(this);

    // 同步经典阅读进度：已读章节集合 → 已读章数；统一 total 为可读章节数（重启不丢）
    const visited = wx.getStorageSync('classicVisited') || {};
    this.globalData.classicVisited = visited;
    this.globalData.classics.forEach(c => {
      const chs = mock.classicChapters[c.name] || [];
      if (chs.length) c.total = chs.length;
      const set = visited[c.name] || [];
      c.read = Math.min(set.length, c.total);
    });
  }
});
