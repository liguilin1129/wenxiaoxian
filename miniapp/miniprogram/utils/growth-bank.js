// 成长银行一期：本地追加式流水。未接入生产账务服务，不进行跨家庭转账。
const KEY = 'localGrowthBankV1';
const POLICY_VERSION = 1;
const DIMENSIONS = [
  { code: 'DE', name: '德育', weight: 2, baseline: 100 },
  { code: 'INT', name: '智育', weight: 1, baseline: 100 },
  { code: 'PE', name: '体育', weight: 1, baseline: 100 },
  { code: 'ART', name: '美育', weight: 1, baseline: 100 },
  { code: 'LAB', name: '劳育', weight: 1, baseline: 100 }
];
const INDICATORS = [
  ['DE.REN', '仁 · 关怀他人', 'DE'], ['DE.YI', '义 · 勇于担当', 'DE'],
  ['DE.LI', '礼 · 文明礼仪', 'DE'], ['DE.WIS', '智 · 明辨是非', 'DE'],
  ['DE.XIN', '信 · 诚信守诺', 'DE'], ['INT.LEARN', '学习与创造', 'INT'],
  ['PE.HEALTH', '运动与健康', 'PE'], ['ART.CREATE', '审美与艺术', 'ART'],
  ['LAB.WORK', '劳动与独立', 'LAB']
].map(item => ({ code: item[0], name: item[1], dimension: item[2], version: 1, enabled: true }));
const RULE = { version: 1, base: 10, dailyCap: 60, difficulties: [1, 1.5, 2], qualities: [0.8, 1, 1.2] };
function load() {
  const value = wx.getStorageSync(KEY);
  return value && value.version === 1 ? value : { version: 1, consent: null, events: [], flows: [], audit: [] };
}
function save(value) { wx.setStorageSync(KEY, value); }
function parent() {
  if (!wx.getStorageSync('signed')) throw new Error('请先登录');
  if (wx.getStorageSync('localAppMode') === 'child') throw new Error('请切换到家长模式');
}
function authorized(value) {
  if (!value.consent || !value.consent.active) throw new Error('请先由监护人确认成长记录使用说明');
}
function uid() { return Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10); }
function dateKey(value) {
  const d = new Date(value || Date.now());
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function audit(value, action, id) { value.audit.push({ action, id: id || '', at: new Date().toISOString(), role: 'parent' }); }
function consent(active) {
  parent(); const value = load();
  value.consent = { active: !!active, version: POLICY_VERSION, at: new Date().toISOString() };
  audit(value, active ? 'consent' : 'revoke'); save(value);
}
function create(input) {
  parent(); const value = load(); authorized(value);
  const text = String(input.text || '').trim();
  if (!text || text.length > 500) throw new Error('请填写 1 至 500 字的成长记录');
  const indicator = INDICATORS.find(item => item.code === input.indicator);
  if (!indicator) throw new Error('请选择有效的成长指标');
  const images = Array.isArray(input.images) ? input.images.slice(0, 3) : [];
  if (images.some(path => typeof path !== 'string' || !path)) throw new Error('图片路径无效');
  const fingerprint = dateKey() + '|' + indicator.code + '|' + text.replace(/\s+/g, '') + '|' + images.join('|');
  if (value.events.some(item => item.fingerprint === fingerprint)) throw new Error('今天已记录过相同内容，请勿重复提交');
  const event = { id: uid(), text, images, indicator: indicator.code, indicatorName: indicator.name,
    dimension: indicator.dimension, indicatorVersion: indicator.version, fingerprint,
    contentType: images.length ? 'image' : 'text', source: 'manual', status: 'pending',
    occurredAt: new Date().toISOString(), consentVersion: POLICY_VERSION };
  value.events.unshift(event); audit(value, 'create', event.id); save(value); return event;
}
function creditTotal(value) { return (value || load()).flows.reduce((sum, item) => sum + item.amount, 0); }
function confirm(id, difficulty, quality) {
  parent(); const value = load(); authorized(value);
  const event = value.events.find(item => item.id === id);
  if (!event) throw new Error('记录不存在');
  const previous = value.flows.find(item => item.bizId === 'event:' + id);
  if (previous) return previous; // 同一业务重试只返回首次结果。
  if (event.status !== 'pending') throw new Error('此记录无法确认');
  if (!RULE.difficulties.includes(difficulty) || !RULE.qualities.includes(quality)) throw new Error('计分系数无效');
  const dim = DIMENSIONS.find(item => item.code === event.dimension);
  const day = dateKey();
  const used = value.flows.filter(item => item.type === 'award' && item.indicator === event.indicator && item.date === day).reduce((sum, item) => sum + item.amount, 0);
  const amount = Math.round(RULE.base * difficulty * quality * dim.weight * 100) / 100;
  if (used + amount > RULE.dailyCap) throw new Error('该指标今日积分已达到上限，请明天再确认');
  const flow = { id: uid(), bizId: 'event:' + id, type: 'award', title: event.indicatorName,
    indicator: event.indicator, dimension: event.dimension, amount,
    balanceAfter: Math.round((creditTotal(value) + amount) * 100) / 100,
    rule: { version: RULE.version, base: RULE.base, difficulty, quality, weight: dim.weight },
    date: day, createdAt: new Date().toISOString() };
  event.status = 'confirmed'; event.confirmedAt = flow.createdAt;
  value.flows.push(flow); audit(value, 'confirm', id); save(value); return flow;
}
function reverse(id) {
  parent(); const value = load();
  const event = value.events.find(item => item.id === id);
  const original = value.flows.find(item => item.bizId === 'event:' + id);
  const previous = value.flows.find(item => item.bizId === 'reverse:' + id);
  if (previous) return previous;
  if (!event || !original) throw new Error('没有可冲正的积分');
  const app = getApp();
  if (!app || Number(app.globalData.child.points) < original.amount) throw new Error('积分已使用，当前余额不足以冲正');
  const flow = { id: uid(), bizId: 'reverse:' + id, type: 'reversal', title: '冲正：' + original.title,
    indicator: original.indicator, dimension: original.dimension, amount: -original.amount,
    balanceAfter: Math.round((creditTotal(value) - original.amount) * 100) / 100,
    refFlowId: original.id, date: dateKey(), createdAt: new Date().toISOString() };
  value.flows.push(flow); event.status = 'reversed'; audit(value, 'reverse', id); save(value); return flow;
}
function overview() {
  const value = load();
  const dimensions = DIMENSIONS.map(dim => {
    const points = Math.round(value.flows.filter(flow => flow.dimension === dim.code).reduce((sum, flow) => sum + flow.amount, 0) * 100) / 100;
    return Object.assign({}, dim, { points, score: Math.min(100, Math.max(0, Math.round(points / dim.baseline * 100))) });
  });
  return { consent: !!(value.consent && value.consent.active), dimensions,
    credits: Math.round(creditTotal(value) * 100) / 100,
    pending: value.events.filter(item => item.status === 'pending').length,
    events: value.events.map(item => Object.assign({}, item, { date: dateKey(item.occurredAt),
      statusText: { pending: '待家长确认', confirmed: '已入账', reversed: '已冲正' }[item.status] })),
    flows: value.flows.slice().reverse() };
}
function exportData() { parent(); const value = load(); audit(value, 'export'); save(value); return JSON.stringify(value, null, 2); }
function deleteContent() {
  parent(); const value = load();
  // 清除原文与图片引用；保留无原文的账务凭证，避免已消费积分凭空增加或消失。
  value.events = []; value.consent = { active: false, version: POLICY_VERSION, at: new Date().toISOString() };
  audit(value, 'delete_content'); save(value);
}
module.exports = { DIMENSIONS, INDICATORS, RULE, consent, create, confirm, reverse, overview, creditTotal, exportData, deleteContent };
