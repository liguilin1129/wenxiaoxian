const app = getApp();
const store = require('../../utils/store.js');

const DIMS = [
  { key: 'heart', name: '好身心', color: '#FB7185' },
  { key: 'body', name: '好身体', color: '#34D399' },
  { key: 'habit', name: '好习惯', color: '#6366F1' },
  { key: 'taste', name: '好品味', color: '#FBBF24' }
];

Page({
  data: {
    mode: 'add',
    id: '',
    name: '',
    cost: '',
    desc: '',
    dimIndex: 3,
    dims: DIMS,
    saveDisabled: true
  },
  onLoad(query) {
    const mode = query.mode || 'add';
    this.setData({ mode: mode });
    wx.setNavigationBarTitle({ title: mode === 'add' ? '新增心愿' : '编辑心愿' });
    if (mode === 'edit') {
      const id = query.id || '';
      const r = (app.globalData.rewards || []).find(x => x.id === id);
      if (r) {
        const di = DIMS.findIndex(d => d.key === r.dim);
        this.setData({
          id: id, name: r.name, cost: String(r.cost), desc: r.desc || '',
          dimIndex: di >= 0 ? di : 3
        });
      }
    }
    this.validate();
  },
  onName(e) { this.setData({ name: e.detail.value }); this.validate(); },
  onCost(e) { this.setData({ cost: e.detail.value }); this.validate(); },
  onDesc(e) { this.setData({ desc: e.detail.value }); },
  onDim(e) { this.setData({ dimIndex: Number(e.detail.value) }); },
  validate() {
    const ok = this.data.name.trim().length > 0 && Number(this.data.cost) > 0;
    this.setData({ saveDisabled: !ok });
  },
  save() {
    if (this.data.saveDisabled) {
      wx.showToast({ title: '请填写名称和有效积分', icon: 'none' });
      return;
    }
    const dim = DIMS[this.data.dimIndex];
    const list = (app.globalData.rewards || []).slice();
    const payload = {
      name: this.data.name.trim(),
      cost: Number(this.data.cost),
      desc: this.data.desc.trim() || '家长自定义心愿',
      dim: dim.key
    };
    if (this.data.mode === 'add') {
      payload.id = 'c' + Date.now();
      list.push(payload);
    } else {
      const idx = list.findIndex(r => r.id === this.data.id);
      if (idx >= 0) list[idx] = Object.assign({}, list[idx], payload);
    }
    store.saveRewards(list);
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 450);
  },
  remove() {
    if (this.data.mode !== 'edit') return;
    const that = this;
    wx.showModal({
      title: '删除心愿', content: '确定删除该心愿？', confirmColor: '#E11D6F',
      success(res) {
        if (res.confirm) {
          const list = (app.globalData.rewards || []).filter(r => r.id !== that.data.id);
          store.saveRewards(list);
          wx.navigateBack();
        }
      }
    });
  }
});
