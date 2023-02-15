<script setup lang="ts">
import axios from 'axios';
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMenuStore } from '@/store/menu';
import { useLoginStore } from '@/store/login';
import { PostInterop2, PostInteropError2 } from '@/ts/postinterop2';
import LoadingScreen from '@/components/LoadingScreen.vue';

const isQuerying = ref(false);
const store = useMenuStore();
const router = useRouter();
const login = useLoginStore();
const uid = computed(() => (login.verifyid?.uid || ''));
const uname = computed(() => (login.verifyid?.uname || ''));
const companyCode = computed(() => (login.verifyid?.companycode || ''));
const companyCode1 = computed(() => (login.verifyid?.companycode1 || ''));
const coName = computed(() => (login.verifyid?.coname || ''));
const coId = computed(() => (login.verifyid?.coid || ''));
const uallowed = computed(() => (login.verifyid?.uallowed || ''));
const cct = computed(() => (login.verifyid?.cct || ''));
const uct = computed(() => (login.verifyid?.uct || ''));
const docisf = computed(() => (login.verifyid?.docisf || ''));
const allowkeyinbranch = computed(() => (login.verifyid?.allowkeyinbranch || ''));
const dbconfig = computed(() => (login.verifyid?.dbconfig || ''));

type json_query = {
  error: {
    Code: string;
    Message: string;
  }[];
};

// 判斷是否同一頁決定重新整理還是換頁
function reloadAndRedirect(path: string) {
  if (router.currentRoute.value.fullPath == path) {
    router.go(0);
  } else {
    router.push(path);
  }
}

// 開啟文件系統
async function openDocSystem(opType: string) {
  try {
    // 設定 websocket 連線資訊
    const pi2Url = 'ws://127.0.0.1:1919/Exe/';
    const pi2 = new PostInterop2(pi2Url);

    // 設定連結的執行檔名稱
    pi2.application = 'DocSystem';

    // 連線
    await pi2.connect();

    // 文件功能參數
    let type = '';
    if (opType == 'CREATE') type = 'CREATE';
    else if (opType == 'MODIFY') type = 'MODIFY';
    else if (opType == 'BATCHSCAN') type = 'BATCHSCAN';
    else if (opType == 'BATCHCREATE') type = 'BATCHCREATE';
    else if (opType == 'QUERY') type = 'QUERY';
    else if (opType == 'CONFIRM') type = 'CONFIRM';
    else if (opType == 'SUPPLY') type = 'SUPPLY';

    // 執行檔參數設定
    const args = [
      // 使用者代號
      `/U=${uid.value}`,
      // 使用者中文姓名
      `/UN=${uname.value}`,
      // 分行別
      `/C=${companyCode.value}`,
      `/C1=${companyCode1.value}`,
      // 銀行名稱
      `/CN=${coName.value}`,
      // 公司代碼
      `/COID=${coId.value}`,
      // 使用者權限
      `/A=${uallowed.value}`,
      // 建檔不需核可類別
      `/CCT=${cct.value}`,
      // 變更不需核可類別
      `/UCT=${uct.value}`,
      // 文件聯行變更開關
      `/DOCISF=${docisf.value}`,
      // 代建行
      `/AKB=${allowkeyinbranch.value}`,
      // 中心 IP
      `/IPC=${location.origin}`,
      // 資料庫設定
      `/DBC=${dbconfig.value}`,
      // 建檔 修改 查詢 核可 批次掃描 批次建檔
      `/STARTUP=${type}`,
    ];

    // 執行 exe
    await pi2.open(args);

    // 等待程式結束
    const data = await pi2.waitEvent('OnClose');

    // 判斷是否正常結束
    const exitcode = data.ExitCode;
    if (exitcode != 0) {
      throw new Error('非正常結束，返回值 = ' + exitcode);
    }
  } catch (error) {
    let message = error;
    if (error instanceof PostInteropError2) {
      message = error.message;
      if (error.code == -1001) message = '程式已開啟';
    }
    alert(message);
  }
}

