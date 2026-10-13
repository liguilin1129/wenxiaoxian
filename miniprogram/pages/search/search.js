const app = getApp();
const store = require('../../utils/store.js');
const mock = require('../../utils/mock.js');
const { getCommunityArticles } = require('../../utils/community-article-data.js');
function matchesSearch(query, values) {
  const words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
  const source = values.map(value => String(value || '')).join(' ').toLowerCase();
  return words.length > 0 && words.every(word => source.indexOf(word) > -1);
}
Page({
  data: { searchKey: '', searchResults: [], suggestions: ['任务', '论语', '成长银行'] },
  onSearchInput(e) {
    const key = (e.detail.value || '').trim();
    this.setData({ searchKey: key }); this.runSearch(key);
  },
  onSearchConfirm() { this.runSearch(this.data.searchKey); },
  clearSearch() { this.setData({ searchKey: '', searchResults: [] }); },
  chooseSuggestion(e) { const key = e.currentTarget.dataset.key; this.setData({ searchKey: key }); this.runSearch(key); },
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
    [
      { key: 'bank', name: '成长银行', sub: '成长记录 · 五育积累', url: '/pages/growth-bank/growth-bank' },
      { key: 'tasks', name: '任务中心', sub: '查看任务与打卡', url: '/pages/tasks/tasks' },
      { key: 'learning', name: '学习中心', sub: '经典学习与阅读', url: '/pages/classics/classics' }
    ].forEach(item => { if (matchesSearch(key, [item.name, item.sub])) add(Object.assign({ type: '功能', icon: '›' }, item)); });

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
        add({ key: 'custom-task-' + task.id, type: '任务', icon: '✅', name: task.name, sub: '家长新增 · ' + (task.assignee || '孩子'), url: store.isParentMode() ? '/pages/task-manage/task-manage' : '/pages/tasks/tasks' });
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

});
