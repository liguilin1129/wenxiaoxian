<script setup lang="ts">
const modules = [
  { label: '数据概览', path: '/dashboard' }, { label: '用户与家庭', path: '/users' },
  { label: '内容审核', path: '/content' }, { label: '任务与积分', path: '/points' },
  { label: '成长银行', path: '/growth' }, { label: '挑战活动', path: '/challenges' },
  { label: '商城商品', path: '/mall' }, { label: '权限与审计', path: '/system' }
];
</script>
<template>
  <el-container class="shell"><el-aside width="232px"><div class="brand">文小贤 <small>运营后台 · 演示数据</small></div><el-menu router default-active="/dashboard"><el-menu-item v-for="item in modules" :key="item.path" :index="item.path">{{ item.label }}</el-menu-item></el-menu></el-aside>
  <el-container><el-header><span>运营管理</span><el-tag type="success">开发环境</el-tag></el-header><el-main><router-view /></el-main></el-container></el-container>
</template>
