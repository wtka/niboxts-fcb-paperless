<script lang="ts" setup>
import axios from 'axios';
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useMenuStore } from '@/store/menu';
import { useLoginStore } from '@/store/login';
import { date_time_trans_replaceZ, Have_Full_Width, Have_CH, date_check_year, date_check_comparator } from '@/ts/comm';
import Pagination from '@/components/PageContainer.vue';
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


const query_companycode = ref('');
const query_ugroup = ref('A');
const print_pdf = ref('');
const DL_excel = ref('');
const total_page = ref('0');
const current_page_index = ref(0);
const query_mask = ref(false);//是否遮罩


const ListData = ref<UserPermission[]>([]);
const NiroleData = reactive<Nirole_data>({ data: [] });
let page_lim = 10;
const companycode = computed(() => (login.verifyid?.companycode || ''));
const HeadOffice = computed(() => (login.verifyid?.HeadOffice || ''));
query_companycode.value = companycode.value;
const uid = computed(() => (login.verifyid?.uid || ''));
const Branch_List = ref<BranchList[]>([]);
const isNoData = ref(false);//無資料欄位;
const wasValidated = ref(false);//驗證

type UserPermission = {
  Index: string;
  companycode: string;
  uid: string;
  uname: string;
  res4: string;
  ugroup: string;
  udate: string;
  res3: string;
};

type Nirole_data = {
  data: {
    nirole: string;
    niroletype: string;
    nigroup: string;
    hiddenflag: string;
    nigroup_array?: string[];
  }[];
};

type jsonres_nigroup = {
  error: {
    Code: string;
    Message: string;
    Count?: string;
  }[];
  data?: {
    nirole: string;
    niroletype: string;
    nigroup: string;
    hiddenflag: string;
  }[];
};


type jsonres_UserPermission = {
  Code: string;
  Message: string;
  PDF: string;
  PostDataCount: string;
  PostDatas?: UserPermission[]
};

function hideForm() {
  queryForm.value = false;
  queryFinish.value = true;
  wasValidated.value = false;
}
function hideLog() {
  queryFinish.value = false;
  queryForm.value = true;
  wasValidated.value = false;
}

async function doPost_CreateFileStatus(params: URLSearchParams) {
  // 發送請求並回傳結果
  let res: jsonres_UserPermission;
  if (process.env.NODE_ENV == 'development') {
    const resp = await axios.get('test/UserPermission.json', {
      responseType: 'json',
    });
    res = resp.data;
  } else {
    const resp = await axios.post('/nibox/OneBank/UserPermission.jsp', params, {//正式
      responseType: 'json',
    });
    res = resp.data;
  }

  return res;
}

