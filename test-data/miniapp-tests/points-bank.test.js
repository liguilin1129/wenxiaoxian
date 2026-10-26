const assert = require('assert');
const fs = require('fs');
let signed=true, parent=true, page, url, redeemed=0, balance=100;
const app={globalData:{child:{points:0},rewards:[{id:'reward',name:'家庭奖励',cost:20}]}};
const store={
  isSigned:()=>signed, isParentMode:()=>parent,
  getTodayTasks:()=>{app.globalData.child.points=balance;},
  redeem:reward=>{redeemed++; balance-=reward.cost; return {ok:true,points:balance};}
};
require.cache[require.resolve('../miniprogram/utils/store')]={exports:store};
global.getApp=()=>app;
global.Page=value=>{page=value; value.setData=values=>Object.assign(value.data,values);};
global.wx={navigateTo:options=>{url=options.url;},showToast(){}};
require('../miniprogram/pages/rewards/rewards');
page.onShow(); assert.equal(page.data.points,100); assert(page.data.isParent);
page.goPoints(); assert.equal(url,'/pages/points/points');
page.toggleManage(); assert(page.data.manage);
parent=false; page.onShow(); assert(!page.data.manage); assert(!page.data.isParent);
page.toggleManage(); assert(!page.data.manage);
url=null; page.addReward(); page.editReward({currentTarget:{dataset:{id:'reward'}}});
assert.equal(url,null);
page.redeem({currentTarget:{dataset:{id:'reward'}}});
assert.equal(redeemed,1); assert.equal(page.data.points,80);
balance=90; page.onShow(); assert.equal(page.data.points,90);
signed=false; page.onShow(); assert.equal(page.data.points,0); assert.deepEqual(page.data.rewards,[]);
page.redeem({currentTarget:{dataset:{id:'reward'}}});
assert.equal(url,'/pages/login/login'); assert.equal(redeemed,1);
assert.equal(JSON.parse(fs.readFileSync('miniprogram/pages/rewards/rewards.json','utf8')).navigationBarTitleText,'积分银行');
const shop=fs.readFileSync('miniprogram/pages/shop/shop.wxml','utf8');
assert(shop.includes('积分商城')); assert(shop.includes('bindtap="goRewards"'));
const markup=fs.readFileSync('miniprogram/pages/rewards/rewards.wxml','utf8'),stack=[];
assert(markup.includes('bindtap="goPoints"'));
assert(!markup.includes('奖励商城'));
for(const match of markup.matchAll(/<\/?([\w-]+)\b[^>]*>/g)) {
  if(match[0].startsWith('</')) assert.equal(stack.pop(),match[1]);
  else if(!match[0].endsWith('/>')) stack.push(match[1]);
}
assert.equal(stack.length,0);
console.log('PASS: points-bank naming, profile entry, ledger route, refreshed balance, child redemption, management guard and guest clearing');
