const mock = require('./utils/mock.js');

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
    rewards: mock.rewards
  },

  onLaunch() {
    const signed = wx.getStorageSync('signed');
    if (signed) {
      this.globalData.signed = true;
    }
  }
});