async function queryUserChange() {
  isNoData.value = false; //無資料隱藏
  let query_mask_string = '';
  query_mask_string = (query_mask.value) ? '1' : '0';
  //查詢初始化
  ListData.value = [];
  
  //檢核
  wasValidated.value = true;
  const form = document.forms[0];
  if (!form.checkValidity()) {
    return;
  }

  isQuerying.value = true;
  //查詢角色建立選單
  try {
    let params = new URLSearchParams();
    params.append('OPAction', 'query');
    params.append('mask', query_mask_string);//遮罩

    params.append('companycode', query_companycode.value);//分行別
    params.append('ugroup', query_ugroup.value);//操作類型

    params.append('userID_check', uid.value);//登入者ID

    let tempres = await doPost_CreateFileStatus(params);
    let Code = tempres.Code;
    let message = tempres.Message;
    if (Code != '00000000' && Code != '00000005') {


      throw new Error(`${Code}: ${message}`);
    }

    if (tempres.Code == '00000005') {
      tempres.PostDatas = [];
      total_page.value = '0';
      isNoData.value = true; //無資料顯示
    }

    if (tempres.PostDatas == null) {
      throw new Error('伺服器回傳錯誤的資料格式');
    }

    let params_pdf = new URLSearchParams();
    params_pdf.append('OPAction', 'printPDF');
    params_pdf.append('mask', query_mask_string);//遮罩

    params_pdf.append('companycode', query_companycode.value);//分行別
    params_pdf.append('ugroup', query_ugroup.value);//操作類型

    params_pdf.append('userID_check', uid.value);//登入者ID

    print_pdf.value = '/nibox/OneBank/UserPermission.jsp?' + params_pdf;

    let params_excel = new URLSearchParams();
    params_excel.append('OPAction', 'printEXCEL');
    params_excel.append('mask', query_mask_string);//遮罩
    params_excel.append('companycode', query_companycode.value);//分行別
    params_excel.append('ugroup', query_ugroup.value);//操作類型

    params_excel.append('userID_check', uid.value);//登入者ID

    DL_excel.value = '/nibox/OneBank/UserPermission.jsp?' + params_excel;

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

async function doPost_nigroup(params: URLSearchParams) {
  // 發送請求並回傳結果
  let res: jsonres_nigroup;
  if (process.env.NODE_ENV == 'development') {
    const resp = await axios.get('test/nigroup.json', {
      responseType: 'json',
    });
    res = resp.data;
  } else {
    const resp = await axios.post('/nibox/nigroup.jsp', params, {
      responseType: 'json',
    });
    res = resp.data;
  }

  return res;
}

async function queryNirole() {
  //查詢角色建立選單
  isQuerying.value = true;
  try {
    let params = new URLSearchParams();
    params.append('optype', '0');
    //params.append('niroletype', niroletype);//全查 此權限與實際權限無關 僅是一個設定

    let tempres = await doPost_nigroup(params);
    let basic = tempres.error[0].Code;
    let message = tempres.error[0].Message;
    if (basic != '00000000') {
      throw new Error(`${basic}: ${message}`);
    }

    if (tempres.data == null) {
      throw new Error('伺服器回傳錯誤的資料格式');
    }

    NiroleData.data = tempres.data;
    split_nigroup_array();
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

function split_nigroup_array() {
  //將由底線串接的權限(nigroup) 切割為 array(nigroup_array) '1_2_3' => [1,2,3] 
  for (let i = 0; i < NiroleData.data.length; i++) {
    let temp_array = [];
    for (let j = 0; j < NiroleData.data[i].nigroup.split('_').length; j++) {
      temp_array.push(NiroleData.data[i].nigroup.split('_')[j]);
    }
    NiroleData.data[i].nigroup_array = temp_array;
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
  // 查詢權限列表
  await queryNirole();
  //查詢分行別清單
  isQuerying.value = true;
  Branch_List.value = await queryBranchList() || Branch_List.value;
  isQuerying.value = false;
  // 展開此頁面選單
  store.setMainMenuSelect('user_setting');
  store.setSubMenuSelect('ni2-6');
});


</script>

<template>
  <!--loading-->
  <LoadingScreen message='處理中，請稍候...' :visible='isQuerying' />

  <!-- 頁面標題 -->
  <h1 class="text-center p-3">人員權限明細表</h1>
  <form @submit.prevent="queryUserChange" id="addForm" :class="{ 'was-validated': wasValidated }"
    class="table-responsive" novalidate>
  <!-- 表單 -->
  <div v-if="queryForm" class="table-responsive">
    <table class="table table-bordered">
      <tbody>
        <tr>
          <th class="bg-table align-middle text-center">分行別</th>
          <td>
            <select class="form-select" v-model="query_companycode" required>
              <option v-for="item in Branch_List" :key="item.code" :value="item.code">{{ item.name }}</option>
            </select>
          </td>
        </tr>
        <tr>
          <th class="bg-table align-middle text-center">經辦/主管</th>
          <td>
            <select class="form-select" v-model='query_ugroup'>
              <option value="A">全部</option>
              <option v-for="item in NiroleData.data" :key="item.nirole" :value='item.nirole'>{{ item.nirole }}</option>
            </select>
          </td>
        </tr>
        <tr>
          <th class="bg-table align-middle text-center">是否遮罩</th>
          <td class="text-center">
            <input type="checkbox" v-model="query_mask" class="form-check-input" :value="true" />
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 功能按鈕 -->
    <div class="d-flex justify-content-center mb-3">
      <button type="submit" class="btn btn-primary btn-lg" >送出</button>
    </div>
  </div>
</form>
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
            <th scope="col">分行別</th>
            <th scope="col">使用者代號</th>
            <th scope="col">使用者姓名</th>
            <th scope="col">HR階層</th>
            <th scope="col">角色權限</th>
            <th scope="col">授權時間</th>
            <th scope="col">授權者</th>
          </tr>
        </thead>
        <tbody class="text-nowrap">
          <tr class="align-middle" v-for="(item, Index) in ListData" :key="item.Index"
            v-show="Index < (current_page_index * page_lim) && Index >= (current_page_index - 1) * page_lim">
            <!--Index = 0-->
            <td scope="row">{{ item.Index }}</td>
            <td>{{ item.companycode }}</td>
            <td>{{ item.uid }}</td>
            <td>{{ item.uname }}</td>
            <td>{{ item.res4 }}</td>
            <td>{{ item.ugroup }}</td>
            <td>{{ item.udate }}</td>
            <td>{{ item.res3 }}</td>
          </tr>
          <tr v-if="isNoData">
            <td colspan="8">查無資料</td>
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
