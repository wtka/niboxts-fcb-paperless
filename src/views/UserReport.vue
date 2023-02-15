<script lang="ts" setup>
import axios from 'axios';
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useMenuStore } from '@/store/menu';
import { useLoginStore } from '@/store/login';
import { DateDiff, date_time_trans_replaceZ, Have_Full_Width, Have_CH, date_check_year, date_check_comparator } from '@/ts/comm';
import Pagination from '@/components/PageContainer.vue';
import LoadingScreen from '@/components/LoadingScreen.vue';
import { BranchList, queryBranchList } from '@/store/companyid_mapping';

let today1: string;
let today2: string;
var Today = new Date();
today1 = Today.toISOString().split('T')[0];
today2 = Today.toISOString().split('T')[0];
const store = useMenuStore();
const queryFinish = ref(false);
const queryForm = ref(true);
const isQuerying = ref(false);


const query_slpasser = ref('');
const query_sluser = ref('');
const query_res3 = ref('');
const query_optype = ref('A');
const query_sludate1 = ref(today1);
const query_sludate2 = ref(today2);
const print_pdf = ref('');
const DL_excel = ref('');
const total_page = ref('0');
const current_page_index = ref(0);
const query_mask = ref(false);//是否遮罩


const ListLength = ref(0);
const login = useLoginStore();
const companycode = computed(() => (login.verifyid?.companycode || ''));
const HeadOffice = computed(() => (login.verifyid?.HeadOffice || ''));
query_res3.value = companycode.value;
const RQI = computed(() => (login.verifyid?.RQI || ''));
const Branch_List = ref<BranchList[]>([]);
const isNoData = ref(false);//無資料欄位;
const wasValidated = ref(false);//驗證
let page_lim = 10;

type UserPermissionChange = {
  Index: string;//序號	
  res3: string;//分行別
  slpasser: string;//使用者代號
  res2: string;//使用者姓名    
  optype: string;//操作類型
  res6: string;//異動內容
  sludate: string;//異動日期
  sluser: string;//授權者代號
  res7: string;//授權者姓名
};

type Nirole_data = {
  nirole: string;
  niroletype: string;
  nigroup: string;
  hiddenflag: string;
};

const ListData = ref<UserPermissionChange[]>([]);

