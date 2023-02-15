<script lang="ts" setup>
import axios from 'axios';
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useMenuStore } from '@/store/menu';
import { useLoginStore } from '@/store/login';
import { DateDiff, date_time_trans_replaceZ, Have_Full_Width, Have_CH, date_check_year, date_check_comparator } from '@/ts/comm';
import Pagination from '@/components/PageContainer.vue';
import { Nirole_data, doPost_nigroup } from '@/store/nigroup';
import { BranchList, queryBranchList } from '@/store/companyid_mapping';
import LoadingScreen from '@/components/LoadingScreen.vue';


let today1: string;
let today2: string;
let Today = new Date();
today1 = Today.toISOString().split('T')[0];
today2 = Today.toISOString().split('T')[0];
const store = useMenuStore();
const queryFinish = ref(false);
const queryForm = ref(true);
const isQuerying = ref(false);
const login = useLoginStore();
const ulevel = computed(() => (login.verifyid?.ulevel || ''));
const NiroleData = ref<Nirole_data[]>([]);

const query_slpasser = ref('');
const query_res2 = ref('');
const query_res5 = ref('');
const query_optype = ref('A');
const query_sludate1 = ref(today1);
const query_sludate2 = ref(today2);
const query_res1 = ref('');
const print_pdf = ref('');
const DL_excel = ref('');
const total_page = ref('0');
const current_page_index = ref(0);
const query_mask = ref(false);//是否遮罩

const ListData = ref<jkLogin[]>([]);
let page_lim = 10;
const uid = computed(() => (login.verifyid?.uid || ''));
const RQI = computed(() => (login.verifyid?.RQI || ''));
const Branch_List = ref<BranchList[]>([]);
const isNoData = ref(false);//無資料欄位;
const companycode = computed(() => (login.verifyid?.companycode || ''));
query_res5.value = companycode.value;

type jkLogin = {
  Index: string;
  slpasser: string;
  res2: string;
  optype: string;
  sludate: string;
  res1: string;
  message: string;
};

type jsonres_jkLogin = {
  Code: string;
  Message: string;
  PDF: string;
  PostDatas?: jkLogin[]
};

function hideForm() {
  queryForm.value = false;
  queryFinish.value = true;
}
function hideLog() {
  queryFinish.value = false;
  queryForm.value = true;
}

async function doPost_jkLogin(params: URLSearchParams) {
  // 發送請求並回傳結果
  let res: jsonres_jkLogin;
  if (process.env.NODE_ENV == 'development') {
    const resp = await axios.get('test/jkLogin.json', {
      responseType: 'json',
    });
    res = resp.data;
  } else {
    const resp = await axios.post('/nibox/OneBank/jkLogin.jsp', params, {//正式
      responseType: 'json',
    });
    res = resp.data;
  }

  return res;
}

