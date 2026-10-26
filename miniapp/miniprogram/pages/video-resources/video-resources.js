const store = require('../../utils/store.js');

Page({
  data: { resources: [], isParent: false },
  onShow() { this.setData({ resources: store.getParentVideoResources(), isParent: store.isParentMode() }); },
  play(e) {
    const item = this.data.resources.find(resource => resource.id === e.currentTarget.dataset.id);
    if (item) wx.navigateTo({ url: '/pages/video-player/video-player?url=' + encodeURIComponent(item.url) + '&title=' + encodeURIComponent(item.title) });
  },
  manage() { if (store.isParentMode()) wx.navigateTo({ url: '/pages/video-resource-manage/video-resource-manage' }); }
});
