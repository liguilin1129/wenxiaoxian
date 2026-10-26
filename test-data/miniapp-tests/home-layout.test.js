const assert = require('assert');
const fs = require('fs');
let parent = true, signed = true, calls = [], toggles = 0;
const tabPaths=JSON.parse(fs.readFileSync('miniprogram/app.json','utf8')).tabBar.list.map(item=>'/'+item.pagePath);
const app = { globalData: { child: { name: '测试孩子', avatar: '孩', levelNum: 4, levelName: '成长先锋' },
  dimensions: [{ key: 'habit', name: '好习惯' }], todayTasks: [
    { id: 'done', name: '完成任务', dim: 'habit', done: true, points: 5 },
    { id: 'second', name: '第二项任务', dim: 'habit', points: 5 },
    { id: 'todo', name: '阅读', dim: 'habit', points: 5 }
  ], _ci: {}, courses: [{ id: 'course1', name: '智慧父母' },{id:'course2',name:'少年养志'}], tasks: [], classics: [], rewards: [], discoverArticles: [], cases: [] } };
const stub = { isSigned: () => signed, isParentMode: () => parent, getTodayTasks: () => app.globalData.todayTasks, todayDoneCount: () => 1,
  getBadges: () => Array.from({length:6}, (_,i) => ({id:i,got:i>2})),
  getSmartReminders: () => [{ target:'checkin',text:'去打卡'}],
  getCustomTasks: () => [{id:'custom',name:'自定义任务',assignee:'孩子'}],
  toggleDaily: () => { toggles++; return {done:true,delta:5}; } };
require.cache[require.resolve('../miniprogram/utils/store')] = { exports: stub };
global.getApp = () => app;
global.wx = { getStorageSync: () => [], navigateTo: o => { assert(!tabPaths.includes(o.url.split('?')[0])); calls.push(o.url); }, switchTab: o => { assert(tabPaths.includes(o.url)); calls.push(o.url); },
  showToast: o => calls.push(o.title), getWindowInfo: () => ({statusBarHeight:24,windowWidth:375}),
  getMenuButtonBoundingClientRect: () => ({top:28,left:280,height:32}) };
