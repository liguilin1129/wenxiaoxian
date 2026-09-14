const store = require('../../utils/store.js');

Page({
  data: { member: null, name: '', role: '家长', previewAvatar: '' },
  onLoad(query) {
    const member = store.getFamilyMembers().find(item => item.id === query.id);
    if (!member) {
      wx.showToast({ title: '成员不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 400);
      return;
    }
    this.setData({ member: member, name: member.name, role: member.role, previewAvatar: member.avatar });
  },
  onName(e) {
    const name = e.detail.value;
    this.setData({ name: name, previewAvatar: name.trim().slice(0, 1) || this.data.member.avatar });
  },
  onRole(e) { this.setData({ role: e.detail.value }); },
  save() {
    if (!store.updateFamilyMember({ id: this.data.member.id, name: this.data.name, role: this.data.role })) {
      return wx.showToast({ title: '请填写成员名称', icon: 'none' });
    }
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 400);
  }
});
