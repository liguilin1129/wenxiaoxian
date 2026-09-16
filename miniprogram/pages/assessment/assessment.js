const app = getApp();
const store = require('../../utils/store.js');

const QUESTIONS = [
  { dim: 'heart', title: '孩子愿意遵守和家人一起约定的规则。' },
  { dim: 'heart', title: '孩子遇到不顺心的事，能在家长陪伴下慢慢平静下来。' },
  { dim: 'heart', title: '孩子会主动关心家人，愿意表达感谢或道歉。' },
  { dim: 'body', title: '孩子大多数时候能按约定时间睡觉和起床。' },
  { dim: 'body', title: '孩子愿意参与运动、户外活动或家务劳动。' },
  { dim: 'body', title: '孩子能在家长提醒下保持较规律的饮食习惯。' },
  { dim: 'habit', title: '孩子能完成当天约定的学习或生活任务。' },
  { dim: 'habit', title: '孩子会整理自己的物品，并在提醒后放回原处。' },
  { dim: 'habit', title: '孩子使用电子产品时，能遵守约定的时长。' },
  { dim: 'taste', title: '孩子愿意阅读、听故事或了解新的知识。' },
  { dim: 'taste', title: '孩子愿意尝试绘画、音乐、手工等创造活动。' },
  { dim: 'taste', title: '孩子能尊重公共环境，保持基本礼貌与整洁。' }
];

const OPTIONS = [
  { value: '0', label: '从不' }, { value: '1', label: '偶尔' }, { value: '2', label: '经常' }, { value: '3', label: '基本做到' }
];

const TASK_TEMPLATES = {
  heart: [
    { name: '今天主动说一句谢谢', points: 5, frequency: 'daily', deadlineDays: 7 },
    { name: '睡前分享一件开心或烦恼的事', points: 5, frequency: 'daily', deadlineDays: 7 }
  ],
  body: [
    { name: '完成 20 分钟户外运动', points: 10, frequency: 'daily', deadlineDays: 7 },
    { name: '今晚按约定时间准备睡觉', points: 5, frequency: 'daily', deadlineDays: 7 }
  ],
  habit: [
    { name: '完成后整理自己的物品', points: 5, frequency: 'daily', deadlineDays: 7 },
    { name: '按约定时长使用电子产品', points: 10, frequency: 'daily', deadlineDays: 7 }
  ],
  taste: [
    { name: '阅读或听故事 15 分钟', points: 10, frequency: 'daily', deadlineDays: 7 },
    { name: '完成一次小创作或手工', points: 10, frequency: 'once', deadlineDays: 1 }
  ]
};

function deadlineAfter(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

function buildRecommendations(result) {
  if (!result || !Array.isArray(result.dimensions)) return [];
  return result.dimensions.slice().sort((a, b) => a.score - b.score).slice(0, 2).reduce((list, dim) => {
    return list.concat((TASK_TEMPLATES[dim.key] || []).map((task, index) => Object.assign({}, task, {
      id: dim.key + '_' + index,
      dim: dim.key,
      dimName: dim.name,
      deadline: deadlineAfter(task.deadlineDays)
    })));
  }, []);
}

Page({
  data: { questions: QUESTIONS, options: OPTIONS, answers: {}, result: null, recommendations: [], addedNames: {} },
  onLoad() {
    const result = store.getAssessment();
    this.setData({ result: result, recommendations: buildRecommendations(result) });
  },
  choose(e) {
    const index = e.currentTarget.dataset.index;
    const answers = Object.assign({}, this.data.answers, { [index]: e.detail.value });
    this.setData({ answers: answers });
  },
  submit() {
    const answers = this.data.answers;
    if (Object.keys(answers).length < QUESTIONS.length) {
      wx.showToast({ title: '请完成全部 12 道题目', icon: 'none' });
      return;
    }
    const meta = [
      { key: 'heart', name: '好身心' }, { key: 'body', name: '好身体' },
      { key: 'habit', name: '好习惯' }, { key: 'taste', name: '好品味' }
    ];
    const dimensions = meta.map(item => {
      const indexes = QUESTIONS.map((q, index) => q.dim === item.key ? index : -1).filter(index => index >= 0);
      const total = indexes.reduce((sum, index) => sum + Number(answers[index] || 0), 0);
      return { key: item.key, name: item.name, score: Math.round(total / (indexes.length * 3) * 100), answerCount: indexes.length };
    });
    const result = store.saveAssessment({ dimensions: dimensions });
    app.globalData.assessment = result;
    this.setData({ result: result, recommendations: buildRecommendations(result), addedNames: {} });
    wx.showToast({ title: '初评已生成', icon: 'success' });
  },
  retake() { this.setData({ result: null, answers: {}, recommendations: [], addedNames: {} }); },
  addRecommendation(e) {
    const id = e.currentTarget.dataset.id;
    const task = this.data.recommendations.find(item => item.id === id);
    if (!task) return;
    const exists = store.getCustomTasks().some(item => item.active && item.name === task.name);
    if (exists) {
      wx.showToast({ title: '该任务已在任务列表中', icon: 'none' });
      return;
    }
    const child = app.globalData.child || {};
    const created = store.addCustomTask({ name: task.name, points: task.points, dim: task.dim, frequency: task.frequency, deadline: task.deadline, assignee: child.name || '孩子' });
    if (!created) return wx.showToast({ title: '添加失败，请稍后重试', icon: 'none' });
    this.setData({ addedNames: Object.assign({}, this.data.addedNames, { [task.name]: true }) });
    wx.showToast({ title: task.frequency === 'daily' ? '已加入每日打卡' : '已加入今日打卡', icon: 'success' });
  },
  goTaskManage() { wx.navigateTo({ url: '/pages/task-manage/task-manage' }); },
  goReport() { wx.navigateTo({ url: '/pages/report/report' }); }
});
