const app = getApp();

Component({
  data: {
    showPanel: false,
    actions: [
      { icon: 'record', label: '记录事项', desc: '帮我记一笔', color: '#6366F1' },
      { icon: 'checkin', label: '快捷打卡', desc: '一键完成今日任务', color: '#34D399' },
      { icon: 'task', label: '新建任务', desc: '添加新的待办事项', color: '#FBBF24' },
      { icon: 'chat', label: 'AI 问答', desc: '有什么想问的？', color: '#818CF8' }
    ]
  },

  methods: {
    onToggle() {
      this.setData({ showPanel: !this.data.showPanel });
    },

    onClose() {
      this.setData({ showPanel: false });
    },

    onAction(e) {
      const type = e.currentTarget.dataset.type;
      this.setData({ showPanel: false });

      switch (type) {
        case 'record':
          wx.showToast({ title: '打开记录面板…', icon: 'none' });
          break;
        case 'checkin':
          this.quickCheckin();
          break;
        case 'task':
          wx.navigateTo({ url: '/pages/tasks/tasks?mode=new' });
          break;
        case 'chat':
          wx.showModal({
            title: 'AI 助手',
            content: '你好！我是小贤的 AI 助手 🤖\n可以帮你记录事项、快捷打卡、管理任务。\n\n你想做什么？',
            confirmText: '开始对话',
            cancelText: '取消',
            success(res) {
              if (res.confirm) {
                wx.showToast({ title: 'AI 对话开发中…', icon: 'none' });
              }
            }
          });
          break;
      }
    },

    quickCheckin() {
      const s = app.globalData;
      const undone = [];
      s.todayTasks.forEach((t, i) => {
        if (!t.done) undone.push({ t, i });
      });

      if (undone.length === 0) {
        wx.showToast({ title: '今天已经全部打卡啦！🎉', icon: 'none' });
        return;
      }

      // 自动打卡第一个未完成任务
      const item = undone[0];
      require('../../utils/store').toggleTodayTask(item.i);
      wx.showToast({
        title: '✅ 已打卡：' + item.t.name,
        icon: 'success'
      });

      // 刷新当前页面
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      if (currentPage && typeof currentPage.refresh === 'function') {
        currentPage.refresh();
      }
    },

    preventMove() {}
  }
});
