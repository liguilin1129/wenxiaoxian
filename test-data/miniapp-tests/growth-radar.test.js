const assert=require('assert');
const fs=require('fs');
const {buildRadar,drawRadar}=require('../miniprogram/utils/growth-radar');
const empty=buildRadar([]);
assert.equal(empty.length,5);
assert.deepEqual(empty.map(item=>item.name),['德育','智育','体育','美育','劳育']);
assert(empty.every(item=>item.x===160&&item.y===162&&item.points===0));
const dimensions=[{code:'DE',points:160,score:160},{code:'INT',points:25,score:25},
  {code:'PE',points:-10,score:-10},{code:'ART',points:NaN,score:Infinity},{code:'LAB',points:0.1,score:0}];
const model=buildRadar(dimensions);
assert.equal(model[0].score,100); assert.equal(model[0].points,160); assert.equal(model[0].y,62);
assert.equal(model[2].score,0); assert.equal(model[3].points,0); assert.equal(model[3].score,0);
assert(model.every(item=>Math.hypot(item.x-160,item.y-162)<=100.00001));
const calls=[];
const ctx={};
for(const method of ['clearRect','save','restore','translate','scale','beginPath','arc','fill','stroke','moveTo','lineTo','closePath','fillText']) {
  ctx[method]=(...args)=>calls.push([method,...args]);
}
drawRadar(ctx,300,280,dimensions);
assert.equal(calls.filter(item=>item[0]==='fillText').length,10);
assert(calls.some(item=>item[0]==='fillText'&&item[1]==='160 分'));
assert(calls.some(item=>item[0]==='arc'&&item[3]===100));
assert.equal(calls.filter(item=>item[0]==='save').length,calls.filter(item=>item[0]==='restore').length);

let definition;
global.Component=value=>{definition=value;};
global.wx={getWindowInfo:()=>({pixelRatio:2})};
require('../miniprogram/components/growth-radar/index');
const callbacks=[];
const component={properties:{dimensions:[]},data:{},setData(value){Object.assign(this.data,value);},
  createSelectorQuery(){return {select(){return this;},fields(){return this;},exec(callback){callbacks.push(callback);}};}};
Object.assign(component,definition.methods);
component.updateChart(); assert.equal(callbacks.length,0); assert(component.data.empty);
definition.lifetimes.ready.call(component);
const canvas={getContext:()=>ctx};
const result=[{node:canvas,width:300,height:280}];
callbacks.shift()(result); assert.equal(canvas.width,600); assert.equal(canvas.height,560); assert(!component.data.failed);
component.properties.dimensions=dimensions;
definition.properties.dimensions.observer.call(component);
assert(!component.data.empty);
callbacks.shift()(result); assert.equal(component.data.summary[0].points,160);
component.properties.dimensions=[]; component.updateChart();
callbacks.shift()([]); assert(component.data.failed); assert(component.data.empty);
component.updateChart(); callbacks.shift()(result); assert(!component.data.failed);
// Later callbacks must not paint stale data or detached nodes.
component.updateChart(); component.updateChart();
const count=calls.length; callbacks.shift()(result); assert.equal(calls.length,count);
callbacks.shift()(result); assert(calls.length>count);
definition.pageLifetimes.resize.call(component); assert.equal(callbacks.length,1);
definition.lifetimes.detached.call(component);
const detachedCount=calls.length; callbacks.shift()(result); assert.equal(calls.length,detachedCount);
const config=JSON.parse(fs.readFileSync('miniprogram/pages/growth-bank/growth-bank.json','utf8'));
assert.equal(config.usingComponents['growth-radar'],'/components/growth-radar/index');
const markup=fs.readFileSync('miniprogram/pages/growth-bank/growth-bank.wxml','utf8');
assert(markup.includes('<growth-radar dimensions="{{dimensions}}" />'));
assert.equal((markup.match(/<growth-radar\b/g)||[]).length,1);
assert(markup.indexOf('class="bank-hero"') < markup.indexOf('<growth-radar'));
assert(markup.indexOf('<growth-radar') < markup.indexOf('class="bank-tabs"'));
assert(markup.indexOf('<growth-radar') < markup.indexOf('挑战活动'));
assert(!markup.includes('积分银行数据板'));
assert.equal((markup.match(/class="bank-hero"/g)||[]).length,1);
const assetCard=markup.slice(markup.indexOf('class="bank-hero"'),markup.indexOf('<growth-radar'));
assert(assetCard.includes('{{balance}}'));
assert(assetCard.includes('{{done}} / {{total}}'));
assert(assetCard.includes('{{pending}}'));
assert(assetCard.includes('data-key="reminders" bindtap="go"'));
assert(assetCard.includes('data-key="events" bindtap="switchTab"'));
assert(assetCard.includes('全部积分明细'));
assert(assetCard.includes('兑换心愿'));
assert(!markup.includes('class="bank-track"'));
const stack=[], componentMarkup=fs.readFileSync('miniprogram/components/growth-radar/index.wxml','utf8');
assert(!markup.includes('仅统计已确认成长记录'));
assert(!componentMarkup.includes('暂无已入账的成长积累'));
for(const match of componentMarkup.matchAll(/<\/?([\w-]+)\b[^>]*>/g)) {
 if(match[0].startsWith('</'))assert.equal(stack.pop(),match[1]);
 else if(!match[0].endsWith('/>'))stack.push(match[1]);
}
assert.equal(stack.length,0);
console.log('PASS: five-axis geometry, empty/invalid/over-limit data, circular grid drawing, DPR, property updates, stale callbacks, resize, detach and fallback');
