<script lang="ts" setup>
import axios from 'axios';
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useMenuStore } from '@/store/menu';
import { useLoginStore } from '@/store/login';
import { DateDiff, Have_Full_Width, Have_CH, date_check_year, date_check_comparator, comparproperties } from '@/ts/comm';
import Pagination from '@/components/PageContainer.vue';
import { BranchList, queryBranchList } from '@/store/companyid_mapping';
import { Properties, doPost_Dbconfig_mapping } from '@/store/dbconfig_mapping';
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


const query_res3 = ref('');
const query_tag2 = ref('');
const query_properties = ref('主系統');
const query_sludate1 = ref(today1);
const query_sludate2 = ref(today2);
const query_sluser = ref('');
const query_slpasser = ref('');
const print_pdf = ref('');
const DL_excel = ref('');
const total_page = ref('0');
const current_page_index = ref(0);
const query_mask = ref(false);//是否遮罩


const ListData = ref<CreateFileStatus[]>([]);
const ListDb = ref<Properties[]>([]);
const Branch_List = ref<BranchList[]>([]);
const wasValidated = ref(false);//驗證
const isNoData = ref(false);//無資料欄位;

let page_lim = 10;
const uid = computed(() => (login.verifyid?.uid || ''));
const companycode = computed(() => (login.verifyid?.companycode || ''));

const RQI = computed(() => (login.verifyid?.RQI || ''));
query_res3.value = companycode.value;
type CreateFileStatus = {
  Index: string; //序號
  optype: string; //操作類型
  sludate: string; //操作日期
  slmainid: string; //案件號
  pass: string; //核可狀態
  sluser: string; //操作者
  slcuser: string; //操作者姓名
  slpasser: string; //核可者
  slcpasser: string; //核可者姓名
  res3: string; //分行別
  res4: string; //帳號
  slpdate: string; //核可日期
  tag2: string; //操作動作 
};

type jsonres_CreateFileStatus = {
  Code: string;
  Message: string;
  PDF: string;
  PostDataCount: string;
  PostDatas?: CreateFileStatus[]
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
  let res: jsonres_CreateFileStatus;
  if (process.env.NODE_ENV == 'development') {
    const resp = await axios.get('test/CreateFileStatus.json', {
      responseType: 'json',
    });
    res = resp.data;
  } else {
    const resp = await axios.post('/nibox/OneBank/CreateFileStatus.jsp', params, {//正式
      responseType: 'json',
    });
    res = resp.data;
  }

  return res;
}


