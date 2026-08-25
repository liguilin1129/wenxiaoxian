const app = getApp();
const store = require('../../utils/store.js');

const TEMPLATES = [
  { type: 'task', name: '新增任务' },
  { type: 'reward', name: '新增心愿' },
  { type: 'rule', name: '积分规则' },
  { type: 'custom', name: '自定义' }
];

const TYPE_NAMES = {
  task: '新增任务',
  reward: '新增心愿',
  rule: '积分规则',
  custom: '自定义'
};

function topicId() {
  return 'tp_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
}

Page({
  data: {
    mode: 'list',
    meetings: [],
    templates: TEMPLATES,
    form: { title: '', topics: [] },
    current: null,
    summary: ''
  },
  onShow() {
    this.refreshList();
  },
  refreshList() {
    const meetings = store.getMeetings() || [];
    this.setData({ meetings: meetings, mode: 'list', current: null, form: { title: '', topics: [] }, summary: '' });
  },
  toggleMode() {
    if (this.data.mode === 'list') {
      this.setData({ mode: 'form' });
    } else {
      this.refreshList();
    }
  },
  topicTypeName(type) {
    return TYPE_NAMES[type] || type;
  },

  // 表单：会议主题
  onTitle(e) {
    const form = this.data.form;
    form.title = e.detail.value;
    this.setData({ form: form });
  },

  // 表单：添加议题模板
  addTopic(e) {
    const type = e.currentTarget.dataset.type;
    const topic = {
      id: topicId(),
      type: type,
      title: '',
      content: '',
      approved: true,
      target: { name: '', points: '' }
    };
    if (type === 'task') {
      topic.title = '新增每日任务';
      topic.target = { name: '', points: '5' };
    } else if (type === 'reward') {
      topic.title = '新增一个心愿';
      topic.target = { name: '', points: '50' };
    } else if (type === 'rule') {
      topic.title = '调整积分规则';
      topic.target = { name: '', points: '' };
    }
    const form = this.data.form;
    form.topics.push(topic);
    this.setData({ form: form });
  },

  // 表单：移除议题
  removeTopic(e) {
    const idx = Number(e.currentTarget.dataset.idx);
    const form = this.data.form;
    form.topics.splice(idx, 1);
    this.setData({ form: form });
  },

  // 表单：编辑议题字段
  onTopic(e) {
    const idx = Number(e.currentTarget.dataset.idx);
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    const form = this.data.form;
    const topic = form.topics[idx];
    if (field === 'targetName') topic.target.name = value;
    else if (field === 'targetPoints') topic.target.points = value;
    else topic[field] = value;
    this.setData({ form: form });
  },

  // 创建会议
  createMeeting() {
    const form = this.data.form;
    const title = form.title.trim();
    if (!title) {
      wx.showToast({ title: '请填写会议主题', icon: 'none' });
      return;
    }
    if (!form.topics.length) {
      wx.showToast({ title: '请至少添加一个议题', icon: 'none' });
      return;
    }
    const now = new Date();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const h = now.getHours();
    const min = now.getMinutes();
    const meeting = {
      id: 'm_' + Date.now(),
      title: title,
      date: (m < 10 ? '0' + m : m) + '-' + (d < 10 ? '0' + d : d),
      time: (h < 10 ? '0' + h : h) + ':' + (min < 10 ? '0' + min : min),
      status: 'pending',
      topics: form.topics,
      summary: ''
    };
    store.createMeeting(meeting);
    wx.showToast({ title: '会议已创建', icon: 'success' });
    this.refreshList();
  },

  // 打开会议详情
  openMeeting(e) {
    const id = e.currentTarget.dataset.id;
    const meetings = store.getMeetings() || [];
    const current = meetings.find(m => m.id === id);
    if (!current) return;
    this.setData({ mode: 'detail', current: current, summary: current.summary || '' });
  },

  // 切换议题通过状态
  toggleApprove(e) {
    const idx = Number(e.currentTarget.dataset.idx);
    const current = this.data.current;
    current.topics[idx].approved = !current.topics[idx].approved;
    this.setData({ current: current });
    store.updateMeeting(current);
  },

  // 纪要输入
  onSummary(e) {
    this.setData({ summary: e.detail.value });
  },

  // 结束会议并落地
  closeMeeting() {
    const current = this.data.current;
    const approved = current.topics.filter(t => t.approved);
    if (!approved.length) {
      wx.showModal({
        title: '提示',
        content: '当前没有通过的议题，确定要结束会议吗？',
        success: (res) => {
          if (res.confirm) this.doClose(current);
        }
      });
      return;
    }
    this.doClose(current);
  },
  doClose(current) {
    const summary = this.data.summary.trim();
    const ok = store.closeMeeting(current.id, summary);
    if (!ok) {
      wx.showToast({ title: '结束失败', icon: 'none' });
      return;
    }
    wx.showToast({ title: '决议已落地', icon: 'success' });
    setTimeout(() => this.refreshList(), 500);
  }
});
