<script lang="ts" setup>
defineProps({
  message: {
    type: String,
    default: null,
  },
  visible: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <div class="loading-screen" v-if="visible">
    <div class="d-flex align-items-center justify-content-center h-100">
      <div class="spinner-border" role="status"></div>
      <span class="ms-2 fs-4">{{ message }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-screen {
  // 佔滿畫面
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;

  // 置頂
  z-index: 1100;

  // 背景顏色
  background-color: black;
  opacity: 75%;

  // 文字顏色
  color: #fff;
}
</style>
