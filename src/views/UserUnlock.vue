<script lang="ts" setup>
import axios from 'axios';
import { Base64 } from 'js-base64';
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useMenuStore } from '@/store/menu';
import { useLoginStore } from '@/store/login';
import LoadingScreen from '@/components/LoadingScreen.vue';
import Pagination from '@/components/PageContainer.vue';
import { Have_Full_Width, Have_CH , res4Mapping} from '@/ts/comm';
import { doPost_niusers , NiusersItem } from '@/store/niusers';

const login = useLoginStore();
const ulevel = computed(() => (login.verifyid?.ulevel || ''));
const ugroup = ref<type_nigroup[]>([]);
const queryselect = ref(true);
const queryFinish = ref(false);
const isModUser = ref(false);
const Moditem = ref<NiusersItem[]>([]);
const Moditem_old = ref<NiusersItem[]>([]);
const store = useMenuStore();
const isQuerying = ref(false);
const queryUserName = ref('');
const current_page_index = ref(1);
const total_page = ref('1');
const niroletype = ref('');
const uid = computed(() => (login.verifyid?.uid || ''));
const uname = computed(() => (login.verifyid?.uname || ''));
const data_count = ref(1);//有BUG
const ListData = ref<NiusersItem[]>([]);
let ListLength = ref(0);
const isNoData = ref(false);//無資料欄位;




type type_nigroup = {
    nirole: string;
    niroletype: string;
    nigroup: string;
    hiddenflag: string;
}


function backToQuery() {
  //關閉清單頁面回到查詢頁
  queryselect.value = true;
  queryFinish.value = false;
  isModUser.value = false;
}

async function queryList(query_page: number) {
  isNoData.value = false;//無資料隱藏
  //查詢清單 queryUserName = uid 不輸入查全部
  if (query_page < 1) {
    alert('頁數不可小於1');
    return;
  }
  if (query_page > parseInt(total_page.value)) {
    alert('頁數不可大於最大頁數');
    return;
  }
  if (query_page == 0) {
    return;
  }
  ListData.value = [];
  isQuerying.value = true;
  let query_ugroup = '';
  for (let i = 0; i < ugroup.value.length; i++) {
    if (query_ugroup != '') {
      query_ugroup += '_';
    }
    query_ugroup += ugroup.value[i].nirole;
  }
  try {
    //post 參數設定
    let params = new URLSearchParams();
    params.append('optype', '1');
    if (queryUserName.value == '') {//未輸入ID時進入分頁模式
      params.append('pages', query_page.toString());
    }
    params.append('ugroup', Base64.encode(query_ugroup));//先用niroletype查可以改的角色 送角色中文 以底線'_' 串 把該角色的使用者查出來 =>轉base64
    params.append('ipage', '10');//一頁10筆

    if (queryUserName.value != '') {
      params.append('uid', queryUserName.value);
    }
    params.append('ustatus', '1');//查詢鎖定中

    let tempres = await doPost_niusers(params);
    let basic = tempres.error[0].Code;
    let message = tempres.error[0].Message;
    if (basic != '00000000') {
      throw new Error(`${basic}: ${message}`);
    }

    let count = tempres.error[0].Count || '';
    if (parseInt(count)  == 0) {
      isNoData.value = true;//無資料顯示
    }
    let totalpage = tempres.error[0].totalpage;
    if (tempres.data == null || count == null || totalpage == null) {
      throw new Error('伺服器回傳錯誤的資料格式');
    }

    ListData.value = tempres.data;
    queryselect.value = false;
    queryFinish.value = true;
    total_page.value = totalpage;
    if (total_page.value == '0') {
      total_page.value = '1';
    }
    data_count.value = parseInt(count);
  } catch (error) {
    let message = error;
    if (error instanceof Error) {
      message = error.message;
    }
    alert(`${message}`);
  } finally {
    isQuerying.value = false;
  }
}

