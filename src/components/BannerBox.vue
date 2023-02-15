<script lang="ts" setup>
import axios from 'axios';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useLoginStore } from '@/store/login';
import LoadingScreen from '@/components/LoadingScreen.vue';

const router = useRouter();
const login = useLoginStore();
const uid = computed(() => login.verifyid?.uid || '');
const uname = computed(() => login.verifyid?.uname);
const isLogon = computed(() => login.verifyid != null);
const emit = defineEmits(['openChangePW']);
const isQuerying = ref(false);
const companycode1 = computed(() => login.verifyid?.companycode1 || '');

// 登出
async function doLogout() {
  //寫登出報表
  const params = new URLSearchParams();
  params.append('nii', uid.value);
  isQuerying.value = true;

  try {
    // 發送請求並解析結果
    let doc: Document;

    if (process.env.NODE_ENV == 'development') {
      const resp = await axios.get('test/logoff_seal.xml', {
        responseType: 'document',
      });
      doc = resp.data;
    } else {
      const resp = await axios.post('/nibox/logoff_seal.jsp', params, {
        responseType: 'document',
      });
      doc = resp.data;
    }

    if (doc == null) {
      throw new Error('伺服器回傳錯誤的資料格式');
    }

    const basic = doc.querySelector('error[name="Basic"]')?.textContent;
    const message = doc.querySelector('error[name="Message"]')?.textContent;

    // 0=正常 8=第一次 9=過期  8與9不會回正常資訊只能暫存uid
    if (basic !== '00000000') {
      throw new Error(`登出失敗: ${basic}\n${message}`);
    }
    if (basic == '00000000') {
      // 清空登入資訊
      login.verifyid = null;
      // 跳轉回首頁
      await router.push({ path: '/' });
    }
  } catch (error) {
    let message = error;
    if (error instanceof Error) {
      message = error.message;
    }
    alert(`登出過程中發生錯誤:\n${message}`);
  } finally {
    isQuerying.value = false;
  }
}

// 開啟變更密碼視窗
function openChangePW() {
  emit('openChangePW');
}
</script>

<template>
  <!-- 處理中請稍候 -->
  <LoadingScreen message='處理中，請稍候...' :visible='isQuerying' />

  <!-- 導覽列 -->
  <nav class="navbar bg-light navbar-expand border-gold sticky-top">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">
        <img src="../assets/images/logo.png" alt="logo" title="第一銀行">
      </a>
      <div>
        <ul class="navbar-nav me-auto mb-0 justify-content-end" v-if="isLogon">
          <li class="nav-item d-flex align-items-center">
            <span class="nav-link link-primary">{{ companycode1 }}</span>
          </li>
          <li class="nav-item d-flex align-items-center">
            <i class="bi bi-person link-primary"></i>
            <span class="nav-link link-primary">{{ uid }}{{ uname }}</span>
          </li>
          <li class="nav-item">
            <a class="nav-link link-primary" href="#" @click="doLogout">
              <i class="bi bi-box-arrow-right"></i>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<style lang="scss" scoped>
.border-gold {
  border-bottom: 2px solid #B5883B;
}

.cursor {
  cursor: pointer;
}
</style>