<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useLoginStore } from '@/store/login';
import BannerBox from '@/components/BannerBox.vue';
import MenuBox from '@/components/MenuBox.vue';
import AppChangePW from '@/components/AppChangePW.vue';

const router = useRouter();
const login = useLoginStore();
const isChangePW = ref(false);

onMounted(() => {
  // 檢查登入狀態
  if (login.verifyid == null) {
    // 尚未登入，跳轉頁面
    router.push({ path: '/' });
  }
});

// 開啟變更密碼視窗
function openChangePW() {
  isChangePW.value = true;
}

// 關閉變更密碼視窗
function closeChangePW() {
  isChangePW.value = false;
}
</script>

<template>
  <!-- 變更密碼 -->
  <AppChangePW v-if="isChangePW" @closeChangePW="closeChangePW" />
  <!-- 導覽列 -->
  <BannerBox @openChangePW="openChangePW" />
  <div class="d-flex">
    <!-- 側邊選單 -->
    <MenuBox />
    <div class="container page-layout mt-5">
      <!-- 頁面內容 -->
      <router-view />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.page-layout {
  min-width: calc(100vw - 220px);
}
</style>
