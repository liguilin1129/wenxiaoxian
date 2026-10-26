const assert = require('assert');
const fs = require('fs');
const RealDate = Date;
let now = new RealDate(2026, 9, 21, 12).getTime();
global.Date = class extends RealDate {
  constructor(...args) { super(...(args.length ? args : [now])); }
  static now() { return now; }
};
const { buildTaskReminders } = require('../miniprogram/utils/task-reminders');
const tasks = [
  { id:'tomorrow', name:'明天任务', deadline:'2026-10-22' },
  { id:'today', name:'今天任务', deadline:'2026-10-21' },
  { id:'future', name:'以后任务', deadline:'2026-10-23' },
  { id:'expired', name:'已过期', deadline:'2026-10-20' },
  { id:'done', name:'已完成', deadline:'2026-10-21', done:true },
  { id:'deleted', name:'已删除', deadline:'2026-10-21', active:false }
];
const makeup = { eligible:true, start:'2026-10-14', end:'2026-10-20', items:[{}] };
let result = buildTaskReminders(tasks, makeup, '2026-10-21');
assert.deepEqual(result.map(item=>item.kind), ['deadline','deadline','checkin','makeup']);
assert.deepEqual(result.slice(0,2).map(item=>item.taskId), ['today','tomorrow']);
assert(result[2].text.includes('3 个'));
assert(buildTaskReminders([{ id:'bad', deadline:'2026-02-30' }], {eligible:false}, '2026-02-28').every(item=>item.kind!=='deadline'));
assert.equal(buildTaskReminders([{ id:'next', name:'新年任务', deadline:'2027-01-01' }], {eligible:false}, '2026-12-31')[0].title, '明日到期');
assert.deepEqual(buildTaskReminders([], {eligible:false}, '2026-10-21'), []);
const edited = [{id:'edit', name:'原任务', deadline:'2026-10-23'}];
assert.equal(buildTaskReminders(edited, {eligible:false}, '2026-10-21')[0].kind,'checkin');
edited[0].name='修改后的任务'; edited[0].deadline='2026-10-21';
assert(buildTaskReminders(edited, {eligible:false}, '2026-10-21')[0].text.includes('修改后的任务'));
edited[0].done=true;
assert.deepEqual(buildTaskReminders(edited, {eligible:false}, '2026-10-21'), []);

const memory = {};
const clone = value => JSON.parse(JSON.stringify(value));
let app, navigations = [], intervals = new Set(), tick = 0;
global.wx = {
  getStorageSync: key => memory[key] === undefined ? '' : clone(memory[key]),
  setStorageSync: (key,value) => { memory[key] = clone(value); },
  navigateTo: options => navigations.push(options.url)
};
require.cache[require.resolve('../miniprogram/utils/cloud-data')] = {exports:{schedulePush(){}}};
global.getApp = () => app;
const mock = require('../miniprogram/utils/mock');
const store = require('../miniprogram/utils/store');
function boot() {
  app = {globalData:{signed:true, child:clone(mock.child), dimensions:clone(mock.dimensions),
    todayTasks:clone(mock.todayTasks), tasks:clone(mock.tasks), taskDetail:clone(mock.taskDetail),
    classics:clone(mock.classics), rewards:clone(mock.rewards), meetings:[]}};
  store.initCheckIns(app);
}
boot();
const due = store.addCustomTask({name:'验收到期任务', points:5, dim:'habit', frequency:'once', deadline:'2026-10-21'});
const id = store.getSmartReminders()[0].id;
assert.equal(store.getSmartReminders()[0].taskId, due.id);
store.markReminderRead(id);
assert.equal(store.getSmartReminders()[0].id,id);
boot(); // 已读状态持久化也不能使未完成任务消失。
assert.equal(store.getSmartReminders()[0].id,id);

global.setInterval = callback => { intervals.add(++tick); return tick; };
global.clearInterval = id => intervals.delete(id);
let page;
global.Page = value => { page=value; value.setData=values=>Object.assign(value.data,values); };
require('../miniprogram/pages/reminders/reminders');
const reminderPage = page;
reminderPage.onShow(); reminderPage.onShow(); assert.equal(intervals.size,1);
reminderPage.handle({currentTarget:{dataset:{item:reminderPage.data.reminders[0]}}});
assert.equal(navigations.pop(), '/pages/task-detail/task-detail?id='+encodeURIComponent(due.id));
assert(store.getSmartReminders().some(item=>item.id===id));
store.setTaskDone(due.id,true);
reminderPage.onShow(); assert(!reminderPage.data.reminders.some(item=>item.id===id));
reminderPage.handle({currentTarget:{dataset:{item:{id,target:'family'}}}});
assert.equal(navigations.length,0); // 失效的页面数据不能继续导航。
const removed = store.addCustomTask({name:'将删除任务', points:5, dim:'habit', deadline:'2026-10-21'});
assert(store.getSmartReminders().some(item=>item.taskId===removed.id));
store.removeCustomTask(removed.id);
assert(!store.getSmartReminders().some(item=>item.taskId===removed.id));

memory.localAppMode='child';
reminderPage.onShow(); assert(reminderPage.data.reminders.every(item=>item.kind!=='family'));
memory.localAppMode='parent';
reminderPage.onShow(); assert(reminderPage.data.reminders.some(item=>item.target==='assessment'));
reminderPage.onHide(); assert.equal(intervals.size,0);
reminderPage.onUnload(); assert.equal(intervals.size,0);

require('../miniprogram/pages/index/index');
const home = page;
home.refresh(); assert.equal(home.data.reminderText,store.getSmartReminders()[0].text);
assert.deepEqual(home.data.reminderPreview,store.getSmartReminders().slice(0,2));
home.onShow(); home.onShow(); assert.equal(intervals.size,1);
home.onHide(); assert.equal(intervals.size,0);
// 跨日自动重新计算：昨天到期的任务不再产生到期提醒。
now = new RealDate(2026,9,22,12).getTime();
home.refresh(); assert(!store.getSmartReminders().some(item=>item.taskId===due.id));
assert.equal(home.data.reminderText,store.getSmartReminders()[0].text);
// 空态、退出登录不泄露之前的提醒。
store.getTodayTasks().filter(task=>!task.done).forEach(task=>store.setTaskDone(task.id,true));
memory.growthAssessment={dimensions:[],completedAt:'2026-10-22'};
home.refresh(); assert.equal(home.data.reminderText,'暂无提醒'); assert.deepEqual(home.data.reminderPreview,[]);
app.globalData.signed=false;
home.refresh(); reminderPage.refresh(); assert.deepEqual(store.getSmartReminders(),[]);
assert.equal(home.data.reminderCount,0); assert.equal(reminderPage.data.reminders.length,0);
assert.deepEqual(home.data.reminderPreview,[]);
reminderPage.handle({currentTarget:{dataset:{item:{id}}}});
assert.equal(navigations.pop(),'/pages/login/login');
const markup=fs.readFileSync('miniprogram/pages/reminders/reminders.wxml','utf8');
assert(!markup.includes('标记已读'));
const stack=[];
for(const match of markup.matchAll(/<\/?([\w-]+)\b[^>]*>/g)) {
  if(match[0].startsWith('</')) assert.equal(stack.pop(),match[1]);
  else if(!match[0].endsWith('/>')) stack.push(match[1]);
}
assert.equal(stack.length,0);
console.log('PASS: due-date priority, year rollover, completion/deletion/read/restart, stale navigation, mode filtering, timer cleanup, home summary and guest/empty states');
