const app = getApp();
const store = require('../../utils/store.js');
const mock = require('../../utils/mock.js');
const { getCommunityArticles } = require('../../utils/community-article-data.js');

function matchesSearch(query, values) {
  const words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
  const source = values.map(value => String(value || '')).join(' ').toLowerCase();
  return words.length > 0 && words.every(word => source.indexOf(word) > -1);
}

function buildDimName() {
  const m = {};
  app.globalData.dimensions.forEach(d => { m[d.key] = d.name; });
  return m;
}

// 首页快捷入口（对齐思维导图「快捷入口」规格）
const QUICK_ENTRIES = [
  { icon: '✅', name: '任务打卡', url: '/pages/checkin/checkin' },
  { icon: '⭐', name: '积分明细', url: '/pages/points/points' },
  { icon: '📚', name: '经典学习', url: '/pages/classics/classics' },
  { icon: '🪑', name: '家庭会议', url: '/pages/family/family' },
  { icon: '🎁', name: '积分商城', url: '/pages/rewards/rewards' },
  { icon: '👨‍👩‍👦', name: '我的家庭', url: '/pages/family/family' },
  { icon: '💬', name: '成长社区', url: '/pages/community/community' },
  { icon: '📰', name: '发现文章', url: '/pages/article-list/article-list' }
];

