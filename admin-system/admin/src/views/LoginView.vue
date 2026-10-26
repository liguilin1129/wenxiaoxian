<script setup lang="ts">
import { reactive, ref } from 'vue'; import { useRouter } from 'vue-router'; import { ElMessage } from 'element-plus'; import { api } from '../api';
const router = useRouter(); const loading = ref(false); const form = reactive({ email: 'admin@wenxiaoxian.local', password: 'ChangeMe123!' });
async function login() { loading.value = true; try { const { data } = await api.post('/admin/auth/login', form); localStorage.setItem('admin_token', data.token); await router.replace('/dashboard'); } catch (error:any) { ElMessage.error(error.response?.data?.message || '登录失败'); } finally { loading.value = false; } }
</script>
<template><main class="login-page"><el-card class="login-card"><h1>文小贤运营后台</h1><p>请使用管理员账号登录</p><el-form :model="form" label-position="top" @submit.prevent="login"><el-form-item label="邮箱"><el-input v-model="form.email"/></el-form-item><el-form-item label="密码"><el-input v-model="form.password" type="password" show-password/></el-form-item><el-button type="primary" native-type="submit" :loading="loading" class="login-button">登录</el-button></el-form></el-card></main></template>
