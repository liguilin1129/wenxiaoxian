const app = getApp();
const store = require('../../utils/store.js');

Page({
  data: {
    step: 0,            // 0=召开家庭会议 1=商议合约 2=签订合约
    dims: [],
    agenda: [],         // 合约条款，逐条商议
    allAgreed: false
  },

  onLoad() {
    if (store.isSigned()) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    const dims = app.globalData.dimensions;
    // 家庭会议需共同商定的合约条款：四维权重 + 一条共同约定
    const agenda = dims.map(d => ({
      key: d.key,
      name: d.name,
      weight: d.weight,
      color: d.color,
      desc: d.desc,
      agreed: false
    }));
    agenda.push({
      key: 'rule',
      name: '共同约定',
      weight: '',
      color: '#6366F1',
      desc: '积分规则由家庭会议共同商定，可随时复盘调整',
      agreed: false
    });
    this.setData({ dims, agenda });
  },

  // 第一步：进入会议，开始商议
  enterMeeting() {
    this.setData({ step: 1 });
  },

  // 第二步：逐项同意/保留
  toggleAgree(e) {
    const i = e.currentTarget.dataset.i;
    const agenda = this.data.agenda;
    agenda[i].agreed = !agenda[i].agreed;
    const allAgreed = agenda.every(a => a.agreed);
    this.setData({ agenda, allAgreed });
  },

  // 第二步：全部同意后提交表决
  submitVote() {
    if (!this.data.allAgreed) {
      wx.showToast({ title: '还有条款未达成一致', icon: 'none' });
      return;
    }
    this.setData({ step: 2 });
  },

  // 第三步：全体举手通过，签订合约
  signAndStart() {
    store.signContract();
    wx.reLaunch({ url: '/pages/index/index' });
  }
});
