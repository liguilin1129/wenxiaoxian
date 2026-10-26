const store = require('../../utils/store');
// 只读家庭实践模板，不自动创建任务、修改积分或调用 AI。
const TEMPLATES = [
  { id: 'meeting', name: '家庭会议', steps: ['每人分享一件本周做得好的事。', '轮流说出一个希望一起解决的问题，先倾听。', '共同约定一项行动、执行人和复盘时间。'] },
  { id: 'habit', name: '好习惯养成', steps: ['让孩子选一个愿意尝试的小习惯。', '商定具体行动、执行时间和适合的奖励。', '每天记录，遇到困难时在家庭会议中调整。'] },
  { id: 'reading', name: '亲子阅读', steps: ['和孩子一起选择感兴趣的内容。', '约定一段双方都能坚持的阅读时间。', '阅读后各自分享一个发现，不急着考核。'] },
  { id: 'review', name: '成长复盘', steps: ['一起查看本期任务记录和成长报告。', '肯定具体进步，倾听孩子遇到的困难。', '决定哪些目标继续、暂停、完成或替换。'] }
];
Page({
  data: { allowed: false, templates: TEMPLATES, expanded: '' },
  onShow() { this.setData({ allowed: !!store.isSigned() && store.isParentMode() }); },
  toggle(e) {
    if (!store.isSigned() || !store.isParentMode()) return;
    const id = e.currentTarget.dataset.id;
    if (TEMPLATES.some(item => item.id === id)) this.setData({ expanded: this.data.expanded === id ? '' : id });
  }
});
