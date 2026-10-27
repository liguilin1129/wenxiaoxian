const catalog = require('../../utils/shop-catalog');
Page({
  data: {
    products: [], filteredProducts: [], categories: [], activeCategory: 'all',
    topics: [
      { id: 'new', name: '新品上线', mark: '新' },
      { id: 'brand', name: '品牌专区', mark: '品' },
      { id: 'parent', name: '家长甄选', mark: '选' },
      { id: 'growth', name: '成长装备', mark: '长' },
      { id: 'more', name: '更多分类', mark: '⋮' }
    ]
  },
  onLoad(options) { this._productId = options && options.productId; },
  onReady() {
    const id = this._productId;
    this._productId = null; // Returning from detail must not reopen it.
    if (id) this.openProduct(id);
  },
  onShow() {
    const products = catalog.getProducts();
    const categoryNames = Array.from(new Set(products.map(item => item.category).filter(Boolean)));
    const defaultCategories = [
      { id: 'all', name: '推荐' }, { id: 'new', name: '新品' }, { id: 'reading', name: '阅读' },
      { id: 'family', name: '家庭' }, { id: 'growth', name: '成长' }
    ];
    const categories = categoryNames.length ? [{ id: 'all', name: '推荐' }].concat(categoryNames.map(name => ({ id: name, name: name }))) : defaultCategories;
    const activeCategory = categories.some(item => item.id === this.data.activeCategory) ? this.data.activeCategory : 'all';
    this.setData({ products: products, categories: categories, activeCategory: activeCategory, filteredProducts: this.filterProducts(products, activeCategory) });
  },
  filterProducts(products, category) { return category === 'all' ? products : products.filter(item => item.category === category); },
  chooseCategory(e) {
    const activeCategory = e.currentTarget.dataset.id;
    this.setData({ activeCategory: activeCategory, filteredProducts: this.filterProducts(this.data.products, activeCategory) });
  },
  openShopSearch() { wx.showToast({ title: '商品搜索即将开放', icon: 'none' }); },
  openTopic() { wx.showToast({ title: '专题内容即将开放', icon: 'none' }); },
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
