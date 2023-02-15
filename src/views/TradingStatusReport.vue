<script lang="ts" setup>
import { onMounted } from 'vue';
import { useMenuStore } from '@/store/menu';
import { ref, reactive, watch , computed } from 'vue';
import { useLoginStore } from '@/store/login';
import axios from 'axios';
import { DateDiff, date_trans, time_trans, Have_Full_Width, Have_CH, date_check_year, date_check_comparator } from '@/ts/comm';
import Pagination from '@/components/PageContainer.vue';

//ini today
let today1: string;
let today2: string;
var Today = new Date();
today1 = Today.toISOString().split('T')[0];
today2 = Today.toISOString().split('T')[0];
const store = useMenuStore();
const LoginLog = ref(false);
const queryForm = ref(true);
const isQuerying = ref(false);
const query_slpasser = ref('');
const query_sludate1 = ref(today1);
const query_sludate2 = ref(today2);
const print_pdf = ref('');
const total_page = ref('0');
const current_page_index = ref(0);
const query_nibranch = ref('');
const query_tag1_res1 = ref('');
const query_pass = ref('A');
const query_sluser = ref('');
const query_tagvalue2 = ref('');
const query_slpdate = ref('');
const login = useLoginStore();
const ulevel = computed(() => (login.verifyid?.ulevel || ''));
const ListData = reactive<UserStatus>({ PostFileLog: [] });
const RQI = computed(() => (login.verifyid?.RQI || ''));
let page_lim = 10;

type UserStatus = {
  PostFileLog: {
    Index: string;
    slmainid: string;
    tagvalue1: string;
    res1: string;
    pass: string;
    nibranch: string;
    sluser: string;
    tagvalue2: string;
    sludate: string;
    slpasser: string;
    slpdate: string;
    slutime: string;
    slptime: string;
  }[]
};

type jsonres_UserStatus = {
  Basic: string;
  Message: string;
  PostFileLog?: {
    Index: string;
    slmainid: string;
    tagvalue1: string;
    res1: string;
    pass: string;
    nibranch: string;
    sluser: string;
    tagvalue2: string;
    sludate: string;
    slpasser: string;
    slpdate: string;
    slutime: string;
    slptime: string;
  }[]
};

function hideForm() {
  queryForm.value = false;
  LoginLog.value = true;
}
function hideLog() {
  LoginLog.value = false;
  queryForm.value = true;
}

async function doPost_UserStatus(params: URLSearchParams) {
  // 發送請求並回傳結果
  let res: jsonres_UserStatus;
  if (process.env.NODE_ENV == 'development') {
    const resp = await axios.get('test/UserStatus.json', {
      responseType: 'json',
    });
    res = resp.data;
  } else {
    const resp = await axios.post('/px1/nibox/pine/newmenu/CMsystem/UserStatus.aspx', params, {
      responseType: 'json',
    });
    res = resp.data;
  }

  return res;
}