// 開啟 BarCode
async function openBarCode() {
  try {
    // 設定 websocket 連線資訊
    const pi2Url = 'ws://127.0.0.1:1919/Exe/';
    const pi2 = new PostInterop2(pi2Url);

    // 設定連結的執行檔名稱
    pi2.application = 'BarCode';

    // 連線
    await pi2.connect();

    // 執行檔參數設定
    const args: unknown = [];

    // 執行 exe
    await pi2.open(args);

    // 等待程式結束
    const data = await pi2.waitEvent('OnClose');

    // 判斷是否正常結束
    const exitcode = data.ExitCode;
    if (exitcode != 0) {
      throw new Error('非正常結束，返回值 = ' + exitcode);
    }
  } catch (error) {
    let message = error;
    if (error instanceof PostInteropError2) {
      message = error.message;
      if (error.code == -1001) message = '程式已開啟';
    }
    alert(message);
  }
}

// 下載操作手冊
function downloadGuideline() {
  const link = document.createElement('a');
  link.setAttribute('href', '/nifront/test/guideline.pdf');
  link.setAttribute('download', '通用表單系統操作手冊.pdf');
  link.click();
  link.remove();
}

// 使用者同步作業
async function userDataCheck() {
  let res: json_query;
  // 查詢
  const tmpres = await axios.post('/nibox/userdatacheck.jsp', {
    responseType: 'json',
  });
  res = tmpres.data;

  let basic = res.error[0].Code;
  let message = res.error[0].Message;

  if (basic != '00000000') {
    throw new Error(`${basic}: ${message}`);
  }
}

// 使用者資料表回存作業
async function userDataRestore() {
  let res: json_query;
  // 查詢
  const tmpres = await axios.post('/nibox/userdatarestore.jsp', {
    responseType: 'json',
  });
  res = tmpres.data;

  let basic = res.error[0].Code;
  let message = res.error[0].Message;

  if (basic != '00000000') {
    throw new Error(`${basic}: ${message}`);
  }
}

// 確認彈出視窗
async function confirmPopup(page: string, message: string) {
  // 顯示查詢畫面
  isQuerying.value = true;

  try {
    // 確認視窗
    const isCheck = confirm(message);

    // 選擇確定
    if (isCheck) {
      // 使用者同步作業
      if (page == 'ni4-6') {
        await userDataCheck();
      } // 使用者資料表回存作業
      else if (page == 'ni4-7') {
        await userDataRestore();
      }
    }
  } catch (error) {
    let message = error;
    if (error instanceof Error) {
      message = error.message;
    }
    alert(message);
  } finally {
    // 隱藏 Loading 畫面
    isQuerying.value = false;
  }
}

