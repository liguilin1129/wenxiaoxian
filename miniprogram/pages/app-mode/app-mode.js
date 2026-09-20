const store = require('../../utils/store.js');
Page({ data:{mode:'parent'}, onShow(){this.setData({mode:store.getAppMode()})}, select(e){const mode=store.setAppMode(e.currentTarget.dataset.mode);this.setData({mode});wx.showToast({title:mode==='parent'?'已切换家长模式':'已切换孩子模式',icon:'none'})} });