async function queryUserChange() {
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
  if (DateDiff( new Date(query_sludate2.value), new Date(query_sludate1.value)) > parseInt(RQI.value)){
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
  ListData.PostFileLog = [];
  //查詢角色建立選單
  isQuerying.value = true;
  try {
    let params = new URLSearchParams();
    params.append('OPAction', 'query');
    params.append('nibranch', query_nibranch.value);
    params.append('tag1_res1', query_tag1_res1.value);
    params.append('pass', query_pass.value);
    params.append('sluser', query_sluser.value);
    params.append('tagvalue2', query_tagvalue2.value);
    params.append('sludate1', query_sludate1.value.replaceAll('-', ''));
    params.append('sludate2', query_sludate2.value.replaceAll('-', ''));
    params.append('slpasser', query_slpasser.value);
    params.append('slpdate', query_slpdate.value);

    let tempres = await doPost_UserStatus(params);
    let basic = tempres.Basic;
    let message = tempres.Message;
    if (basic != '00000000') {
      if (basic == '00000005') {
        ListData.PostFileLog = [];
        print_pdf.value = '';
        total_page.value = '0';
      }

      throw new Error(`${basic}: ${message}`);
    }

    if (tempres.PostFileLog == null) {
      throw new Error('伺服器回傳錯誤的資料格式');
    }

    let params_pdf = new URLSearchParams();
    params_pdf.append('OPAction', 'print');
    params_pdf.append('nibranch', query_nibranch.value);
    params_pdf.append('tag1_res1', query_tag1_res1.value);
    params_pdf.append('pass', query_pass.value);
    params_pdf.append('sluser', query_sluser.value);
    params_pdf.append('tagvalue2', query_tagvalue2.value);
    params_pdf.append('sludate1', query_sludate1.value.replaceAll('-', ''));
    params_pdf.append('sludate2', query_sludate2.value.replaceAll('-', ''));
    params_pdf.append('slpasser', query_slpasser.value);
    params_pdf.append('slpdate', query_slpdate.value);

    print_pdf.value = '/px1/nibox/pine/newmenu/CMsystem/UserStatus.aspx?' + params_pdf;
    ListData.PostFileLog = tempres.PostFileLog;
    current_page_index.value = 1;
    total_page.value = Math.ceil(ListData.PostFileLog.length / page_lim).toString();
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

function changePageIndex(index: number) {
  current_page_index.value = index;
}

onMounted(async () => {
  // 展開此頁面選單
  store.setMainMenuSelect('system_report');
  store.setSubMenuSelect('ni2-2');
});

watch(() => query_slpasser.value, (newValue, oldValue) => {
  if (Have_Full_Width(newValue)) {
    query_slpasser.value = oldValue;
  }
  if (Have_CH(newValue)) {
    query_slpasser.value = oldValue;
  }
});

watch(() => query_nibranch.value, (newValue, oldValue) => {
  if (Have_Full_Width(newValue)) {
    query_nibranch.value = oldValue;
  }
  if (Have_CH(newValue)) {
    query_nibranch.value = oldValue;
  }
});

watch(() => query_tag1_res1.value, (newValue, oldValue) => {
  if (Have_Full_Width(newValue)) {
    query_tag1_res1.value = oldValue;
  }
  if (Have_CH(newValue)) {
    query_tag1_res1.value = oldValue;
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
  <!-- 頁面標題 -->
  <h1 class="text-center p-3">交易狀態明細表</h1>

  <!-- 表單 -->
  <div v-if="queryForm" class="table-responsive">
    <table class="table table-bordered">
      <tbody>
        <tr>
          <th class="bg-table align-middle text-center">分行別</th>
          <td><input type="text" class="form-control" maxlength="4" v-model='query_nibranch' /></td>
        </tr>
        <tr>
          <th class="bg-table align-middle text-center">帳號/客戶ID</th>
          <td><input type="text" class="form-control" maxlength="20" v-model='query_tag1_res1' /></td>
        </tr>
        <tr>
          <th class="bg-table align-middle text-center">交易狀態</th>
          <td>
            <select class="form-select" v-model='query_pass'>
              <option value="A">全部</option>
              <option value="1">已覆核</option>
              <option value="0">未覆核</option>
              <option value="2">已刪除</option>
            </select>
          </td>
        </tr>
        <tr>
          <th class="bg-table align-middle text-center">使用者帳號</th>
          <td><input type="text" class="form-control" maxlength="20" v-model='query_sluser' /></td>
        </tr>
        <tr>
          <th class="bg-table align-middle text-center">使用者姓名</th>
          <td><input type="text" class="form-control" maxlength="60" v-model='query_tagvalue2' /></td>
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
          <th class="bg-table align-middle text-center">覆核/刪除人員</th>
          <td><input type="text" maxlength="20" class="form-control" v-model='query_slpasser' />
          </td>
        </tr>
        <tr>
          <th class="bg-table align-middle text-center">覆核/刪除日期</th>
          <td><input type="text" maxlength="14" class="form-control" v-model='query_slpdate' />
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 功能按鈕 -->
    <div class="d-flex justify-content-center mb-3">
      <button type="button" class="btn btn-primary btn-lg" @click="queryUserChange()">送出</button>
    </div>
  </div>

  <div v-if="LoginLog">
    <!-- 功能按鈕 -->
    <div class="d-flex justify-content-end m-3">
      <button class="btn btn-primary me-3" @click="PrintPDF()">
        <i class="bi bi-file-text"></i>
        列印
      </button>
      <button class="btn btn-primary" @click="hideLog()">
        <i class="bi bi-arrow-clockwise"></i>
        重新查詢
      </button>
    </div>

    <!-- 表單 -->
    <div class="table-responsive">
      <table class="table table-bordered text-center">
        <thead class="text-nowrap">
          <tr class="bg-table">
            <th scope="col">序號</th>
            <th scope="col">表單序號</th>
            <th scope="col">帳號/客戶ID</th>
            <th scope="col">交易狀態</th>
            <th scope="col">分行別</th>
            <th scope="col">使用者帳號</th>
            <th scope="col">使用者姓名</th>
            <th scope="col">操作日期</th>
            <th scope="col">覆核/刪除人員員編</th>
            <th scope="col">刪除/覆核日期</th>
          </tr>
        </thead>
        <tbody class="text-nowrap">
          <tr class="align-middle" v-for="(item, Index) in ListData.PostFileLog" :key="item.Index"
            v-show="Index < (current_page_index * page_lim) && Index >= (current_page_index - 1) * page_lim">
            <!--Index = 0-->
            <td scope="row">{{  item.Index  }}</td>
            <td>{{  item.slmainid  }}</td>
            <td>{{  item.res1  }}</td>
            <td>{{  item.pass  }}</td>
            <td>{{  item.nibranch  }}</td>
            <td>{{  item.sluser  }}</td>
            <td>{{  item.tagvalue2  }}</td>
            <td>{{  date_trans(item.sludate) + ' ' + time_trans(item.slutime)  }}</td>
            <td>{{  item.slpasser  }}</td>
            <td>{{  item.slpdate  }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- 分頁 -->
    <div class="d-flex justify-content-end">
      <Pagination :queryCount="ListData.PostFileLog?.length" :currentIndex="current_page_index" :totalPage="total_page"
        @change-page-index="changePageIndex" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.bg-table {
  background: lightgray
}
</style>
