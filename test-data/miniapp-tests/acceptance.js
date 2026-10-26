// Each suite runs in a separate Node process so mocked wx, Date and app state
// cannot leak into the next suite. No WeChat user storage is accessed.
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const suites = [
  ['直接打卡与任务历史', 'task-flow.test.js'],
  ['集中补卡、额度与幂等', 'makeup.test.js'],
  ['智能提醒规则与首页联动', 'reminders.test.js'],
  ['首页布局与入口', 'home-layout.test.js'],
  ['挑战入口与页面框架', 'challenges.test.js'],
  ['官方商城展示框架与入口', 'shop.test.js'],
  ['积分银行入口与原有兑换', 'points-bank.test.js'],
  ['成长银行', 'growth-bank.test.js'],
  ['五育圆形雷达仪表盘', 'growth-radar.test.js'],
  ['学习中心', 'learning.test.js'],
  ['家庭空间', 'family-education.test.js'],
  ['底部导航', 'tabbar.test.js']
];

console.log('隔离自动验收：使用测试模拟数据，不连接微信、不修改真实积分和额度。');
let failed = 0;
for (const [label, file] of suites) {
  console.log(`\n检查：${label}`);
  const result = spawnSync(process.execPath, ['-r', path.join(__dirname, 'resolve-miniapp.js'), path.join(__dirname, file)], {
    cwd: path.resolve(__dirname, '..', '..', 'miniapp'),
    encoding: 'utf8',
    timeout: 60000,
    windowsHide: true
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) console.error(result.error.message);
  if (result.error || result.status !== 0) {
    failed++;
    console.error(`未通过：${label}`);
  }
}
console.log(`\n结果：${suites.length - failed}/${suites.length} 组通过。`);
console.log('范围：Node 模拟环境；不代表微信编译、真实云同步或真机界面验收通过。');
process.exitCode = failed ? 1 : 0;
