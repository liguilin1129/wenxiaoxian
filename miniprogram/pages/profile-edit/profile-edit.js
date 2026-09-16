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
    height: '',
    weight: '',
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
      height: c.height || '',
      weight: c.weight || '',
      motto: c.motto || ''
    });
  },

  pickAvatar(e) {
    this.setData({ avatar: e.currentTarget.dataset.a });
  },

  onName(e) { this.setData({ name: e.detail.value }); },
  onGender(e) { this.setData({ genderIndex: Number(e.detail.value) }); },
  onBirthday(e) { this.setData({ birthday: e.detail.value }); },
  onHeight(e) { this.setData({ height: e.detail.value }); },
  onWeight(e) { this.setData({ weight: e.detail.value }); },
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
      height: Number(d.height) || '',
      weight: Number(d.weight) || '',
      motto: d.motto.trim()
    };
    // 资料编辑只更新本页字段，保留微信授权头像地址等其它已缓存资料。
    const saved = wx.getStorageSync('childProfile');
    const fullProfile = Object.assign({}, saved && typeof saved === 'object' ? saved : {}, profile);
    app.globalData.child = Object.assign({}, app.globalData.child, fullProfile);
    wx.setStorageSync('childProfile', fullProfile);
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 600);
  },

  cancel() { wx.navigateBack(); }
});