async function query_dblist() {
  //查詢初始化
  ListDb.value = [];
  //查詢角色建立選單
  isQuerying.value = true;
  try {
    let params = new URLSearchParams();
    params.append('optype', '0');
    let tempres = await doPost_Dbconfig_mapping(params);
    let Code = tempres.error[0].Code;
    let message = tempres.error[0].Message;
    if (Code != '00000000') {
      if (Code == '00000005') {
        ListData.value = [];
        print_pdf.value = '';
        total_page.value = '0';
      }

      throw new Error(`${Code}: ${message}`);
    }

    if (tempres.data == null) {
      throw new Error('伺服器回傳錯誤的資料格式');
    }
    tempres.data.forEach(function (i) {
      if (i.nistatus != '1') {//1是主系統不顯示
        ListDb.value.push(i);
      }
      if (i.nistatus == '2') {//2為目前使用
        query_properties.value = i.name;
      }
    });
    ListDb.value.sort(comparproperties);
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


async function queryList() {
  isNoData.value = false;//無資料隱藏
  let query_mask_string = '';
  query_mask_string = (query_mask.value) ? '1' : '0';
  wasValidated.value = true;
  const form = document.forms[0];
  if (!form.checkValidity()) {
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

    //params.append('slmainid', query_slmainid.value);//帳號
    params.append('properties', ListDb.value.find((x) => (x.name == query_properties.value))?.dbconfigpath || '');//資料庫設定 由名稱反查路徑
    params.append('res3', query_res3.value);//分行別
    params.append('tag2', query_tag2.value);//操作動作
    params.append('sludate1', query_sludate1.value.replaceAll('-', ''));//異動日期(起)
    params.append('sludate2', query_sludate2.value.replaceAll('-', '')); //異動日期(迄)
    params.append('sluser', query_sluser.value);//操作者
    //params.append('pass', query_pass.value);//核可狀態
    params.append('slpasser', query_slpasser.value);//核可者
    //params.append('slpdate', query_slpdate.value);//核可日期
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
      isNoData.value = true;//無資料顯示
    }

    if (tempres.PostDatas == null) {
      throw new Error('伺服器回傳錯誤的資料格式');
    }

    let params_pdf = new URLSearchParams();
    params_pdf.append('OPAction', 'printPDF');
    params_pdf.append('mask', query_mask_string);//遮罩
    //params_pdf.append('slmainid', query_slmainid.value);//帳號
    params_pdf.append('properties', ListDb.value.find((x) => (x.name == query_properties.value))?.dbconfigpath || '');//資料庫設定 由名稱反查路徑
    params_pdf.append('res3', query_res3.value);//分行別
    params_pdf.append('tag2', query_tag2.value);//操作動作
    params_pdf.append('sludate1', query_sludate1.value.replaceAll('-', ''));//異動日期(起)
    params_pdf.append('sludate2', query_sludate2.value.replaceAll('-', '')); //異動日期(迄)
    params_pdf.append('sluser', query_sluser.value);//操作者
    //params_pdf.append('pass', query_pass.value);//核可狀態
    params_pdf.append('slpasser', query_slpasser.value);//核可者
    //params_pdf.append('slpdate', query_slpdate.value);//核可日期
    params_pdf.append('userID_check', uid.value);//登入者ID

    print_pdf.value = '/nibox/OneBank/CreateFileStatus.jsp?' + params_pdf;

    let params_excel = new URLSearchParams();
    params_excel.append('OPAction', 'printEXCEL');
    params_excel.append('mask', query_mask_string);//遮罩
    //params_excel.append('slmainid', query_slmainid.value);//帳號
    params_excel.append('properties', ListDb.value.find((x) => (x.name == query_properties.value))?.dbconfigpath || '');//資料庫設定 由名稱反查路徑
    params_excel.append('res3', query_res3.value);//分行別
    params_excel.append('tag2', query_tag2.value);//操作動作
    params_excel.append('sludate1', query_sludate1.value.replaceAll('-', ''));//異動日期(起)
    params_excel.append('sludate2', query_sludate2.value.replaceAll('-', '')); //異動日期(迄)
    params_excel.append('sluser', query_sluser.value);//操作者
    //params_excel.append('pass', query_pass.value);//核可狀態
    params_excel.append('slpasser', query_slpasser.value);//核可者
    //params_excel.append('slpdate', query_slpdate.value);//核可日期
    params_excel.append('userID_check', uid.value);//登入者ID

    DL_excel.value = '/nibox/OneBank/CreateFileStatus.jsp?' + params_excel;

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

  //查詢資料庫清單

  await query_dblist();
  //查詢分行別清單
  isQuerying.value = true;
  Branch_List.value = await queryBranchList() || Branch_List.value;
  isQuerying.value = false;
  // 展開此頁面選單
  store.setMainMenuSelect('system_report');
  store.setSubMenuSelect('ni3-1');
});

watch(() => query_slpasser.value, (newValue, oldValue) => {
  if (Have_Full_Width(newValue)) {
    query_slpasser.value = oldValue;
  }
  if (Have_CH(newValue)) {
    query_slpasser.value = oldValue;
  }
});

</script>

<template>
  <!--loading-->
  <LoadingScreen message='處理中，請稍候...' :visible='isQuerying' />

  <!-- 頁面標題 -->
  <h1 class="text-center p-3">文件建檔狀態明細表</h1>

  <!-- 表單 -->
  <form @submit.prevent="queryList()" :class="{ 'was-validated': wasValidated }" class="table-responsive" novalidate>
    <div v-show="queryForm" class="table-responsive">
      <table class="table table-bordered">
        <tbody>
          <!--<tr>
          <th class="bg-table align-middle text-center">帳號</th>
          <td><input type="text" class="form-control" maxlength="20" v-model='query_slmainid' />
          </td>
        </tr>-->
          <tr>
            <th class="bg-table align-middle text-center">分行別</th>
            <td>
              <select class="form-select" v-model='query_res3' required>
                <option v-for="item in Branch_List" :key="item.code" :value="item.code">{{ item.name }}</option>
              </select>
            </td>
          </tr>
          <tr>
            <th class="bg-table align-middle text-center">操作類型</th>
            <td>
              <select class="form-select" v-model='query_tag2'>
                <option value="">全部</option>
                <option value="AddNewImage">新增文件</option>
                <option value="CustomerDataAndRemark">變更基本資料</option>
                <option value="ChangeImageState">刪除文件</option>
              </select>
            </td>
          </tr>
          <tr>
            <th class="bg-table align-middle text-center">異動日期(西元年)</th>
            <td>
              <div class="input-group mb-3">
                <input type="date" max="9999-12-31" class="form-control" v-model='query_sludate1' required />
                <span class="input-group-text">-</span>
                <input type="date" max="9999-12-31" class="form-control" v-model='query_sludate2' required />
              </div>
            </td>
          </tr>
          <tr>
            <th class="bg-table align-middle text-center">操作者</th>
            <td><input type="text" class="form-control" maxlength="20" v-model='query_sluser' />
            </td>
          </tr>

          <tr>
            <th class="bg-table align-middle text-center">核可者</th>
            <td><input type="text" class="form-control text-center" maxlength="20" v-model='query_slpasser' />
            </td>
          </tr>
          <!--<tr>
          <th class="bg-table align-middle text-center">核可日期</th>
          <td>
            <div class="input-group mb-3">
              <input type="date" max="9999-12-31" class="form-control" v-model='query_slpdate' />
            </div>
          </td>
        </tr>-->
          <tr>
            <th class="bg-table align-middle text-center">日期區域類別</th>
            <td>
              <select class="form-select" v-model='query_properties'>
                <option v-for="item in ListDb" :value="item.name" :key="item.code">{{ item.name }}</option>
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
        <button type="submit" class="btn btn-primary btn-lg">送出</button>
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
            <th scope="col">案件號</th>
            <th scope="col">帳號</th>
            <th scope="col">操作動作</th>
            <th scope="col">核可狀態</th>
            <th scope="col">操作者</th>
            <th scope="col">操作姓名</th>
            <th scope="col">操作日期</th>
            <th scope="col">核可者</th>
            <th scope="col">核可者姓名</th>
            <th scope="col">核可日期</th>
          </tr>
        </thead>
        <tbody class="text-nowrap">
          <tr class="align-middle" v-for="(item, Index) in ListData" :key="item.Index"
            v-show="Index < (current_page_index * page_lim) && Index >= (current_page_index - 1) * page_lim">
            <!--Index = 0-->
            <td scope="row">{{ item.Index }}</td>
            <td>{{ item.slmainid }}</td>
            <td>{{ item.res4 }}</td>
            <td>{{ item.tag2 }}</td>
            <td>{{ item.pass }}</td>
            <td>{{ item.sluser }}</td>
            <td>{{ item.slcuser }}</td>
            <td>{{ item.sludate }}</td>
            <td>{{ item.slpasser }}</td>
            <td>{{ item.slcpasser }}</td>
            <td>{{ item.slpdate }}</td>
          </tr>
          <tr v-if="isNoData">
            <td colspan="11">查無資料</td>
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
