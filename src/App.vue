<script lang="ts" setup>
import { useLoginStore } from '@/store/login';

// 載入瀏覽器會話
const login = useLoginStore();
login.load();
login.$subscribe(login.save);
</script>

<template>
  <router-view />
</template>

<style lang="scss">
@import './assets/scss/all.scss';
</style>
