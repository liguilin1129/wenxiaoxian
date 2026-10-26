const assert = require('assert');
const fs = require('fs');
let definition, request, aiOpened = false, now = 1000;
Date.now = () => now;
global.Component = value => { definition = value; };
global.setTimeout = () => { throw new Error('路由不应使用延迟计时器'); };
global.wx = { switchTab: options => { request = options; }, showToast: () => {} };
global.getCurrentPages = () => [{ selectComponent: () => ({ openPanel: () => { aiOpened = true; } }) }];
require('../miniprogram/custom-tab-bar/index');
function makeComponent() {
  const instance = { data: JSON.parse(JSON.stringify(definition.data)), setData(value) {
    Object.assign(this.data, value);
    if (Object.prototype.hasOwnProperty.call(value,'selected')) definition.observers.selected.call(this,value.selected);
  } };
  Object.assign(instance,definition.methods);
  return instance;
}
const component = makeComponent();
const tap = idx => definition.methods.switchTab.call(component, { currentTarget: { dataset: { idx } } });
tap(0); assert.equal(request, undefined);
tap(2); assert.equal(component.data.selected, 2); assert(component._switching);
tap(3); assert.equal(component.data.selected, 2); // 动画中禁止重复跳转。
assert.equal(request.url, '/pages/discover/discover');
request.fail(); request.complete(); assert.equal(component.data.selected, 0); assert(!component._switching);
tap(1); request.complete(); assert.equal(request.url, '/pages/learning/learning');
assert.equal(component.data.selected, 1);
definition.methods.openAiAssistant.call(component); assert(aiOpened);
tap(3); definition.lifetimes.detached.call(component);
request.fail(); assert.equal(component.data.selected,3);
request.complete(); const lastRequest=request; tap(0); assert.equal(request,lastRequest);
const template=fs.readFileSync('miniprogram/custom-tab-bar/index.wxml','utf8');
const styles=fs.readFileSync('miniprogram/custom-tab-bar/index.wxss','utf8');
assert(template.includes('animation-delay:{{indicatorDelay}}ms'));
assert(template.includes('<text class="txt">{{item.text}}</text>'));
assert(styles.includes('width: 25%;'));
assert(styles.includes('flex-direction: column;'));
assert(!styles.includes('flex-grow: 2'));
assert(!styles.includes('opacity: 0;'));
// 新组件在真实目标页初始化，并接续原页面尚未完成的动画。
const source = makeComponent(); source.setData({selected:3});
source.switchTab({currentTarget:{dataset:{idx:1}}});
assert.equal(source.data.indicatorFrom,300); assert.equal(source.data.indicatorTo,100);
request.complete(); now += 80;
global.getCurrentPages = () => [{route:'pages/learning/learning'}];
const destination=makeComponent(); definition.lifetimes.attached.call(destination);
assert.equal(destination.data.selected,1);
assert.equal(destination.data.indicatorFrom,300);
assert.equal(destination.data.indicatorTo,100);
assert.equal(destination.data.indicatorDelay,-80);
// 动画中继续点另一项，从当前视觉位置接续，不跳回某个固定 Tab。
destination.switchTab({currentTarget:{dataset:{idx:2}}});
assert(Math.abs(destination.data.indicatorFrom - (300 - 200 * 80 / 220)) < .001);
const secondAnimation=destination.data.indicatorAnimation;
assert.notEqual(secondAnimation,source.data.indicatorAnimation);
request.complete(); now += 300;
global.getCurrentPages = () => [{route:'pages/discover/discover'}];
const settled=makeComponent(); definition.lifetimes.attached.call(settled);
assert.equal(settled.data.indicatorTo,200);
assert.equal(settled.data.indicatorAnimation,'none');
console.log('PASS: cross-page animation continuity, resumed timing, rapid switching, stable initialization, fixed labels, navigation rollback and AI button');