// 初始化
onMounted(() => {
  // 設定跳轉頁面
  store.setCallback('ni1-1', () => openDocSystem('CREATE'));
  store.setCallback('ni1-2', () => openDocSystem('MODIFY'));
  store.setCallback('ni1-3', () => openDocSystem('BATCHSCAN'));
  store.setCallback('ni1-4', () => openDocSystem('BATCHCREATE'));
  store.setCallback('ni1-5', () => openDocSystem('QUERY'));
  store.setCallback('ni1-6', () => openDocSystem('CONFIRM'));
  store.setCallback('ni1-7', () => openBarCode());
  store.setCallback('ni1-8', () => openDocSystem('SUPPLY'));
  store.setCallback('ni2-2', () => reloadAndRedirect('/menu-ni/UserModify'));
  store.setCallback('ni2-3', () => reloadAndRedirect('/menu-ni/RoleGroup'));
  store.setCallback('ni2-4', () => reloadAndRedirect('/menu-ni/UserTempAuthorize'));
  store.setCallback('ni2-5', () => reloadAndRedirect('/menu-ni/UserUnlock'));
  store.setCallback('ni2-6', () => reloadAndRedirect('/menu-ni/UserPermissionReport'));
  store.setCallback('ni2-7', () => reloadAndRedirect('/menu-ni/UserReport'));
  store.setCallback('ni3-1', () => reloadAndRedirect('/menu-ni/CreateFileStatus'));
  store.setCallback('ni3-2', () => reloadAndRedirect('/menu-ni/UserLoginReport'));
  store.setCallback('ni3-3', () => reloadAndRedirect('/menu-ni/DataQueryReport'));
  store.setCallback('ni3-6', () => reloadAndRedirect('/menu-ni/ArchivedList'));
  store.setCallback('ni3-7', () => reloadAndRedirect('/menu-ni/InterbankDeposit'));
  store.setCallback('ni3-8', () => reloadAndRedirect('/menu-ni/ScanReport'));
  store.setCallback('ni3-9', () => reloadAndRedirect('/menu-ni/SystemRecord'));
  store.setCallback('ni4-1', () => reloadAndRedirect('/menu-ni/BranchMaintain'));
  store.setCallback('ni4-2', () => reloadAndRedirect('/menu-ni/MainDocMaintain'));
  store.setCallback('ni4-3', () => reloadAndRedirect('/menu-ni/SubDocMaintain'));
  store.setCallback('ni4-4', () => reloadAndRedirect('/menu-ni/WhiteList'));
  store.setCallback('ni4-5', () => reloadAndRedirect('/menu-ni/PreWork'));
  store.setCallback('ni4-6', () => confirmPopup('ni4-6', '是否確定執行使用者同步 ?'));
  store.setCallback('ni4-7', () => confirmPopup('ni4-7', '是否確定執行使用者資料表回存作業 ?'));
  store.setCallback('ni4-8', () => reloadAndRedirect('/menu-ni/FTPMaintain'));
  store.setCallback('ni4-9', () => reloadAndRedirect('/menu-ni/DBMaintain'));
  store.setCallback('ni4-10', () => reloadAndRedirect('/menu-ni/MiddleDocMaintain'));
  store.setCallback('ni4-11', () => reloadAndRedirect('/menu-ni/SubDocConfirm'));
  store.setCallback('ni5-1', () => downloadGuideline());
});
</script>

<template>
  <!--loading-->
  <LoadingScreen message='處理中，請稍候...' :visible='isQuerying' />

  <!-- 側邊選單 -->
  <aside class="bg-primary menu-layout p-3">
    <ul class="list-unstyled">
      <li class="mb-1" v-show="item.visible" v-for="item in store.menu" :key="item.id">
        <button class="btn btn-toggle align-items-center collapsed text-white" data-bs-toggle="collapse"
          :data-bs-target="'#' + item.id" aria-expanded="false">
          {{ item.title }}
        </button>
        <div class="collapse" :class="{ show: item.selected }" :id="item.id">
          <ul class="btn-toggle-nav list-unstyled pb-1 small">
            <li class="pb-2" v-show="page.visible" v-for="page in item.pages" :key="page.id">
              <router-link to="" class="rounded text-white" :class="{ select: page.selected }" @click="page.callback">
                {{ page.title }}
              </router-link>
            </li>
          </ul>
        </div>
      </li>
    </ul>
  </aside>
</template>

<style lang="scss" scoped>
.menu-layout {
  width: 220px;
  height: calc(100vh - 71px);
  overflow-y: auto;
  position: sticky;
  top: 71px;
  padding: 24px;
}

.btn-toggle {
  display: inline-flex;
  padding: 0.25rem 0.5rem;
  font-weight: 600;
  border: 0;
}

.btn-toggle::before {
  width: 1.25em;
  line-height: 0;
  content: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='white' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5 14l6-6-6-6'/%3e%3c/svg%3e");
  transition: transform 0.35s ease;
  transform-origin: 0.5em 50%;
}

.btn-toggle[aria-expanded='true']::before {
  transform: rotate(90deg);
}

.btn-toggle-nav a {
  display: inline-flex;
  padding: 0.1875rem 0.5rem;
  margin-top: 0.125rem;
  margin-left: 1.25rem;
}

.btn-toggle-nav a:hover,
.btn-toggle-nav a:focus {
  background-color: #5fc68be6;
  font-weight: bold;
}

.btn-toggle-nav .select {
  background-color: #5fc68be6;
}
</style>
