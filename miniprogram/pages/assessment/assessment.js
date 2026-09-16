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

Page({
  data: { questions: QUESTIONS, options: OPTIONS, answers: {}, result: null },
  onLoad() { this.setData({ result: store.getAssessment() }); },
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
    this.setData({ result: result });
    wx.showToast({ title: '初评已生成', icon: 'success' });
  },
  retake() { this.setData({ result: null, answers: {} }); },
  goReport() { wx.navigateTo({ url: '/pages/report/report' }); }
});
