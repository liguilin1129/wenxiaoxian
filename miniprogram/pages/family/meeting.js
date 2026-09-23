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

function reviewTopic(type, title, content, target) {
  return {
    id: topicId(), type, title, content, approved: true,
    target: target || { name: '', points: '' }
  };
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
  onLoad(options) {
    this.openReviewOnShow = options && options.review === '1';
  },
  onShow() {
    if (this.openReviewOnShow) {
      this.openReviewOnShow = false;
      this.openReviewForm();
    } else this.refreshList();
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
  // 从成长报告进入时，自动带入本次评分、重点方向和正在执行的目标，家长仍可编辑每条议题。
  openReviewForm() {
    const assessment = store.getAssessment();
    const trend = store.getAssessmentTrend();
    const goals = store.getGrowthGoals().filter(item => item.status === 'active');
    const scoreText = assessment ? ('本次综合 ' + assessment.overall + ' 分，等级“' + assessment.levelName + '”。' + (trend.previous ? ('较上次 ' + (trend.overallDelta > 0 ? '+' : '') + trend.overallDelta + ' 分。') : '这是第一次评估结果。')) : '暂未完成成长评估。';
    const focusText = assessment ? ('优势方向：' + assessment.strength.name + '；本期优先关注：' + assessment.focus.name + '。请讨论哪些做法需要保留或调整。') : '请讨论本期最值得持续练习的一项成长方向。';
    const goalText = goals.length ? ('正在进行：' + goals.map(item => item.name + '（第 ' + (item.currentStage + 1) + ' 阶段）').join('、') + '。') : '当前还没有进行中的成长目标，可根据评分结果决定是否开启。';
    const focusName = assessment && assessment.focus ? assessment.focus.name : '';
    this.setData({
      meetings: store.getMeetings() || [],
      mode: 'form', current: null, summary: '',
      form: {
        title: '本期成长复盘会议',
        topics: [
          reviewTopic('custom', '回顾本期成长评分', scoreText),
          reviewTopic('custom', '讨论重点成长方向', focusText),
          reviewTopic('custom', '确认目标推进情况', goalText),
          reviewTopic('task', '确定本周行动', '根据复盘结果，填写一项全家同意、容易坚持的具体行动。', { name: focusName ? ('练习“' + focusName + '”的一项小行动') : '', points: '5' })
        ]
      }
    });
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
