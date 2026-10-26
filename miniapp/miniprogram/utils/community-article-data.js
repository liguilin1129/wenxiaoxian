const MOCK_ARTICLES = [
  { id: '1', title: '如何培养孩子的时间感知力', tag: '习惯养成', read: '2.3万', cover: '⏰', author: '成长研究室', date: '今天', summary: '从可视化计划到家庭约定，帮助孩子建立对时间的具体感受。', content: '孩子的时间感并不是靠反复催促形成的，而是在一次次可见、可完成的小约定里慢慢建立起来。\n\n可以从“看得见”的计划开始：把起床、阅读、整理等事项写成简短清单，完成一项就划掉一项。\n\n家长要把重点放在陪伴复盘，而不是只检查结果。每天睡前花两分钟聊聊：今天哪件事最顺利，明天想先完成什么？' },
  { id: '2', title: '经典诵读对专注力的 4 个好处', tag: '经典学习', read: '1.8万', cover: '📜', author: '书香妈妈', date: '昨天', summary: '短时、高频、可坚持的诵读，比一次读很久更适合孩子。', content: '经典诵读的价值，不在于一次记住多少，而在于为孩子提供一段安静、重复、可预期的专注时间。\n\n建议把时长设得足够小：从每天五分钟开始，稳定后再逐步增加。\n\n读完后不必立刻考核，可以请孩子说说最喜欢哪一句、哪一个画面，把诵读变成愿意靠近的日常。' },
  { id: '3', title: '积分制激励，怎么设才不翻车', tag: '家庭教育', read: '3.1万', cover: '🪙', author: '乐乐爸', date: '3 天前', summary: '积分奖励的是行动和坚持，而不是用来交换孩子应该做的一切。', content: '积分制最容易踩的坑，是把所有事情都变成交易。\n\n更合适的做法是：把积分用在需要培养的新习惯、需要长期坚持的目标上；对于基本的家庭规则，仍然保持清晰而稳定的边界。\n\n奖励也不必昂贵，一次亲子游戏、一次自主选书、一个周末活动，都能成为温和而有力量的反馈。' }
];

function normalize(item) {
  return Object.assign({}, item, {
    id: String(item.id),
    category: item.category || item.tag || '经验分享',
    tag: item.tag || item.category || '经验分享',
    author: item.author || '社区家长',
    date: item.date || '刚刚',
    read: item.read || '0',
    summary: item.summary || item.content || '',
    content: item.content || item.summary || '这篇经验正在完善中。',
    cover: item.cover || '📖'
  });
}

function getCommunityArticles() {
  const user = wx.getStorageSync('communityUserArticles') || [];
  return user.concat(MOCK_ARTICLES).map(normalize);
}

function findCommunityArticle(id) {
  return getCommunityArticles().find(item => String(item.id) === String(id)) || null;
}

module.exports = { getCommunityArticles, findCommunityArticle };