async function modUser(uid:string) {
  //解鎖使用者 參數僅需uid

  isQuerying.value = true;
  try {
    //post 參數設定
    let params = new URLSearchParams();
    params.append('optype', '3');
    params.append('uid', uid);
    params.append('ustatus', '0');

    let tempres = await doPost_niusers(params);
    let basic = tempres.error[0].Code;
    let message = tempres.error[0].Message;
    if (basic != '00000000') {
      throw new Error(`${basic}: ${message}`);
    }

    alert('解鎖成功');
    
    await queryList(current_page_index.value);//刪除成功後保持查詢頁 並刷新
  } catch (error) {
    let message = error;
    if (error instanceof Error) {
      message = error.message;
    }
    alert(`${message}`);
  } finally {
    isQuerying.value = false;
  }
}

async function changePageIndex(index: number) {
  current_page_index.value = index;
  await queryList(current_page_index.value);
}

function clear_queryUserName() {
  queryUserName.value = '';
}


onMounted(async () => {
  // 展開此頁面選單
  store.setMainMenuSelect('user_setting');
  store.setSubMenuSelect('ni2-5');
});


watch(() => queryUserName.value, (newValue, oldValue) => {
  if (Have_Full_Width(newValue)) {
    queryUserName.value = oldValue;
  }
  if (Have_CH(newValue)) {
    queryUserName.value = oldValue;
  }
});
</script>
<template>
  <!--loading-->
  <LoadingScreen message='處理中，請稍候...' :visible='isQuerying' />

  <!-- 頁面標題 -->
  <h1 class="text-center p-3">查詢待解鎖之使用者資料</h1>

  <!-- 查詢選擇 -->
  <div v-if="queryselect">
    <div class="table-responsive">
      <div class="d-flex justify-content-center">
        <table class="table table-bordered" style="width: 80%;">
          <tbody>
            <!-- <tr>
              <th class="text-center" colspan="2" scope="row">尋找/更改目標</th>
            </tr> -->
            <tr>
              <th class="bg-table align-middle text-center">使用者帳號(不輸入表示查詢全部)</th>
              <td><input type="text" class="form-control" maxlength="20" placeholder="使用者帳號" v-model='queryUserName' />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- 功能按鈕 -->
      <div class="d-flex justify-content-center mb-3">
        <button type="button" class="btn btn-secondary btn-lg me-5" @click="queryList(1)">查詢</button>
        <button type="button" class="btn btn-primary btn-lg" @click="clear_queryUserName()">清除</button>
      </div>
    </div>
  </div>

  <!-- 查詢完成 -->
  <div v-show="queryFinish">
    <!-- 功能按鈕 -->
    <div class="d-flex justify-content-end m-3">
      <button class="btn btn-primary" @click="backToQuery()">
        <i class="bi bi-arrow-clockwise"></i>
        重新查詢
      </button>
    </div>

    <!-- 表單 -->
    <div class="table-responsive d-flex justify-content-center">
      <table class="table table-bordered text-center">
        <thead class="text-nowrap">
          <tr class="bg-table">
            <th scope="col">使用者代號</th>
            <th scope="col">使用者姓名</th>
            <th scope="col">HR階層</th>
            <th scope="col">角色權限</th>
            <th scope="col">狀態</th>
            <th scope="col">執行</th>
          </tr>
        </thead>
        <tbody class="text-nowrap">
          <tr class="align-middle" v-for="item in ListData" :key="item.uid">
            <td  style="width:20%" scope="row" >{{ item.uid }}</td>
            <td  scope="row" >{{ item.uname }}</td>
            <td  >{{ res4Mapping(item.res4) }}</td>
            <td  >{{ item.ugroup }}</td>
            <td   v-if="item.ustatus != '1'">
              未登入
            </td>
            <td   v-if="item.ustatus == '1'">
              已登入
            </td>
            <td ><button @click="modUser(item.uid)">解除鎖定</button></td>
          </tr>
          <tr v-if="isNoData"><td  colspan="6">查無資料</td></tr>
        </tbody>
      </table>
    </div>
    <!-- 分頁 -->
    <div class="d-flex justify-content-end">
      <Pagination :queryCount="data_count" :currentIndex="current_page_index" :totalPage="total_page"
        @change-page-index="changePageIndex" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.pointer {
  cursor: pointer;
}

.bg-table {
  background: lightgray
}
</style>