async function queryList() {

  isNoData.value = false;//無資料隱藏
  let query_mask_string = '';
  query_mask_string = (query_mask.value) ? '1' : '0';
  if (query_sludate1.value == '') {
    alert('必須輸入起始日期');
    return;
  }
  if (query_sludate2.value == '') {
    alert('必須輸入截止日期');
    return;
  }
  if (!date_check_comparator(query_sludate1.value, query_sludate2.value)) {
    alert('截止日期必須大於起始日');
    return;
  }
  if (DateDiff(new Date(query_sludate2.value), new Date(query_sludate1.value)) > parseInt(RQI.value)) {
    alert('日期區間不可大於' + RQI.value + '日');
    return;
  }
  if (!date_check_year(query_sludate1.value)) {
    alert('西元年不得小於1901或大於9999');
    return;
  }
  if (!date_check_year(query_sludate2.value)) {
    alert('西元年不得小於1901或大於9999');
    return;
  }
  //查詢初始化
  ListData.value = [];
  //查詢角色建立選單
  isQuerying.value = true;
  try {
    let params = new URLSearchParams();
    params.append('OPAction', 'query');
    params.append('mask', query_mask_string);//遮罩
    params.append('slpasser', query_slpasser.value);//使用者帳號
    params.append('optype', query_optype.value);//操作類型
    params.append('res2', query_res2.value);//使用者姓名
    params.append('res5', query_res5.value);//分行別
    params.append('sludate1', query_sludate1.value.replaceAll('-', ''));//操作日期(起)
    params.append('sludate2', query_sludate2.value.replaceAll('-', '')); //操作日期(迄)
    params.append('res1', query_res1.value);//IP
    params.append('userID_check', uid.value);//浮水印用登入者ID

    let tempres = await doPost_jkLogin(params);
    let Code = tempres.Code;
    let message = tempres.Message;
    if (Code != '00000000' && Code != '00000005') {


      throw new Error(`${Code}: ${message}`);
    }

    if (tempres.Code == '00000005') {
      tempres.PostDatas = [];
      total_page.value = '0';
      isNoData.value = true;//無資料顯示
    }

    if (tempres.PostDatas == null) {
      throw new Error('伺服器回傳錯誤的資料格式');
    }

    let params_pdf = new URLSearchParams();
    params_pdf.append('OPAction', 'printPDF');
    params_pdf.append('mask', query_mask_string);//遮罩
    params_pdf.append('slpasser', query_slpasser.value);//使用者帳號
    params_pdf.append('optype', query_optype.value);//操作類型
    params_pdf.append('res2', query_res2.value);//使用者姓名
    params_pdf.append('res5', query_res5.value);//分行別
    params_pdf.append('sludate1', query_sludate1.value.replaceAll('-', ''));//操作日期(起)
    params_pdf.append('sludate2', query_sludate2.value.replaceAll('-', '')); //操作日期(迄)
    params_pdf.append('res1', query_res1.value);//IP
    params_pdf.append('userID_check', uid.value);//浮水印用登入者ID

    print_pdf.value = '/nibox/OneBank/jkLogin.jsp?' + params_pdf;

    let params_excel = new URLSearchParams();
    params_excel.append('OPAction', 'printEXCEL');
    params_excel.append('mask', query_mask_string);//遮罩
    params_excel.append('slpasser', query_slpasser.value);//使用者帳號
    params_excel.append('res2', query_res2.value);//使用者姓名
    params_excel.append('res5', query_res5.value);//分行別
    params_excel.append('optype', query_optype.value);//操作類型
    params_excel.append('sludate1', query_sludate1.value.replaceAll('-', ''));//操作日期(起)
    params_excel.append('sludate2', query_sludate2.value.replaceAll('-', '')); //操作日期(迄)
    params_excel.append('res1', query_res1.value);//IP
    params_excel.append('userID_check', uid.value);//浮水印用登入者ID

    DL_excel.value = '/nibox/OneBank/jkLogin.jsp?' + params_excel;

    ListData.value = tempres.PostDatas;
    current_page_index.value = 1;
    total_page.value = Math.ceil(ListData.value.length / page_lim).toString();
    hideForm();
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


function PrintPDF() {
  window.open(print_pdf.value);
}

function DownLoadExcel() {
  window.open(DL_excel.value);
}

function changePageIndex(index: number) {
  current_page_index.value = index;
}


onMounted(async () => {

  //查詢分行別清單
  isQuerying.value = true;
  Branch_List.value = await queryBranchList() || Branch_List.value;
  isQuerying.value = false;
  // 展開此頁面選單
  store.setMainMenuSelect('system_report');
  store.setSubMenuSelect('ni3-2');
});

watch(() => query_slpasser.value, (newValue, oldValue) => {
  if (Have_Full_Width(newValue)) {
    query_slpasser.value = oldValue;
  }
  if (Have_CH(newValue)) {
    query_slpasser.value = oldValue;
  }
});

watch(() => query_res1.value, (newValue, oldValue) => {
  if (Have_Full_Width(newValue)) {
    query_res1.value = oldValue;
  }
  if (Have_CH(newValue)) {
    query_res1.value = oldValue;
  }
});
</script>

<template>
  <!--loading-->
  <LoadingScreen message='處理中，請稍候...' :visible='isQuerying' />

  <!-- 頁面標題 -->
  <h1 class="text-center p-3">使用者登出/入報表</h1>

  <!-- 表單 -->
  <div v-show="queryForm" class="table-responsive">
    <table class="table table-bordered">
      <tbody>
        <tr>
          <th class="bg-table align-middle text-center">分行別</th>
          <td>
            <select class="form-select" v-model="query_res5">
              <option v-for="item in Branch_List" :key="item.code" :value="item.code">{{ item.name }}</option>
            </select>
          </td>
        </tr>
        <tr>
          <th class="bg-table align-middle text-center">操作者帳號</th>
          <td><input type="text" class="form-control" maxlength="20" v-model='query_slpasser' />
          </td>
        </tr>
        <tr>
          <th class="bg-table align-middle text-center">操作者姓名</th>
          <td><input type="text" class="form-control" maxlength="60" v-model='query_res2' /></td>
        </tr>
        <tr>
          <th class="bg-table align-middle text-center">操作日期(西元年)</th>
          <td>
            <div class="input-group mb-3">
              <input type="date" max="9999-12-31" class="form-control" v-model='query_sludate1' />
              <span class="input-group-text">-</span>
              <input type="date" max="9999-12-31" class="form-control" v-model='query_sludate2' />
            </div>
          </td>
        </tr>
        <tr>
          <th class="bg-table align-middle text-center">類別</th>
          <td>
            <select class="form-select" v-model='query_optype'>
              <option value="A">全部</option>
              <option value="UserOPLogin">登入</option>
              <option value="UserOPLogoff">登出</option>
            </select>
          </td>
        </tr>
        <tr>
          <th class="bg-table align-middle text-center">來源IP</th>
          <td><input type="text" maxlength="15" class="form-control" v-model='query_res1' /></td>
        </tr>
        <tr>
            <th class="bg-table align-middle text-center">是否遮罩</th>
            <td class="text-center">
              <input type="checkbox" v-model="query_mask"  class="form-check-input" :value="true" />
            </td>
          </tr>
      </tbody>
    </table>

    <!-- 功能按鈕 -->
    <div class="d-flex justify-content-center mb-3">
      <button type="button" class="btn btn-primary btn-lg" @click="queryList()">送出</button>
    </div>
  </div>

  <div v-show="queryFinish">
    <!-- 功能按鈕 -->
    <div class="d-flex justify-content-end m-3">
      <button class="btn btn-primary me-3" @click="PrintPDF()">
        <i class="bi bi-file-text"></i>
        列印PDF
      </button>
      <button class="btn btn-primary me-3" @click="DownLoadExcel()">
        <i class="bi bi-file-text"></i>
        下載EXCEL
      </button>
      <button class="btn btn-primary" @click="hideLog()">
        <i class="bi bi-arrow-clockwise"></i>
        重新查詢
      </button>
    </div>

    <!-- 表單 -->
    <div class="table-responsive d-flex justify-content-center">
      <table class="table table-bordered text-center">
        <thead class="text-nowrap">
          <tr class="bg-table">
            <th scope="col">序號</th>
            <th scope="col">操作者姓名</th>
            <th scope="col">類別</th>
            <th scope="col">登出/入結果</th>
            <th scope="col">登出/入時間</th>
            <th scope="col">登出/入IP位置</th>
          </tr>
        </thead>
        <tbody class="text-nowrap">
          <tr class="align-middle" v-for="(item, Index) in ListData" :key="item.Index"
            v-show="Index < (current_page_index * page_lim) && Index >= (current_page_index - 1) * page_lim">
            <!--Index = 0-->
            <td scope="row">{{ item.Index }}</td>
            <td>{{ item.res2 }}</td>
            <td>{{ item.optype }}</td>
            <td>{{ item.message }}</td>
            <td>{{ date_time_trans_replaceZ(item.sludate) }}</td>
            <td>{{ item.res1 }}</td>
          </tr>
          <tr v-if="isNoData">
            <td colspan="6">查無資料</td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- 分頁 -->
    <div class="d-flex justify-content-end">
      <Pagination :queryCount="ListData.length" :currentIndex="current_page_index" :totalPage="total_page"
        @change-page-index="changePageIndex" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.bg-table {
  background: lightgray
}
</style>
