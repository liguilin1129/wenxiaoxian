const assert = require('assert');
const fs = require('fs');
const catalog = require('../miniprogram/utils/shop-catalog');
assert.deepEqual(catalog.getProducts(), []);
let page, url, toast, backDelta;
let stack = [{route:'pages/index/index'}];
global.Page = value => { page=value; page.setData=values=>Object.assign(page.data,values); };
global.getApp = () => ({globalData:{}});
global.getCurrentPages = () => stack;
global.wx = {
  navigateTo:options=>{url=options.url; stack.push({route:url.split('?')[0].slice(1)}); if(options.complete)options.complete();},
  navigateBack:options=>{backDelta=options.delta; stack.splice(-options.delta);},
  redirectTo:options=>{url=options.url; stack[stack.length-1]={route:url.slice(1)};},
  showToast:options=>{toast=options.title;}
};
require('../miniprogram/pages/shop/shop');
page.onShow(); assert.deepEqual(page.data.products,[]);
const shop=page;
catalog.getProducts=()=>[{id:'fixture',name:'测试商品（仅内存）',image:'/test.png',priceText:'10.00'}];
page.onShow(); assert.equal(page.data.products[0].id,'fixture');
require('../miniprogram/pages/index/index');
const home=page;
home.goProduct({currentTarget:{dataset:{id:'fixture'}}});
assert.equal(url,'/pages/product-detail/product-detail?id=fixture');
assert.deepEqual(stack.map(item=>item.route),['pages/index/index','pages/product-detail/product-detail']);
require('../miniprogram/pages/product-detail/product-detail');
const detail=page;
detail.onLoad({id:'fixture'}); detail.onShow(); assert.equal(detail.data.product.id,'fixture');
detail.goShop(); assert.equal(url,'/pages/shop/shop'); assert.equal(stack[stack.length-1].route,'pages/shop/shop');
const length=stack.length;
shop.onShow(); shop.onReady(); assert.equal(stack.length,length); // 返回后不得自动重开详情。
shop.goProduct({currentTarget:{dataset:{id:'fixture'}}});
assert.equal(stack[stack.length-1].route,'pages/product-detail/product-detail');
detail.goShop();
shop.goProduct({currentTarget:{dataset:{id:'missing'}}});
assert.equal(toast,'商品暂不可用'); assert.equal(stack.length,length);
const saved=url; home.goProduct({currentTarget:{dataset:{id:'missing'}}}); assert.equal(url,saved);
catalog.getProducts=()=>[];
home.goProduct({currentTarget:{dataset:{id:'preview-1'}}}); assert.equal(url,'/pages/product-detail/product-detail?id=preview-1&preview=1');
detail.onLoad({id:'preview-1',preview:'1'}); detail.onShow(); assert(detail.data.product.isPreview);
stack=[{route:'pages/product-detail/product-detail'}];
detail.goShop(); assert.equal(stack[0].route,'pages/shop/shop'); // 独立打开时的返回兜底。
catalog.getProducts=()=>[];
detail.onShow(); assert.equal(detail.data.product,null);
page=shop;
catalog.getProducts=()=>[]; page.onShow(); assert.equal(page.data.products.length,0);
require('../miniprogram/pages/profile/profile');
page.goShop(); assert.equal(url,'/pages/shop/shop');
shop.goRewards(); assert.equal(url,'/pages/rewards/rewards');
const app=JSON.parse(fs.readFileSync('miniprogram/app.json','utf8'));
assert(app.pages.includes('pages/shop/shop'));
assert(!app.tabBar.list.some(item=>item.pagePath==='pages/shop/shop'));
assert(app.pages.includes('pages/product-detail/product-detail'));
for(const route of ['index/index','profile/profile','shop/shop','product-detail/product-detail']) {
  const text=fs.readFileSync('miniprogram/pages/'+route+'.wxml','utf8'), stack=[];
  for(const match of text.matchAll(/<\/?([\w-]+)\b[^>]*>/g)) {
    if(match[0].startsWith('</')) assert.equal(stack.pop(),match[1]);
    else if(!match[0].endsWith('/>')) stack.push(match[1]);
  }
  assert.equal(stack.length,0);
}
assert(fs.readFileSync('miniprogram/pages/index/index.wxss','utf8').includes('grid-template-columns:repeat(2,minmax(0,1fr))'));
assert(fs.readFileSync('miniprogram/pages/profile/profile.js','utf8').includes("name: '官方商城', action: 'goShop'"));
assert(fs.readFileSync('miniprogram/pages/profile/profile.js','utf8').includes("name: '成长银行', action: 'goBank'"));
assert(!fs.readFileSync('miniprogram/pages/profile/profile.wxml','utf8').includes('积分商城'));
assert(fs.readFileSync('miniprogram/pages/shop/shop.wxml','utf8').includes('积分商城'));
assert(fs.readFileSync('miniprogram/pages/shop/shop.wxml','utf8').includes('goRewards'));
assert(fs.readFileSync('miniprogram/pages/shop/shop.wxml','utf8').includes('商城正在筹备'));
console.log('PASS: shop framework, direct home-to-detail navigation, catalog detail, invalid products, direct-entry fallback, profile and reward routes');
