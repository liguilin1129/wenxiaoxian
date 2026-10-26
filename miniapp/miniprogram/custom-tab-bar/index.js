// 多个 Tab 页面各自拥有导航组件；共享一次切换的起点和时间，避免重建后从首页重播。
let indicatorTransition = null;
let transitionSerial = 0;
const SLIDE_DURATION = 220;

Component({
  data: {
    selected: 0,
    hidden: false,
    indicatorFrom: 0,
    indicatorTo: 0,
    indicatorDelay: 0,
    indicatorAnimation: 'none',
    list: [
      { pagePath: '/pages/index/index', text: '首页', idx: 0 },
      { pagePath: '/pages/learning/learning', text: '学习中心', idx: 1 },
      { pagePath: '/pages/discover/discover', text: '发现', idx: 2 },
      { pagePath: '/pages/profile/profile', text: '我的', idx: 3 }
    ]
  },
  observers: {
    selected(index) { this.syncIndicator(index); }
  },
  lifetimes: {
    attached() {
      this._detached = false;
      this._switching = false;
      const pages = getCurrentPages();
      const page = pages[pages.length - 1];
      const route = page && page.route ? '/' + page.route : '';
      const current = this.data.list.find(item => item.pagePath === route);
      if (current) this.setData({ selected: current.idx });
      this.syncIndicator(this.data.selected);
    },
    detached() { this._detached = true; }
  },
  methods: {
    syncIndicator(index) {
      if (this._detached || !this.data.list.some(item => item.idx === index)) return;
      const motion = indicatorTransition;
      const elapsed = motion ? Math.max(0, Date.now() - motion.startedAt) : SLIDE_DURATION;
      if (motion && motion.to === index && elapsed < SLIDE_DURATION) {
        this.setData({ indicatorFrom: motion.from * 100, indicatorTo: index * 100,
          indicatorDelay: -elapsed, indicatorAnimation: motion.serial % 2 ? 'dock-slide-a' : 'dock-slide-b' });
      } else {
        this.setData({ indicatorFrom: index * 100, indicatorTo: index * 100,
          indicatorDelay: 0, indicatorAnimation: 'none' });
      }
    },
    switchTab(e) {
      const index = Number(e.currentTarget.dataset.idx);
      const item = this.data.list.find(tab => tab.idx === index);
      if (!item || this.data.selected === index || this._switching || this._detached) return;
      const previous = this.data.selected;
      const now = Date.now();
      let from = previous;
      if (indicatorTransition && indicatorTransition.to === previous) {
        const progress = Math.min(1, Math.max(0, (now - indicatorTransition.startedAt) / SLIDE_DURATION));
        from = indicatorTransition.from + (previous - indicatorTransition.from) * progress;
      }
      const serial = ++transitionSerial;
      indicatorTransition = { from, to: index, startedAt: now, serial };
      this._switching = true;
      this.setData({ selected: index });
      // 由微信立即切页，样式动画不再延迟路由操作。
      wx.switchTab({
        url: item.pagePath,
        fail: () => {
          if (indicatorTransition && indicatorTransition.serial === serial) indicatorTransition = null;
          if (this._detached) return;
          this.setData({ selected: previous });
          wx.showToast({ title: '页面切换失败，请重试', icon: 'none' });
        },
        complete: () => { this._switching = false; }
      });
    },
    openAiAssistant() {
      const pages = getCurrentPages();
      const page = pages[pages.length - 1];
      const assistant = page && page.selectComponent && page.selectComponent('#aiAssistant');
      if (assistant && typeof assistant.openPanel === 'function') assistant.openPanel();
    }
  }
});
