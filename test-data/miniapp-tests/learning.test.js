const assert = require('assert');
const fs = require('fs');
let page, selected, url;
global.getApp = () => ({ globalData: { classics: [
  { name: '论语', read: 2, total: 10 }, { name: '空书架', read: 0, total: 0 },
  { name: '孟子', read: 1, total: 7 }, { name: '大学', read: 0, total: 4 }
], courses: [{ id: 'course1', name: '智慧父母' }] } });
global.Page = value => { page = value; value.setData = data => Object.assign(value.data, data);
  value.getTabBar = () => ({ setData: data => { selected = data.selected; } }); };
global.wx = { navigateTo: options => { url = options.url; } };
require('../miniprogram/pages/learning/learning');
page.onShow(); assert.equal(selected, 1);
assert.equal(page.data.classics[0].pct, 20); assert.equal(page.data.classics[1].pct, 0);
assert.equal(page.data.classics.length, 3);
assert.equal(page.data.courses[0].mark, '智');
page.goClassic({currentTarget:{dataset:{name:'论语'}}}); assert.equal(url,'/pages/classic-read/classic-read?name='+encodeURIComponent('论语'));
page.goCourse({currentTarget:{dataset:{id:'course1'}}}); assert.equal(url,'/pages/case-list/case-list?course='+encodeURIComponent('智慧父母'));
for (const path of ['miniprogram/pages/learning/learning.wxml','miniprogram/pages/tasks/tasks.wxml','miniprogram/custom-tab-bar/index.wxml']) {
  const text=fs.readFileSync(path,'utf8').replace(/<!--[\s\S]*?-->/g,''),stack=[];
  for (const m of text.matchAll(/<\/?([\w-]+)\b[^>]*>/g)) {
    if (m[0].startsWith('</')) assert.equal(stack.pop(),m[1]); else if(!m[0].endsWith('/>')) stack.push(m[1]);
  }
  assert.equal(stack.length,0);
}
const config=JSON.parse(fs.readFileSync('miniprogram/app.json','utf8'));
for(const tab of config.tabBar.list) {
  assert(config.pages.includes(tab.pagePath));
  for(const ext of ['js','json','wxml','wxss']) assert(fs.existsSync('miniprogram/'+tab.pagePath+'.'+ext));
}
console.log('PASS: learning tab state, reading progress, course navigation, template nesting and tab registration');
