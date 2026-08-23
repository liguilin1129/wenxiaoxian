const app = getApp();

// 可选头像（默认"贤"文字头像 + 一组可爱 emoji）
const AVATARS = ['贤', '🦊', '🐱', '🐰', '🐻', '🦁', '🐼', '🐯', '🐶', '🐸', '🦄', '🌟', '🍎'];
const GENDERS = ['男', '女', '保密'];

Page({
  data: {
    avatars: AVATARS,
    genders: GENDERS,
    avatar: '贤',
    name: '',
    genderIndex: 0,
    birthday: '',
    motto: ''
  },

  onLoad() {
    const c = app.globalData.child || {};
    let gi = c.gender ? GENDERS.indexOf(c.gender) : -1;
    if (gi < 0) gi = 0;
    this.setData({
      avatar: c.avatar || '贤',
      name: c.name || '',
      genderIndex: gi,
      birthday: c.birthday || '',
      motto: c.motto || ''
    });
  },

  pickAvatar(e) {
    this.setData({ avatar: e.currentTarget.dataset.a });
  },

  onName(e) { this.setData({ name: e.detail.value }); },
  onGender(e) { this.setData({ genderIndex: Number(e.detail.value) }); },
  onBirthday(e) { this.setData({ birthday: e.detail.value }); },
  onMotto(e) { this.setData({ motto: e.detail.value }); },

  save() {
    const d = this.data;
    if (!d.name.trim()) {
      wx.showToast({ title: '请填写昵称', icon: 'none' });
      return;
    }
    const profile = {
      avatar: d.avatar,
      name: d.name.trim(),
      gender: d.genders[d.genderIndex],
      birthday: d.birthday,
      motto: d.motto.trim()
    };
    // 同步到全局 + 本地持久化（刷新不丢）
    app.globalData.child = Object.assign({}, app.globalData.child, profile);
    wx.setStorageSync('childProfile', profile);
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 600);
  },

  cancel() { wx.navigateBack(); }
});
