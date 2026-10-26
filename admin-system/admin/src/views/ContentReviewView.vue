<script setup lang="ts">
import { ref } from 'vue';
const status = ref('PENDING');
const items = ref([
  { id: 1, title: '今天孩子主动收拾了书桌', author: '王小敏', type: '成长记录', submitted: '10:32', status: 'PENDING' },
  { id: 2, title: '亲子阅读《弟子规》的小方法', author: '李欣', type: '社区文章', submitted: '09:48', status: 'PENDING' },
  { id: 3, title: '坚持跳绳打卡第 14 天', author: '陈浩', type: '社区动态', submitted: '昨天 21:16', status: 'PUBLISHED' }
]);
function review(item: typeof items.value[number], next: string) { item.status = next; }
</script>
<template><section><h1>内容审核</h1><el-card><div class="toolbar"><el-radio-group v-model="status"><el-radio-button label="PENDING">待审核</el-radio-button><el-radio-button label="PUBLISHED">已通过</el-radio-button></el-radio-group><span class="muted">审核操作会写入审计日志</span></div><el-table :data="items.filter(item => item.status === status)"><el-table-column prop="title" label="内容标题" min-width="250"/><el-table-column prop="type" label="类型"/><el-table-column prop="author" label="提交人"/><el-table-column prop="submitted" label="提交时间"/><el-table-column label="操作" width="180"><template #default="{ row }"><template v-if="row.status === 'PENDING'"><el-button link type="success" @click="review(row, 'PUBLISHED')">通过</el-button><el-button link type="danger" @click="review(row, 'REJECTED')">驳回</el-button></template><el-tag v-else type="success">已通过</el-tag></template></el-table-column></el-table></el-card></section></template>
