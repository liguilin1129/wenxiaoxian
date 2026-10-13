const assert = require('assert');
const fs = require('fs');
let parent = true, signed = true, calls = [], toggles = 0;
const app = { globalData: { child: { name: '测试孩子', avatar: '孩', levelNum: 4, levelName: '成长先锋' },
  dimensions: [{ key: 'habit', name: '好习惯' }], todayTasks: [
    { id: 'done', name: '完成任务', dim: 'habit', done: true, points: 5 },
    { id: 'pending', name: '待审批任务', dim: 'habit', requiresApproval: true, points: 5 },
    { id: 'todo', name: '阅读', dim: 'habit', points: 5 }
  ], _ci: { customApprovals: { pending: { status: 'pending' } } }, tasks: [], classics: [], rewards: [], discoverArticles: [], cases: [] } };
const stub = { isSigned: () => signed, isParentMode: () => parent, todayDoneCount: () => 1,
  getBadges: () => Array.from({length:6}, (_,i) => ({id:i,got:i>2})),
  getSmartReminders: () => [{ target:'approvals',text:'家长待确认' },{target:'checkin',text:'去打卡'}],
  getCustomTasks: () => [{id:'custom',name:'自定义任务',assignee:'孩子'}],
  toggleDaily: () => { toggles++; return {pending:true,delta:0}; } };
require.cache[require.resolve('../miniprogram/utils/store')] = { exports: stub };
global.getApp = () => app;
global.wx = { getStorageSync: () => [], navigateTo: o => calls.push(o.url), switchTab: o => calls.push(o.url),
  showToast: o => calls.push(o.title), getWindowInfo: () => ({statusBarHeight:24,windowWidth:375}),
  getMenuButtonBoundingClientRect: () => ({top:28,left:280,height:32}) };
let page;
global.Page = p => { page = p; p.setData = values => Object.assign(p.data,values); };
require('../miniprogram/pages/index/index');
const home = page;
home.onLoad(); home.refresh();
assert.equal(home.data.navHeight,40);
assert.deepEqual(home.data.quickEntries.map(item=>item.name),['任务中心','家庭会议','成长银行','学习中心']);
assert.equal(home.data.badges.length,4);
assert.equal(home.data.today[0].id,'todo');
assert(home.data.today.find(item=>item.id==='pending').pending);
home.openSearch(); assert.equal(calls.pop(),'/pages/search/search');
home.goProfileDetail(); assert.equal(calls.pop(),'/pages/profile-detail/profile-detail');
home.goQuick({currentTarget:{dataset:{key:'tasks'}}}); assert.equal(calls.pop(),'/pages/tasks/tasks');
home.goQuick({currentTarget:{dataset:{key:'bank'}}}); assert.equal(calls.pop(),'/pages/growth-bank/growth-bank');
parent=false; home.refresh(); assert.equal(home.data.reminderText,'去打卡');
home.goQuick({currentTarget:{dataset:{key:'family'}}}); assert(calls.pop().includes('家长模式'));
home.toggleToday({currentTarget:{dataset:{id:'done'}}}); assert.equal(toggles,0);
home.toggleToday({currentTarget:{dataset:{id:'todo'}}}); assert(calls.pop().includes('待家长确认'));
signed=false; home.refresh(); assert.equal(home.data.today.length,0); assert.equal(home.data.badges.length,0);
require('../miniprogram/pages/search/search');
page.runSearch('成长银行'); assert.equal(page.data.searchResults[0].url,'/pages/growth-bank/growth-bank');
page.runSearch('自定义'); assert.equal(page.data.searchResults[0].url,'/pages/tasks/tasks');
page.runSearch('无匹配的关键词'); assert.equal(page.data.searchResults.length,0);
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
console.log('PASS: navigation sizing, four shortcuts, reminder permissions, badge limit, pending state, search, guest clearing and WXML nesting');
