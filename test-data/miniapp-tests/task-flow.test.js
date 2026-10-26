const assert = require('assert');
const fs = require('fs');
const RealDate = Date;
let now = new RealDate('2026-10-19T12:00:00+08:00').getTime();
global.Date = class extends RealDate {
  constructor(...args) { super(...(args.length ? args : [now])); }
  static now() { return now; }
};
const memory = { signed: true, checkInState: {
  date: '2026-10-18', daily: { t4: '10-18' }, center: { h1: {status:'pending',date:'10-18'} },
  customTasks: [{id:'oldCustom',name:'旧每日任务',points:7,dim:'habit',frequency:'daily',active:true,date:'10-18',requiresApproval:true}],
  customApprovals: {oldCustom:{status:'pending',date:'10-18'}}, redeemed:[]
} };
const clone = data => JSON.parse(JSON.stringify(data));
global.wx = { getStorageSync: key => memory[key] === undefined ? '' : clone(memory[key]), setStorageSync: (key,value) => {memory[key]=clone(value);} };
require.cache[require.resolve('../miniprogram/utils/cloud-data')] = { exports: { schedulePush() {} } };
const mock = require('../miniprogram/utils/mock');
let app;
function boot() {
  app = { globalData: { signed:true, child:clone(mock.child), dimensions:clone(mock.dimensions), tasks:clone(mock.tasks),
    todayTasks:clone(mock.todayTasks), classics:clone(mock.classics),taskDetail:clone(mock.taskDetail),rewards:clone(mock.rewards),meetings:[] } };
  store.initCheckIns(app);
}
global.getApp = () => app;
const store = require('../miniprogram/utils/store');
const journal = require('../miniprogram/utils/task-journal');
const base = mock.child.points-mock.todayTasks.filter(item=>item.done).reduce((sum,item)=>sum+item.points,0);
boot();
assert.equal(app.globalData.child.points,base+47);
assert.equal(app.globalData._ci.taskJournal.entries.length,3);
assert(app.globalData._ci.taskMigrationBackup.center.h1.status==='pending');
assert.equal(store.getTask('h1').done,false); // 昨日完成不占用今日任务。
assert.equal(store.getTask('oldCustom').requiresApproval,false);
const originalEntries=app.globalData._ci.taskJournal.entries.length;
boot(); assert.equal(app.globalData._ci.taskJournal.entries.length,originalEntries);
assert.equal(store.setTaskDone('t4',true).delta,10);
const after=app.globalData.child.points,experience=app.globalData.child.experience;
assert.equal(store.setTaskDone('t4',true).changed,false); assert.equal(app.globalData.child.points,after);
assert.equal(store.setTaskDone('t4',false).delta,-10);
assert.equal(store.setTaskDone('t4',false).changed,false);
store.setTaskDone('t4',true); assert.equal(app.globalData.child.points,after); assert.equal(app.globalData.child.experience,experience);
const completed = store.addCustomTask({name:'单次完成',points:8,dim:'habit',frequency:'once',deadline:'2026-10-22'});
store.setTaskDone(completed.id,true); const earned=app.globalData.child.points;
store.removeCustomTask(completed.id); assert.equal(app.globalData.child.points,earned);
const unfinished = store.addCustomTask({name:'截止日前待办',points:6,dim:'habit',frequency:'once',deadline:'2026-10-22'});
const ai = store.addDailyTask('AI 新建任务',5,'habit');
boot(); assert(store.getTodayTasks().some(item=>item.id===ai.id)); assert.equal(app.globalData.child.points,earned);
now=new RealDate('2026-10-20T12:00:00+08:00').getTime();
assert(store.getTodayTasks().some(item=>item.id===unfinished.id));
assert(!store.getTodayTasks().some(item=>item.id===completed.id));
assert.equal(store.getTask('t4').done,false); assert.equal(app.globalData.child.points,earned);
store.setTaskDone('t4',true); assert.equal(app.globalData.child.points,earned+10);
assert(journal.isDone(app.globalData._ci.taskJournal,'t4','2026-10-19'));
assert(journal.isDone(app.globalData._ci.taskJournal,'t4','2026-10-20'));
assert.equal(store.todayGain(),10);
assert.equal(app.globalData.child.streak,3);
assert(store.getTaskHistory().some(item=>item.date==='2026-10-19' && item.taskId==='t4'));
const normalBalance=app.globalData.child.points;
app.globalData.child.points=0;
assert(store.setTaskDone('t4',false).insufficient);
app.globalData.child.points=normalBalance;
store.setTaskDone('ha1',true); assert(store.getTodayTasks().some(item=>item.id==='ha1'));
const goal=store.createGrowthGoal({dim:'heart'});
memory.localGrowthGoals[0].stages[0].target=1;
const goalTask=store.getGrowthGoals().find(item=>item.id===goal.id).taskId;
store.setTaskDone(goalTask,true); const goalPoints=app.globalData.child.points;
assert.equal(store.getGrowthGoals().find(item=>item.id===goal.id).currentStage,1);
boot(); assert.equal(app.globalData.child.points,goalPoints); // 阶段任务结束后历史积分仍保留。
now=new RealDate('2026-10-23T12:00:00+08:00').getTime();
assert(!store.getTodayTasks().some(item=>item.id===unfinished.id)); assert.equal(app.globalData.child.points,goalPoints);
// 任务中心与首页的数据源相同，详情支持自定义任务。
let page;
global.Page=value=>{page=value;value.setData=data=>Object.assign(value.data,data);};
global.wx.showToast=()=>{};global.wx.setNavigationBarTitle=()=>{};
require('../miniprogram/pages/tasks/tasks'); page.buildGroups();
assert.deepEqual(page.data.groups.flatMap(group=>group.list.map(item=>item.id)).sort(),store.getTodayTasks().map(item=>item.id).sort());
require('../miniprogram/pages/task-detail/task-detail');page.onLoad({id:ai.id});assert.equal(page.data.task.name,'AI 新建任务');
require('../miniprogram/pages/checkin-record/checkin-record');
page.refresh(2026,9); assert(page.data.calendar.find(item=>item.day===19).done);
page.refresh(2025,9); assert(!page.data.calendar.find(item=>item.day===19).done);
for(const route of ['pages/tasks/tasks','pages/task-detail/task-detail']) {
  const xml=fs.readFileSync('miniprogram/'+route+'.wxml','utf8').replace(/<!--[\s\S]*?-->/g,''),stack=[];
  for(const m of xml.matchAll(/<\/?([\w-]+)\b[^>]*>/g)){if(m[0].startsWith('</'))assert.equal(stack.pop(),m[1]);else if(!m[0].endsWith('/>'))stack.push(m[1]);}
  assert.equal(stack.length,0);
}
console.log('PASS: pending migration, idempotent scoring, reversals, rollover, restart, deletion, deadlines, AI persistence, template selection, goal advancement and shared task views');
