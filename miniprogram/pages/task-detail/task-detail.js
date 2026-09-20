const app = getApp();
const store = require('../../utils/store');

Page({
  data: { task: {}, detail: {}, meta: {}, points: 0, status: 'todo', note: '', evidence: [] },
  onLoad(query) {
    const id = query.id;
    const g = app.globalData;
    let task = null;
    let dimName = '';
    let total = 0;
    g.tasks.forEach(group => {
      const found = group.list.find(t => t.id === id);
      if (found) {
        task = found;
        dimName = group.dimName;
        // 「奖励总分」与任务中心口径一致（toggleCenter 实际加的分），避免显示与加分不符
        total = found.rewards.reduce((s, r) => s + r.points, 0);
      }
    });
    const detail = g.taskDetail[id] || { purpose: '', neigong: '—', classic: '—', rewards: [], methods: '' };
    const dim = g.dimensions.find(d => d.key === (task ? task.dim : '')) || {};
    const status = store.getCenterStatus(id);
    this.setData({
      task: task,
      detail: detail,
      meta: { dimName: dimName, dark: dim.dark || '#4F46E5' },
      points: total,
      status: status
    });
    if (task) {
      wx.setNavigationBarTitle({ title: task.name });
    }
  },
  checkin() {
    if (!this.data.points) {
      wx.showToast({ title: '该任务暂无积分奖励', icon: 'none' });
      return;
    }
    if (this.data.status === 'approved') {
      wx.showToast({ title: '家长已确认，积分已入账', icon: 'none' });
      return;
    }
    if (this.data.status === 'pending') {
      wx.showToast({ title: '已提交，等待家长确认', icon: 'none' });
      return;
    }
    const res = store.submitCenter(this.data.task.id, this.data.note, this.data.evidence);
    if (!res) {
      wx.showToast({ title: '任务不存在', icon: 'none' });
      return;
    }
    this.setData({ status: res.status });
    wx.showToast({ title: '已提交，等待家长确认', icon: 'none' });
  },
  onNoteInput(e) {
    this.setData({ note: (e.detail.value || '').slice(0, 80) });
  },
  chooseEvidence() {
    const remain = 3 - this.data.evidence.length;
    if (remain <= 0) return wx.showToast({ title: '最多添加 3 个证明材料', icon: 'none' });
    wx.chooseMedia({ count: remain, mediaType: ['image', 'video'], sourceType: ['album', 'camera'], success: res => {
      const fs = wx.getFileSystemManager();
      const tasks = res.tempFiles.map(file => new Promise(resolve => fs.saveFile({ tempFilePath: file.tempFilePath, success: saved => resolve({ path: saved.savedFilePath, thumb: file.thumbTempFilePath || saved.savedFilePath, type: file.fileType }), fail: () => resolve(null) })));
      Promise.all(tasks).then(items => this.setData({ evidence: this.data.evidence.concat(items.filter(Boolean)) }));
    } });
  },
  removeEvidence(e) { const list = this.data.evidence.slice(); list.splice(e.currentTarget.dataset.index, 1); this.setData({ evidence: list }); },
  previewEvidence(e) { const list = this.data.evidence; wx.previewMedia({ sources: list.map(item => ({ url: item.path, type: item.type, poster: item.thumb || item.path })), current: e.currentTarget.dataset.index }); }
});