let page;
global.Page = p => { page = p; p.setData = values => Object.assign(p.data,values); };
require('../miniprogram/pages/index/index');
const home = page;
home.onLoad(); home.refresh();
assert.equal(home.data.navHeight,40);
assert.equal(home.data.searchHeight,32);
assert.equal(home.data.navRight,107);
assert.deepEqual(home.data.quickEntries.map(item=>item.name),['任务中心','智能提醒','个性化提醒']);
assert.equal(home.data.badges.length,4);
assert.equal(home.data.today[0].id,'second');
assert.equal(home.data.remaining,2);
assert.deepEqual(home.data.taskPreview.map(item=>item.id),['second','todo']);
assert.equal(home.data.taskPreview.length,2);
assert.equal(home.data.reminderPreview.length,1);
stub.getSmartReminders=()=>[1,2,3].map(n=>({id:'reminder-'+n,text:'提醒'+n}));
home.refresh();
assert.deepEqual(home.data.reminderPreview.map(item=>item.id),['reminder-1','reminder-2']);
assert.equal(home.data.reminderCount,3);
stub.getSmartReminders=()=>[];
home.refresh(); assert.deepEqual(home.data.reminderPreview,[]); assert.equal(home.data.reminderText,'暂无提醒');
stub.getSmartReminders=()=>[{id:'checkin',target:'checkin',text:'去打卡'}];
home.refresh(); assert.equal(home.data.reminderPreview.length,1);
home.openSearch(); assert.equal(calls.pop(),'/pages/search/search');
home.goChallenges(); assert.equal(calls.pop(),'/pages/challenges/challenges');
home.goShop(); assert.equal(calls.pop(),'/pages/shop/shop');
assert.deepEqual(home.data.products,[]);
assert.equal(home.data.productSlots.length,2);
home.goProfileDetail(); assert.equal(calls.pop(),'/pages/profile-detail/profile-detail');
home.goQuick({currentTarget:{dataset:{key:'tasks'}}}); assert.equal(calls.pop(),'/pages/tasks/tasks');
home.goQuick({currentTarget:{dataset:{key:'smart'}}}); assert.equal(calls.pop(),'/pages/reminders/reminders');
home.goQuick({currentTarget:{dataset:{key:'personal'}}}); assert(calls.pop().includes('暂未配置'));
parent=false; home.refresh(); assert.equal(home.data.reminderText,'去打卡');
home.goQuick({currentTarget:{dataset:{key:'smart'}}}); assert.equal(calls.pop(),'/pages/reminders/reminders');
home.toggleToday({currentTarget:{dataset:{id:'done'}}}); assert.equal(toggles,0);
home.toggleToday({currentTarget:{dataset:{id:'todo'}}}); assert(calls.pop().includes('打卡 +5 分'));
signed=false; home.refresh(); assert.equal(home.data.today.length,0); assert.equal(home.data.badges.length,0);
assert.equal(home.data.taskPreview.length,0);
assert.deepEqual(home.data.reminderPreview,[]);
require('../miniprogram/pages/search/search');
page.runSearch('成长银行'); assert.equal(page.data.searchResults[0].url,'/pages/growth-bank/growth-bank');
page.runSearch('自定义'); assert.equal(page.data.searchResults.length,0);
signed=true;
app.globalData.todayTasks.push({id:'custom',name:'自定义任务',assignee:'孩子',dim:'habit',points:5});
page.runSearch('自定义'); assert.equal(page.data.searchResults[0].url,'/pages/task-detail/task-detail?id=custom');
page.runSearch('无匹配的关键词'); assert.equal(page.data.searchResults.length,0);
page.runSearch('学习中心');
page.goSearchItem({currentTarget:{dataset:{url:page.data.searchResults[0].url}}});
assert.equal(calls.pop(),'/pages/learning/learning');
page.clearSearch(); assert.equal(page.data.searchKey,'');
for (const path of ['miniprogram/pages/index/index.wxml','miniprogram/pages/search/search.wxml']) {
  const text=fs.readFileSync(path,'utf8'),stack=[];
  for(const m of text.matchAll(/<\/?([\w-]+)\b[^>]*>/g)) {
    if(m[0].startsWith('</')) assert.equal(stack.pop(),m[1]);
    else if(!m[0].endsWith('/>')) stack.push(m[1]);
  }
  assert.equal(stack.length,0);
}
assert(JSON.parse(fs.readFileSync('miniprogram/app.json','utf8')).pages.includes('pages/search/search'));
const homeTemplate=fs.readFileSync('miniprogram/pages/index/index.wxml','utf8');
assert(homeTemplate.indexOf('class="challenge-entry"') < homeTemplate.indexOf('class="search-button"'));
assert(homeTemplate.indexOf('class="today-quote"') < homeTemplate.indexOf('class="home-shop"'));
assert(!tabPaths.includes('/pages/challenges/challenges'));
assert(homeTemplate.indexOf('medals-card') < homeTemplate.indexOf('feature-shortcuts'));
assert(homeTemplate.indexOf('feature-shortcuts') < homeTemplate.indexOf('today-quote'));
assert(homeTemplate.includes('今日金句推荐'));
assert(homeTemplate.includes('教育不是注满一桶水，而是点燃一把火。'));
assert(homeTemplate.includes('Education is not the filling of a pail, but the lighting of a fire.'));
assert(homeTemplate.includes('智能提醒'));
assert(homeTemplate.includes('{{reminderText}}'));
assert(!homeTemplate.includes('AI 个性化建议'));
assert(!homeTemplate.includes('class="todo-row"'));
assert(!homeTemplate.includes('course-recommendations'));
assert(!tabPaths.includes('/pages/tasks/tasks'));
assert.equal(tabPaths[1],'/pages/learning/learning');
console.log('PASS: navigation sizing, three shortcuts, medal section order, reminder permissions, badge limit, direct task check-in, search, guest clearing and WXML nesting');