Page({
  data: {
    signed: false,
    child: {},
    dims: [],
    today: [],
    doneCount: 0,
    total: 0,
    ovPct: 0,
    dimName: {},
    levelPct: 0,
    nextLevel: 6,
    need: 0,
    classicRecommendations: [],
    quickEntries: QUICK_ENTRIES.slice(0, 4),
    reminders: [],
    searchOpen: false,
    searchKey: '',
    searchResults: [],
    assessment: null,
    badges: [],
    badgeGot: 0,
    badgeTotal: 0,
    guestFeats: [
      { icon: '✅', name: '任务打卡', desc: '每日任务 · 好习惯养成' },
      { icon: '⭐', name: '积分成长', desc: '积分明细 · 四维成长报告' },
      { icon: '🎁', name: '奖励兑换', desc: '积分商城 · 心愿兑换' },
      { icon: '🪑', name: '家庭会议', desc: '全家商议 · 调整任务与心愿' }
    ],
    dateText: ''
  },
  onLoad() {
    const d = new Date();
    const wk = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
    this.setData({ dateText: wk + ' · ' + (d.getMonth() + 1) + '月' + d.getDate() + '日' });
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    this.refresh();
  },
  refresh() {
    const signed = !!store.isSigned();
    if (!signed) {
      // 未登录/未签约：不加载任何用户信息，只展示游客引导
      this.setData({
        signed: false, child: {}, dims: [], today: [], doneCount: 0,
        total: 0, ovPct: 0, levelPct: 0, need: 0, reminders: [], assessment: null
      });
      return;
    }
    const g = app.globalData;
    const child = g.child;
    const need = child.nextLevelPoints - child.points;
    const levelPct = Math.max(0, Math.min(100, Math.round(child.points / child.nextLevelPoints * 100)));
    const total = g.todayTasks.length;
    const doneCount = store.todayDoneCount();
    const ovPct = total ? Math.round(doneCount / total * 100) : 0;

    const isParent = store.isParentMode();
    const reminders = store.getSmartReminders().filter(item => isParent || ['checkin'].indexOf(item.target) >= 0).slice(0, 2);
    const quickEntries = (isParent ? QUICK_ENTRIES : QUICK_ENTRIES.filter(item => ['任务打卡', '积分明细', '经典学习', '积分商城'].indexOf(item.name) >= 0)).slice(0, 4);
    // 首页固定展示 3 本：优先续读进行中的经典，再补充未开始的经典。
    const classics = (g.classics || mock.classics).slice();
    const reading = classics.filter(book => book.read > 0 && book.read < book.total);
    const unread = classics.filter(book => !book.read);
    const finished = classics.filter(book => book.read >= book.total && book.total > 0);
    const classicRecommendations = reading.concat(unread, finished).slice(0, 3);

    this.setData({
      signed: true,
      child: child,
      dims: g.dimensions,
      today: g.todayTasks.slice(0, 4),
      doneCount: doneCount,
      total: total,
      ovPct: ovPct,
      dimName: buildDimName(),
      assessment: store.getAssessment(),
      isParent: isParent,
      levelPct: levelPct,
      nextLevel: child.levelNum + 1,
      need: need,
      classicRecommendations: classicRecommendations,
      reminders: reminders,
      quickEntries: quickEntries,
      // 荣誉墙：加载成就勋章 + 已点亮数量
      badges: store.getBadges().slice(0, 4),
      badgeGot: store.getBadges().filter(b => b.got).length,
      badgeTotal: store.getBadges().length
    });
  },
  goLogin() {
    // 未登录 → 轻量资料设置（与家庭会议解耦，不再强制签约）
    wx.navigateTo({ url: '/pages/login/login' });
  },
  goReport() { wx.navigateTo({ url: '/pages/report/report' }); },
  goPoints() { wx.navigateTo({ url: '/pages/points/points' }); },
  goCheckin() { wx.navigateTo({ url: '/pages/checkin/checkin' }); },
  goClassics() { wx.navigateTo({ url: '/pages/classics/classics' }); },
  goClassicRead(e) {
    const name = e.currentTarget.dataset.name;
    if (name) wx.navigateTo({ url: '/pages/classic-read/classic-read?name=' + encodeURIComponent(name) });
  },
  goTasks() { wx.switchTab({ url: '/pages/tasks/tasks' }); },
  goBadges() {
    wx.navigateTo({ url: '/pages/badges/badges' });
  },
  goReminders() {
    wx.navigateTo({ url: '/pages/reminders/reminders' });
  },
  goReminderTarget(e) {
    const target = e.currentTarget.dataset.target;
    const routes = { checkin: '/pages/checkin/checkin', approvals: '/pages/approvals/approvals', family: '/pages/family/meeting', assessment: '/pages/assessment/assessment' };
    if (routes[target]) wx.navigateTo({ url: routes[target] });
  },
  goSettings() {
    // 轻量设置：暂用「我的」页承载（会员/资料/退出入口齐全）
    wx.switchTab({ url: '/pages/profile/profile' });
  },
  // 顶部搜索：实时过滤本地 mock 数据（任务 / 经典 / 商城 / 文章 / 案例）
  openSearch() {
    this.setData({ searchOpen: true });
  },
  closeSearch() {
    this.setData({ searchOpen: false, searchKey: '', searchResults: [] });
  },
  onSearchInput(e) {
    const key = (e.detail.value || '').trim();
    this.setData({ searchKey: key });
    this.runSearch(key);
  },
  onSearchConfirm() {
    if (!this.data.searchKey) return;
    if (!this.data.searchResults.length) {
      wx.showToast({ title: '没有找到相关内容', icon: 'none' });
    }
  },
  clearSearch() {
    this.setData({ searchKey: '', searchResults: [] });
  },
  runSearch(key) {
    if (!key) {
      this.setData({ searchResults: [] });
      return;
    }
    const res = [];
    const seen = {};
    const add = item => {
      if (!item || seen[item.key]) return;
      seen[item.key] = true;
      res.push(item);
    };
    const g = app.globalData;

    // 任务中心及家长新增任务。
    (g.tasks || mock.tasks).forEach(group => {
      (group.list || []).forEach(task => {
        if (matchesSearch(key, [task.name, group.dimName, task.tags && task.tags.join(' ')])) {
          add({ key: 'task-' + task.id, type: '任务', icon: '✅', name: task.name, sub: group.dimName, url: '/pages/task-detail/task-detail?id=' + encodeURIComponent(task.id) });
        }
      });
    });
    store.getCustomTasks().forEach(task => {
      if (matchesSearch(key, [task.name, task.assignee, task.dim])) {
        add({ key: 'custom-task-' + task.id, type: '任务', icon: '✅', name: task.name, sub: '家长新增 · ' + (task.assignee || '孩子'), url: '/pages/task-manage/task-manage' });
      }
    });
    // 经典
    (g.classics || mock.classics).forEach(book => {
      if (matchesSearch(key, [book.name])) {
        add({ key: 'classic-' + book.name, type: '经典', icon: '📚', name: '《' + book.name + '》', sub: '已读 ' + book.read + '/' + book.total, url: '/pages/classic-read/classic-read?name=' + encodeURIComponent(book.name) });
      }
    });
    // 商城（奖励）
    (g.rewards || mock.rewards).forEach(reward => {
      if (matchesSearch(key, [reward.name, reward.desc, reward.dim])) {
        add({ key: 'reward-' + reward.id, type: '商城', icon: '🎁', name: reward.name, sub: '消耗 ' + reward.cost + ' 分', url: '/pages/rewards/rewards' });
      }
    });
    // 文章：同时包含内置文章与用户发布的育儿干货。
    ((g.discoverArticles || mock.discoverArticles).concat(getCommunityArticles() || [])).forEach(article => {
      if (matchesSearch(key, [article.title, article.summary, article.content, article.category, article.tag])) {
        add({ key: 'article-' + article.id, type: '文章', icon: '📰', name: article.title, sub: article.category || article.tag || '育儿干货', url: '/pages/article-detail/article-detail?id=' + encodeURIComponent(article.id) });
      }
    });
    // 案例
    (g.cases || mock.cases).forEach(item => {
      if (matchesSearch(key, [item.title, item.summary, item.content, item.course, item.nick])) {
        add({ key: 'case-' + item.id, type: '案例', icon: '💬', name: item.title, sub: item.course || '学员案例', url: '/pages/case-detail/case-detail?id=' + encodeURIComponent(item.id) });
      }
    });
    this.setData({ searchResults: res.slice(0, 20) });
  },
  goSearchItem(e) {
    const url = e.currentTarget.dataset.url;
    const tabs = ['/pages/index/index', '/pages/tasks/tasks', '/pages/discover/discover', '/pages/profile/profile'];
    if (tabs.indexOf(url) > -1) {
      wx.switchTab({ url });
    } else {
      wx.navigateTo({ url });
    }
  },
  goQuick(e) {
    const { url, tab } = e.currentTarget.dataset;
    if (tab) {
      wx.switchTab({ url });
    } else {
      wx.navigateTo({ url });
    }
  },
  toggleToday(e) {
    const id = e.currentTarget.dataset.id;
    const g = app.globalData;
    const idx = g.todayTasks.findIndex(t => t.id === id);
    if (idx < 0) return;
    const res = store.toggleDaily(idx);
    if (res) {
      wx.showToast({ title: res.delta > 0 ? '打卡 +' + res.delta + ' 分' : '已取消打卡', icon: 'none' });
      this.refresh();
    }
  }
});