type jsonres_UserPermissionChange = {
  Code: string;
  Message: string;
  PostDataCount: string;
  PostDatas: UserPermissionChange[]
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

async function doPost_UserPermissionChange(params: URLSearchParams) {
  // 發送請求並回傳結果
  let res: jsonres_UserPermissionChange;
  if (process.env.NODE_ENV == 'development') {
    const resp = await axios.get('test/UserPermissionChange.json', {
      responseType: 'json',
    });
    res = resp.data;
  } else {
    const resp = await axios.post('nibox/OneBank/UserPermissionChange.jsp', params, {
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
  //檢核
  wasValidated.value = true;
  const form = document.forms[0];
  if (!form.checkValidity()) {
    return;
  }

  isQuerying.value = true;
  try {
    let params = new URLSearchParams();
    params.append('OPAction', 'query');
    params.append('mask', query_mask_string);//遮罩
    params.append('slpasser', query_slpasser.value);//使用者代號
    params.append('res3', query_res3.value);//分行別
    params.append('optype', query_optype.value);//操作類型
    params.append('sludate1', query_sludate1.value.replaceAll('-', ''));//操作日期(起)
    params.append('sludate2', query_sludate2.value.replaceAll('-', '')); //操作日期(迄)
    params.append('sluser', query_sluser.value);//操作者代號

    let tempres = await doPost_UserPermissionChange(params);
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
    params_pdf.append('slpasser', query_slpasser.value);//使用者代號
    params_pdf.append('res3', query_res3.value);//分行別

    params_pdf.append('optype', query_optype.value);//操作類型
    params_pdf.append('sludate1', query_sludate1.value.replaceAll('-', ''));//操作日期(起)
    params_pdf.append('sludate2', query_sludate2.value.replaceAll('-', '')); //操作日期(迄)
    params_pdf.append('sluser', query_sluser.value);//操作者代號

    print_pdf.value = 'nibox/OneBank/UserPermissionChange.jsp?' + params_pdf;

    let params_excel = new URLSearchParams();
    params_excel.append('OPAction', 'printEXCEL');
    params_excel.append('mask', query_mask_string);//遮罩
    params_excel.append('slpasser', query_slpasser.value);//使用者代號
    params_excel.append('res3', query_res3.value);//分行別

    params_excel.append('optype', query_optype.value);//操作類型
    params_excel.append('sludate1', query_sludate1.value.replaceAll('-', ''));//操作日期(起)
    params_excel.append('sludate2', query_sludate2.value.replaceAll('-', '')); //操作日期(迄)
    params_excel.append('sluser', query_sluser.value);//操作者代號

    DL_excel.value = 'nibox/OneBank/UserPermissionChange.jsp?' + params_excel;

    ListData.value = tempres.PostDatas;
    ListLength.value = parseInt(tempres.PostDataCount);
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
  // 展開此頁面選單
  store.setMainMenuSelect('user_setting');
  store.setSubMenuSelect('ni2-7');
  //查詢分行別清單
  isQuerying.value = true;
  Branch_List.value = await queryBranchList() || Branch_List.value;
  isQuerying.value = false;
});

watch(() => query_slpasser.value, (newValue, oldValue) => {
  if (Have_Full_Width(newValue)) {
    query_slpasser.value = oldValue;
  }
  if (Have_CH(newValue)) {
    query_slpasser.value = oldValue;
  }
});

watch(() => query_sluser.value, (newValue, oldValue) => {
  if (Have_Full_Width(newValue)) {
    query_sluser.value = oldValue;
  }
  if (Have_CH(newValue)) {
    query_sluser.value = oldValue;
  }
});
</script>

<template>
  <!--loading-->
  <LoadingScreen message="處理中，請稍候..." :visible="isQuerying" />

  <!-- 頁面標題 -->
  <h1 class="text-center p-3">人員權限異動明細表</h1>

  <!-- 表單 -->
  <form @submit.prevent="queryList" id="addForm" :class="{ 'was-validated': wasValidated }" class="table-responsive"
    novalidate>
    <div v-if="queryForm" class="table-responsive">
      <table class="table table-bordered">
        <tbody>
          <tr>
            <th class="bg-table align-middle text-center">使用者代號</th>
            <td><input type="text" class="form-control" maxlength="20" placeholder="使用者代號" v-model='query_slpasser' />
            </td>
          </tr>
          <tr>
            <th class="bg-table align-middle text-center">分行別</th>
            <td>
              <select class="form-select" v-model="query_res3" required>
                <option v-for="item in Branch_List" :key="item.code" :value="item.code">{{ item.name }}</option>
              </select>
            </td>
          </tr>
          <tr>
            <th class="bg-table align-middle text-center">操作類型</th>
            <td>
              <select class="form-select" v-model='query_optype'>
                <option value="A">全部</option>
                <option value="UserOPBindS">新增</option>
                <option value="UserOPChgDetialS">修改</option>
                <option value="UserOPRevokeS">註銷</option>
              </select>
            </td>
          </tr>
          <tr>
            <th class="bg-table align-middle text-center">操作日期(西元年)</th>
            <td>
              <div class="input-group mb-3">
                <input type="date" max="9999-12-31" class="form-control" v-model='query_sludate1' required/>
                <span class="input-group-text">-</span>
                <input type="date" max="9999-12-31" class="form-control" v-model='query_sludate2' required/>
              </div>
            </td>
          </tr>
          <tr>
            <th class="bg-table align-middle text-center">授權者代號</th>
            <td><input type="text" maxlength="20" class="form-control" v-model='query_sluser' />
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
        <button type="submit" class="btn btn-primary btn-lg">送出</button>
      </div>
    </div>
  </form>
  <!-- 查詢結果 -->
  <div v-show="queryFinish">
    <!-- 功能按鈕 -->
    <div class="d-flex justify-content-end m-3">
      <button class="btn btn-primary me-3" @click="PrintPDF()">
        <i class="bi bi-file-text"></i>
        列印
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
            <th scope="col">操作類型</th>
            <th scope="col">操作資料</th>
            <th scope="col">操作日期</th>
            <th scope="col">授權者代號</th>
            <th scope="col">授權者姓名</th>
          </tr>
        </thead>
        <tbody class="text-nowrap">
          <tr class="align-middle" v-for="(item, Index) in ListData" :key="item.Index"
            v-show="Index < (current_page_index * page_lim) && Index >= (current_page_index - 1) * page_lim">
            <!--Index = 0-->
            <td scope="row">{{ item.Index }}</td>
            <td>{{ item.res3 }}</td>
            <td>{{ item.slpasser }}</td>
            <td>{{ item.res2 }}</td>
            <td>{{ item.optype }}</td>
            <td>{{ item.res6 }}</td>
            <td>{{ date_time_trans_replaceZ(item.sludate) }}</td>
            <td>{{ item.sluser }}</td>
            <td>{{ item.res7 }}</td>
          </tr>
          <tr v-if="isNoData">
            <td colspan="9">查無資料</td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- 分頁 -->
    <div class="d-flex justify-content-end">
      <Pagination :queryCount="ListLength" :currentIndex="current_page_index" :totalPage="total_page"
        @change-page-index="changePageIndex" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.bg-table {
  background: lightgray
}
</style>
