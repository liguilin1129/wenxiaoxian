// 文小贤 · 家庭教养积分小程序 —— 模拟数据（无需真实后端）
// 数据来源：《20260502文小贤—v1.0.xlsx》反推

const dimensions = [
  { key: 'heart', name: '好身心', weight: '×2', color: '#FB7185', bg: '#FFF1F3', dark: '#E11D6F', pct: 86, desc: '德育 · 十善十不善' },
  { key: 'body',  name: '好身体', weight: '×1.5', color: '#34D399', bg: '#ECFDF5', dark: '#0F9D6B', pct: 74, desc: '专注 · 坚韧 · 勤奋 · 自律' },
  { key: 'habit', name: '好习惯', weight: '×1.3', color: '#6366F1', bg: '#EEEDFE', dark: '#4F46E5', pct: 68, desc: '独立 · 学习 · 规划 · 自省' },
  { key: 'taste', name: '好品味', weight: '×1',  color: '#FBBF24', bg: '#FFFBEB', dark: '#B7791F', pct: 61, desc: '创造 · 想象 · 审美 · 专注' }
];

const child = {
  name: '文小贤',
  avatar: '贤',
  levelName: '君子少年',
  levelNum: 5,
  points: 1280,
  nextLevelPoints: 1500, // Lv.6 所需
  weekGain: 186,
  streak: 12
};

// 今日打卡（6 项，3 项已完成）
const todayTasks = [
  { id: 't1', name: '准时吃饭不挑食', dim: 'body', points: 6, done: true },
  { id: 't2', name: '准时睡觉', dim: 'body', points: 8, done: true },
  { id: 't3', name: '整理书包', dim: 'habit', points: 5, done: true },
  { id: 't4', name: '坚持锻炼（武术）', dim: 'body', points: 10, done: false },
  { id: 't5', name: '诵读《论语》', dim: 'heart', points: 10, done: false },
  { id: 't6', name: '自由绘画创作', dim: 'taste', points: 6, done: false }
];

// 鼓励任务中心（按维度分组）
const tasks = [
  {
    dim: 'heart', dimName: '好身心 · 德育',
    list: [
      { id: 'h1', name: '正其心', tags: ['愿力 / 内驱力', '经典《论语》'], rewards: [{ name: '善良敦厚（仁）', points: 10 }, { name: '正直担当（义）', points: 10 }, { name: '诚实守信（信）', points: 10 }] },
      { id: 'h2', name: '善其行', tags: ['不杀 · 不盗 · 不邪淫'], rewards: [{ name: '爱护生命', points: 8 }, { name: '行为光明', points: 8 }] },
      { id: 'h3', name: '诚其意', tags: ['定力 / 专注力'], rewards: [{ name: '知足乐观', points: 8 }, { name: '中正平和', points: 8 }] }
    ]
  },
  {
    dim: 'body', dimName: '好身体 · 健康',
    list: [
      { id: 'b1', name: '健康饮食', tags: ['不挑食 · 均衡'], rewards: [{ name: '准时吃饭', points: 6 }, { name: '少吃零食', points: 6 }] },
      { id: 'b2', name: '坚持锻炼', tags: ['武术 · 太极'], rewards: [{ name: '每日运动', points: 10 }, { name: '体态端正', points: 6 }] },
      { id: 'b3', name: '准时睡觉', tags: ['作息规律'], rewards: [{ name: '早睡早起', points: 8 }] }
    ]
  },
  {
    dim: 'habit', dimName: '好习惯 · 习惯',
    list: [
      { id: 'ha1', name: '整理书包', tags: ['独立'], rewards: [{ name: '物归原处', points: 5 }] },
      { id: 'ha2', name: '勤洗手', tags: ['讲卫生'], rewards: [{ name: '饭前便后洗手', points: 6 }] },
      { id: 'ha3', name: '规划时间', tags: ['自省'], rewards: [{ name: '列计划表', points: 7 }] }
    ]
  },
  {
    dim: 'taste', dimName: '好品味 · 审美',
    list: [
      { id: 'ta1', name: '自由绘画', tags: ['创造'], rewards: [{ name: '每日创作', points: 6 }] },
      { id: 'ta2', name: '挑选绘本', tags: ['审美'], rewards: [{ name: '选书有品味', points: 8 }] }
    ]
  }
];

