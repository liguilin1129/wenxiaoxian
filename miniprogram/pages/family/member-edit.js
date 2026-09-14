const store = require('../../utils/store.js');

Page({
  data: { member: null, mode: 'edit', name: '', role: '家长', previewAvatar: '' },
  onLoad(query) {
    if (query.mode === 'add') {
      this.setData({ mode: 'add', previewAvatar: '新' });
      wx.setNavigationBarTitle({ title: '添加家庭成员' });
      return;
    }
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
    if (this.data.mode === 'add') {
      if (!store.addFamilyMember({ name: this.data.name, role: this.data.role })) return wx.showToast({ title: '请填写成员名称', icon: 'none' });
      wx.showToast({ title: '成员已添加', icon: 'success' });
      return setTimeout(() => wx.navigateBack(), 400);
    }
    if (!store.updateFamilyMember({ id: this.data.member.id, name: this.data.name, role: this.data.role })) {
      return wx.showToast({ title: '请填写成员名称', icon: 'none' });
    }
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 400);
  },
  remove() {
    wx.showModal({
      title: '删除家庭成员？',
      content: '仅从当前家庭列表移除，不会删除该成员的登录账号或成长数据。',
      confirmText: '删除',
      confirmColor: '#E5484D',
      success: (result) => {
        if (!result.confirm) return;
        const removed = store.removeFamilyMember(this.data.member.id);
        if (!removed.ok) return wx.showToast({ title: removed.reason === 'LAST_MEMBER' ? '至少保留一名家庭成员' : '删除失败', icon: 'none' });
        wx.showToast({ title: '已删除', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 400);
      }
    });
  }
});
