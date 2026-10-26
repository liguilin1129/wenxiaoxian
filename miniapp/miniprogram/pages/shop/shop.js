const catalog = require('../../utils/shop-catalog');
Page({
  data: { products: [], filteredProducts: [], categories: [], activeCategory: 'all' },
  onLoad(options) { this._productId = options && options.productId; },
  onReady() {
    const id = this._productId;
    this._productId = null; // Returning from detail must not reopen it.
    if (id) this.openProduct(id);
  },
  onShow() {
    const products = catalog.getProducts();
    const categoryNames = Array.from(new Set(products.map(item => item.category).filter(Boolean)));
    const categories = [{ id: 'all', name: '全部好物' }].concat(categoryNames.map(name => ({ id: name, name: name })));
    const activeCategory = categories.some(item => item.id === this.data.activeCategory) ? this.data.activeCategory : 'all';
    this.setData({ products: products, categories: categories, activeCategory: activeCategory, filteredProducts: this.filterProducts(products, activeCategory) });
  },
  filterProducts(products, category) { return category === 'all' ? products : products.filter(item => item.category === category); },
  chooseCategory(e) {
    const activeCategory = e.currentTarget.dataset.id;
    this.setData({ activeCategory: activeCategory, filteredProducts: this.filterProducts(this.data.products, activeCategory) });
  },
  goRewards() { wx.navigateTo({ url: '/pages/rewards/rewards' }); },
  goProduct(e) { this.openProduct(e.currentTarget.dataset.id); },
  openProduct(id) {
    if (!catalog.getProduct(id)) return wx.showToast({ title: '商品暂不可用', icon: 'none' });
    if (this._openingProduct) return;
    this._openingProduct = true;
    wx.navigateTo({ url: '/pages/product-detail/product-detail?id=' + encodeURIComponent(id),
      complete: () => { this._openingProduct = false; } });
  }
});
