import { createRouter, createWebHistory } from 'vue-router';
import AdminLayout from './views/AdminLayout.vue';
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/login', component: () => import('./views/LoginView.vue') }, { path: '/', component: AdminLayout, meta: { requiresAuth: true }, children: [
    { path: '', redirect: '/dashboard' },
    { path: 'dashboard', component: () => import('./views/DashboardView.vue') },
    { path: 'users', component: () => import('./views/UsersView.vue') },
    { path: 'content', component: () => import('./views/ContentReviewView.vue') },
    { path: 'points', component: () => import('./views/PointLedgerView.vue') },
    { path: 'growth', component: () => import('./views/ComingSoonView.vue'), props: { title: '成长银行', description: '配置五育指标、审核成长记录、查看积分入账与冲正记录。' } },
    { path: 'challenges', component: () => import('./views/ComingSoonView.vue'), props: { title: '挑战活动', description: '创建官方挑战、配置参与条件、追踪完成进度并自动发放奖励。' } },
    { path: 'mall', component: () => import('./views/ComingSoonView.vue'), props: { title: '商城商品', description: '维护商品、价格、库存、上架状态；订单和支付将在第二阶段接入。' } },
    { path: 'system', component: () => import('./views/ComingSoonView.vue'), props: { title: '权限与审计', description: '管理后台角色、权限矩阵和关键操作审计记录。' } }
  ] }]
});
router.beforeEach((to) => { if (to.meta.requiresAuth && !localStorage.getItem('admin_token')) return '/login'; if (to.path === '/login' && localStorage.getItem('admin_token')) return '/dashboard'; });
export default router;
