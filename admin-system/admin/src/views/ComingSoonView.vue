<script setup lang="ts">defineProps<{ title: string; description: string }>();</script>
<template><section><h1>{{ title }}</h1><el-card class="coming"><el-empty description="模块开发中"><template #description><p>{{ description }}</p><p class="muted">数据模型与导航已预留，下一阶段将接入 API。</p></template></el-empty></el-card></section></template>
