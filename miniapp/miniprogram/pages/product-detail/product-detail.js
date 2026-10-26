const catalog = require('../../utils/shop-catalog');
Page({
  data: { product: null, selectedSkuId: '', selectedSkuName: '' },
  onLoad(options) { this._id = options && options.id; this._preview = options && options.preview === '1'; },
  onShow() {
    const product = catalog.getProduct(this._id) || (this._preview ? {
      id: this._id,
      isPreview: true,
      name: '商品详细信息',
      priceText: '—',
      description: '商品信息正在准备中，正式的图片、价格、规格与购买服务将由商城后台发布。',
      highlights: ['商品图片展示位', '价格与规格展示位', '商品介绍展示位']
    } : null);
    const rate = product && Math.min(0.05, Math.max(0, Number(product.pointsDeductionRate) || 0));
    const detail = product && Object.assign({}, product, {
      pointsDeductionText: rate ? ('任务积分最多抵扣 ' + Math.round(rate * 100) + '%') : '',
      gallery: (product.images && product.images.length ? product.images : (product.image ? [product.image] : [])),
      highlights: product.highlights || [],
      tags: product.tags || [],
      skuOptions: product.skuOptions || [],
      serviceTags: product.serviceTags || ['正品保障', '7天无理由'],
      attributes: product.attributes || [],
      salesText: product.salesText || '',
      promotion: product.promotion || '',
      deliveryText: product.deliveryText || '发货与配送信息以后台发布为准'
    });
    this.setData({ product: detail, selectedSkuId: detail && detail.skuOptions[0] ? detail.skuOptions[0].id : '', selectedSkuName: detail && detail.skuOptions[0] ? detail.skuOptions[0].name : '' });
  },
  goShop() {
    const pages = getCurrentPages();
    if (pages.length > 1 && pages[pages.length - 2].route === 'pages/shop/shop') {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.redirectTo({ url: '/pages/shop/shop' });
    }
  },
  chooseSku(e) {
    const sku = (this.data.product.skuOptions || []).find(item => item.id === e.currentTarget.dataset.id);
    if (sku) this.setData({ selectedSkuId: sku.id, selectedSkuName: sku.name });
  },
  showPending() { wx.showToast({ title: '购买服务即将开放', icon: 'none' }); },
  showService() { wx.showToast({ title: '客服服务即将接入', icon: 'none' }); },
  showCart() { wx.showToast({ title: '购物车即将开放', icon: 'none' }); }
});