// 任务详情（按 id）
const taskDetail = {
  h1: {
    purpose: '保持心态平和稳定，不受愤怒、恐惧、喜好等情绪干扰，确保决策符合道义。在诚意正心基础上完善品德，约束不良行为，成为言行一致的君子。',
    neigong: '愿力 / 内驱力', classic: '《论语》',
    rewards: [
      { name: '善良敦厚（仁）', points: 10 },
      { name: '正直担当（义）', points: 10 },
      { name: '志高进取', points: 10 },
      { name: '孝顺友爱（礼）', points: 10 }
    ],
    methods: '经典诵读 · 公益活动 · 推荐视频观看 · 课程讲解 · 生命教育 · 立志引导等'
  },
  h2: {
    purpose: '以十善护持身口意，远离杀盗淫妄，行为光明磊落，待人温和有礼。',
    neigong: '念力 / 精进力', classic: '《十善业道经》',
    rewards: [{ name: '爱护生命', points: 8 }, { name: '行为光明', points: 8 }],
    methods: '日行一善打卡 · 生命教育绘本 · 家庭共读'
  },
  h3: {
    purpose: '诚意不自欺，专注当下，知足乐观，中正平和地处理事务。',
    neigong: '定力 / 专注力', classic: '《大学》',
    rewards: [{ name: '知足乐观', points: 8 }, { name: '中正平和', points: 8 }],
    methods: '静坐观呼吸 · 专注力游戏 · 正念练习'
  },
  b1: { purpose: '均衡营养、不挑食，养成健康饮食观。', neigong: '信力 / 自律力', classic: '—', rewards: [{ name: '准时吃饭', points: 6 }, { name: '少吃零食', points: 6 }], methods: '三餐定时 · 参与备餐 · 营养小课堂' },
  b2: { purpose: '坚持锻炼，强健身心的专注、坚韧与勤奋。', neigong: '念力 / 精进力', classic: '—', rewards: [{ name: '每日运动', points: 10 }, { name: '体态端正', points: 6 }], methods: '武术 / 太极 / 跳绳 · 每日 30 分钟' },
  b3: { purpose: '作息规律，准时睡觉，保障成长发育。', neigong: '信力 / 自律力', classic: '—', rewards: [{ name: '早睡早起', points: 8 }], methods: '固定睡前仪式 · 远离屏幕' },
  ha1: { purpose: '自己的事情自己做，物归原处，培养独立。', neigong: '信力 / 自律力', classic: '—', rewards: [{ name: '物归原处', points: 5 }], methods: '收纳训练 · 每日整理打卡' },
  ha2: { purpose: '讲卫生，勤洗手，守护健康。', neigong: '信力 / 自律力', classic: '—', rewards: [{ name: '饭前便后洗手', points: 6 }], methods: '七步洗手法儿歌 · 提醒贴纸' },
  ha3: { purpose: '学会规划时间，自省当日得失。', neigong: '慧力 / 决断力', classic: '—', rewards: [{ name: '列计划表', points: 7 }], methods: '周末计划表 · 晚间三省' },
  ta1: { purpose: '自由绘画，释放想象力与创造力。', neigong: '慧力 / 决断力', classic: '—', rewards: [{ name: '每日创作', points: 6 }], methods: '自由涂鸦 · 主题画 · 家庭画展' },
  ta2: { purpose: '自主挑选绘本，培养审美品味。', neigong: '慧力 / 决断力', classic: '—', rewards: [{ name: '选书有品味', points: 8 }], methods: '图书馆选书 · 亲子共读' }
};

// 经典学习（17 部）
const classics = [
  { name: '论语', read: 12, total: 20, color: '#FB7185' },
  { name: '中庸', read: 4, total: 15, color: '#FB7185' },
  { name: '孟子', read: 0, total: 14, color: '#FB7185' },
  { name: '诗经', read: 6, total: 18, color: '#FB7185' },
  { name: '三字经', read: 1, total: 1, color: '#6366F1' },
  { name: '千字文', read: 1, total: 1, color: '#6366F1' },
  { name: '易经', read: 0, total: 24, color: '#FB7185' },
  { name: '道德经', read: 5, total: 20, color: '#FB7185' },
  { name: '弟子规', read: 3, total: 1, color: '#6366F1' },
  { name: '大学', read: 8, total: 12, color: '#FB7185' },
  { name: '老子', read: 0, total: 10, color: '#FB7185' },
  { name: '庄子', read: 0, total: 16, color: '#FB7185' },
  { name: '尚书', read: 0, total: 22, color: '#FB7185' },
  { name: '礼记', read: 2, total: 20, color: '#FB7185' },
  { name: '春秋', read: 0, total: 18, color: '#FB7185' },
  { name: '楚辞', read: 0, total: 17, color: '#FB7185' },
  { name: '古文观止', read: 5, total: 30, color: '#6366F1' }
];

// 积分明细
const pointsHistory = [
  { title: '诚实守信（信）', dim: 'heart', date: '08-20', delta: 10 },
  { title: '兑换：周末公园游', dim: 'taste', date: '08-19', delta: -50 },
  { title: '整理书包', dim: 'habit', date: '08-19', delta: 5 },
  { title: '坚持锻炼（太极）', dim: 'body', date: '08-18', delta: 10 },
  { title: '诵读《孟子》', dim: 'heart', date: '08-18', delta: 10 },
  { title: '勤洗手 · 讲卫生', dim: 'body', date: '08-17', delta: 6 }
];

// 奖励兑换
const rewards = [
  { id: 'r1', name: '周末去公园放风', desc: '家庭时光', cost: 50, dim: 'taste' },
  { id: 'r2', name: '挑选一本绘本', desc: '好品味养成', cost: 80, dim: 'taste' },
  { id: 'r3', name: '延长游戏时间 30 分', desc: '好身体调剂', cost: 120, dim: 'taste' },
  { id: 'r4', name: '决定周末家庭菜单', desc: '自主规划', cost: 60, dim: 'taste' }
];

// 五类内功
const neigong = [
  { name: '愿力 / 内驱力', pct: 82 },
  { name: '念力 / 精进力', pct: 70 },
  { name: '定力 / 专注力', pct: 76 },
  { name: '慧力 / 决断力', pct: 64 },
  { name: '信力 / 自律力', pct: 72 }
];

module.exports = {
  dimensions, child, todayTasks, tasks, taskDetail, classics, pointsHistory, rewards, neigong
};
