<script setup lang="ts">
import axios from 'axios';
import { ref, onMounted, computed } from 'vue';
import { defineStore } from 'pinia';
import { useMenuStore } from '@/store/menu';
import { useLoginStore } from '@/store/login';
import LoadingScreen from '@/components/LoadingScreen.vue';
import { Modal } from 'bootstrap';
import { BranchList, doPost_companyid_mapping } from '@/store/companyid_mapping';



const store = useMenuStore();
const login = useLoginStore();
const presetcontent = computed(() => (login.verifyid?.presetcontent || ''));
const isQuerying = ref(false);
const wasValidated = ref(false);//修改驗證
const HeadOffice = ref('');
const HeadOffice_array = ref<string[]>([]);
const oldHeadOffice = ref('');
const InformationOffice = ref('');
const InformationOffice_array = ref<string[]>([]);
const oldInformationOffice = ref('');
const modModal = ref();
const modtitle = ref('');
const modtitle_ch = ref('');
const modBranch = ref<string>('');
const modBranch_del = ref('');
const Branc_hList = ref<BranchList[]>([]);
const modBranchList = ref<string[]>([]);
const modBranchList_string = ref<string>('');
const uid = computed(() => (login.verifyid?.uid || ''));

type jsonres_c_sysconfig_webapi = {
  error: {
    Code: string;
    Message: string;
    Count?: string;
  }[];
  data: {
    nitype: string;
    nitypename: string;
    nitypevalue: string;
  }[];
}

type jsonres_c_sysconfig_webapi_modify = {
  sysconfig: {
    nitypename: string;
    Code: string;
    Message: string;
  }[];
}



async function queryBranchList() {
  //查詢初始化
  Branc_hList.value.length = 0;
  //查詢
  isQuerying.value = true;
  try {
    let params = new URLSearchParams();
    params.append('optype', '1');

    let tempres = await doPost_companyid_mapping(params);
    let basic = tempres.error[0].Code;
    let message = tempres.error[0].Message;
    if (basic != '00000000') {
      throw new Error(`${basic}: ${message}`);
    }
    if (tempres.data == null) {
      throw new Error('伺服器回傳錯誤的資料格式');
    }
    Branc_hList.value = tempres.data;
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

async function doPost_c_sysconfig_webapi(params: URLSearchParams) {
  // 發送請求並回傳結果
  let res: jsonres_c_sysconfig_webapi;
  if (process.env.NODE_ENV == 'development') {
    const resp = await axios.get('test/c-sysconfig-webapi.json', {
      responseType: 'json',
    });
    res = resp.data;
  } else {
    const resp = await axios.post('/nibox/c-sysconfig-webapi.jsp', params, {
      responseType: 'json',
    });
    res = resp.data;
  }

  return res;
}

async function doPost_c_sysconfig_webapi_modify(params: URLSearchParams) {
  // 發送請求並回傳結果
  let res: jsonres_c_sysconfig_webapi_modify;
  if (process.env.NODE_ENV == 'development') {
    const resp = await axios.get('test/c-sysconfig-webapi_modify.json', {
      responseType: 'json',
    });
    res = resp.data;
  } else {
    const resp = await axios.post('/nibox/c-sysconfig-webapi.jsp', params, {
      responseType: 'json',
    });
    res = resp.data;
  }

  return res;
}

type DataState = {
  row: {
    id: string;
    title: string;
    value: string;
    oldvalue?: string;
    visible: string;
    inputType: string; //text password...etc
    dataRange?: Array<unknown>; //select range
    dataTypeTitle?: string;
    oldData?: string;
  }[];
  mode: boolean;
};

const useDataStore = defineStore('row', {
  state: (): DataState => ({
    row: [],
    mode: false,
  }),
});

const datas = useDataStore();

datas.row = [];
datas.row.push({ id: 'SSOPd', value: '', title: '預設密碼', visible: '1a', inputType: 'text', oldData: '' });
datas.row.push({ id: 'idmask', value: '', title: 'ID遮罩(碼數)', visible: '1b', inputType: 'select', dataRange: [-1, 1, 2, 3, 4, 5, 6], oldData: '' });
datas.row.push({ id: 'namemask', value: '', title: '姓名遮罩(碼數)', visible: '1c', inputType: 'select', dataRange: [0, 1, 2], oldData: '' });
datas.row.push({ id: 'refrence', value: '', title: '是否開放參照帳號(1:開放 0:不開放)', visible: '1d', inputType: 'select', dataRange: [0, 1], oldData: '' });
datas.row.push({ id: 'OCRF', value: '', title: '是否開放OCR掃描(1:開放 0:不開放)', visible: '1e', inputType: 'select', dataRange: [0, 1], oldData: '' });
datas.row.push({ id: 'ISF', value: '', title: ' 是否開放聯行變更(1:開放 0:不開放) ', visible: '1f', inputType: 'select', dataRange: [0, 1], oldData: '' });
datas.row.push({ id: 'SSOF', value: '', title: '單一簽入驗證模式(0:無 2:AD)', visible: '3g', inputType: 'select', dataRange: [0, 2], oldData: '' });
datas.row.push({ id: 'queryAD_UserID', value: '', title: '查詢AD使用者ID', visible: '1h', inputType: 'text', oldData: '' });
datas.row.push({ id: 'queryAD_UserPass', value: '', title: '查詢AD使用者密碼', visible: '1i', inputType: 'password', oldData: '' });
datas.row.push({ id: 'FWD', value: '', title: '浮水印字樣', visible: '1j', inputType: 'text', oldData: '' });
datas.row.push({ id: 'CPB', value: '', title: '是否顯示變更密碼', visible: '1k', inputType: 'select', dataRange: [0, 1], oldData: '' });
datas.row.push({ id: 'CHT', value: '', title: '免拍人像是否印鑑一起核(1:是 0:不是)', visible: '1l', inputType: 'select', dataRange: [0, 1], oldData: '' });
datas.row.push({ id: 'CCT', value: '', title: '建檔是否不需核可類別(SS:印鑑 SD:文件 SC:身分證 SH:人像 )', visible: '1m', inputType: 'checkbox', oldData: '', dataTypeTitle: 'CT' });
datas.row.push({ id: 'UCT', value: '', title: ' 變更及刪除是否不需核可類別(SS:印鑑 SD:文件 SC:身分證 SH:人像 )', visible: '1n', inputType: 'checkbox', oldData: '', dataTypeTitle: 'UT' });
datas.row.push({ id: 'USERAPPF', value: '', title: '使用者建立是否需要審核(0:不審核 1:要審核)', visible: '1p', inputType: 'select', dataRange: [0, 1], oldData: '' });
datas.row.push({ id: 'SEALKEYF', value: '', title: '印鑑帳號輸入模式(0:帳號 1:客戶號)', visible: '1q', inputType: 'select', dataRange: [0, 1], oldData: '' });
datas.row.push({ id: 'SNF', value: '', title: '印鑑帳號是否使用流水號功能(1:是 0:不是)', visible: '1r', inputType: 'select', dataRange: [0, 1], oldData: '' });
datas.row.push({ id: 'WSEALC', value: '', title: '是否儲存印鑑卡(1:是 0:不是)', visible: '1s', inputType: 'select', dataRange: [0, 1], oldData: '' });
datas.row.push({ id: 'BrID', value: '', title: '預設公司代碼', visible: '1t', inputType: 'text', oldData: '' });
datas.row.push({ id: 'BRBRID', value: '', title: '全行報表單位代號', visible: '1u', inputType: 'text', oldData: '' });
datas.row.push({ id: 'LaSLoss', value: '', title: '是否開放聯行掛失(1:是 0:不是)', visible: '1v', inputType: 'text', oldData: '' });
datas.row.push({ id: 'BGHKM', value: '', title: '不檢核帳號科目', visible: '1w', inputType: 'text', oldData: '' });
datas.row.push({ id: 'versionflag', value: '', title: '版本開關(1:檢查 0:不檢查)', visible: '1x', inputType: 'select', dataRange: [0, 1], oldData: '' });
datas.row.push({ id: 'ubankentryversion', value: '', title: '版本號', visible: '1x', inputType: 'text', oldData: '' });
datas.row.push({ id: 'SOSUB', value: '', title: '舊支存科目', visible: '1y', inputType: 'text', oldData: '' });
datas.row.push({ id: 'SNSUB', value: '', title: '新支存科目', visible: '1z', inputType: 'text', oldData: '' });
datas.row.push({ id: 'FCSUB', value: '', title: '外幣科目', visible: '2a', inputType: 'text', oldData: '' });
datas.row.push({ id: 'trustcode', value: '', title: '信託代號', visible: '2b', inputType: 'text', oldData: '' });
datas.row.push({ id: 'CMS', value: '', title: '是否舊格式轉新格式(0:否 1:是)', visible: '2c', inputType: 'select', dataRange: [0, 1], oldData: '' });
datas.row.push({ id: 'OCB', value: '', title: '作業中心分行別', visible: '2d', inputType: 'text', oldData: '' });
datas.row.push({ id: 'mergebranch', value: '', title: '裁併行', visible: '2e', inputType: 'text', oldData: '' });
datas.row.push({ id: 'all_debug', value: '', title: 'Debug程式設定(設jsp檔名或檔名關鍵字 _ 隔開, * 全開)', visible: '2f', inputType: 'text' });
datas.row.push({ id: 'Shootingtype', value: '', title: '拍攝類型(0:彩色 1:灰階 2:黑白)', visible: '2h', inputType: 'select', dataRange: [0, 1, 2], oldData: '' });
datas.row.push({ id: 'maxadvsec', value: '', title: '廣告圖檔輪播秒數', visible: '2x', inputType: 'text', oldData: '' });
datas.row.push({ id: 'maxadvcon', value: '', title: '廣告派版最大連線數', visible: '2w', inputType: 'text', oldData: '' });
//datas.row.push({ id: 'HeadOffice', value: '', title: '總行單位', visible: '3b', inputType: 'text', oldData: '' });
//datas.row.push({ id: 'InformationOffice', value: '', title: '資訊處單位', visible: '3f', inputType: 'text', oldData: '' });
datas.row.push({ id: 'RQI', value: '', title: '報表查詢區間(日)', visible: '3g', inputType: 'num', oldData: '' });
datas.row.push({ id: 'RIRD', value: '', title: '報表資訊保留天數(日)', visible: '3h', inputType: 'num', oldData: '' });
datas.row.push({ id: 'setUserIdleTime', value: '', title: '使用者閒置時間(分鐘)', visible: '2y', inputType: 'num', oldData: '' });
datas.row.push({ id: 'doorSill', value: '', title: '單一遷入(同時間只能從一台電腦登入)', visible: '3j', inputType: 'select', dataRange: [0, 1], oldData: '' });

async function query_config_setting() {
  isQuerying.value = true;
  try {
    let params = new URLSearchParams();
    params.append('optype', '0');

    let tempres = await doPost_c_sysconfig_webapi(params);
    let basic = tempres.error[0].Code;
    let message = tempres.error[0].Message;
    if (basic != '00000000') {
      throw new Error(`${basic}: ${message}`);
    }

    if (tempres.data == null) {
      throw new Error('伺服器回傳錯誤的資料格式');
    }

    setting_data(tempres);
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

function setting_data(tempdata: jsonres_c_sysconfig_webapi) {
  HeadOffice_array.value = [];
  InformationOffice_array.value = [];

  for (let i = 0; i < tempdata.data.length; i++) {
    let temp_setting = datas.row.find((x) => (x.id == tempdata.data[i].nitypename));
    if (temp_setting?.value != null) {
      temp_setting.value = tempdata.data[i].nitypevalue;
    }
    if (temp_setting?.oldData != null) {
      temp_setting.oldData = tempdata.data[i].nitypevalue;
    }
    if (tempdata.data[i].nitypename == 'HeadOffice') {
      for (let j = 0; j < tempdata.data[i].nitypevalue.split('_').length; j++) {
        HeadOffice_array.value.push(tempdata.data[i].nitypevalue.split('_')[j]);
        console.log('HO' + tempdata.data[i].nitypevalue.split('_')[j]);
      }
      oldHeadOffice.value = tempdata.data[i].nitypevalue;
    }
    if (tempdata.data[i].nitypename == 'InformationOffice') {
      for (let j = 0; j < tempdata.data[i].nitypevalue.split('_').length; j++) {
        InformationOffice_array.value.push(tempdata.data[i].nitypevalue.split('_')[j]);
        console.log('IO' + tempdata.data[i].nitypevalue.split('_')[j]);
      }
      oldInformationOffice.value = tempdata.data[i].nitypevalue;
    }
  }
}

async function post_config_setting() {
  wasValidated.value = true;
  //array=>字串

  //全修改版本
  /*
  HeadOffice.value = '';
  for (let i = 0; i < HeadOffice_array.value.length; i++) {
    if (i != 0) {
      HeadOffice.value += '_';
    }
    HeadOffice.value += HeadOffice_array.value[i];
  }

  InformationOffice.value = '';
  for (let i = 0; i < InformationOffice_array.value.length; i++) {
    if (i != 0) {
      InformationOffice.value += '_';
    }
    InformationOffice.value += InformationOffice_array.value[i];
  }
  */
  const form = document.forms[0];
  if (!form.checkValidity()) {
    return;
  }
  isQuerying.value = true;
  try {
    let params = new URLSearchParams();
    params.append('optype', '2');
    params.append('userName', uid.value);
    //全修改版本
    /*
    params.append('HeadOffice', HeadOffice.value);
    params.append('oldHeadOffice', oldHeadOffice.value);
    params.append('InformationOffice', InformationOffice.value);
    params.append('oldInformationOffice', oldInformationOffice.value);
    */
    for (let i = 0; i < datas.row.length; i++) {
      let row = datas.row[i];
      if (presetcontent.value.indexOf(row.visible) != -1) {
        params.append(row.id, row.value);
        if (row.oldData != undefined) {
          params.append('old' + row.id, row.oldData);
        }
      }
    }

    let tempres = await doPost_c_sysconfig_webapi_modify(params);
    //alert(tempres.sysconfig.length);
    let sucess_count = 0;
    for (let i = 0; i < tempres.sysconfig.length; i++) {
      let code = tempres.sysconfig[i].Code;
      let message = tempres.sysconfig[i].Message;

      if (code != '00000000') {
        alert(`${code}: ${message}`);
      } else {
        sucess_count += 1;
      }
    }

    if (sucess_count == tempres.sysconfig.length) {
      alert('成功');
    }

    await query_config_setting();
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

async function post_branch_setting(branch_type: string) {

  //array=>字串
  modBranchList_string.value = '';
  for (let i = 0; i < modBranchList.value.length; i++) {
    if (i != 0) {
      modBranchList_string.value += '_';
    }
    modBranchList_string.value += modBranchList.value[i];
  }
  wasValidated.value = true;
  const form = document.forms[0];
  if (!form.checkValidity()) {
    return;
  }
  isQuerying.value = true;
  try {
    let params = new URLSearchParams();
    params.append('optype', '2');
    params.append('userName', uid.value);
    if (branch_type == 'HeadOffice') {
      params.append('HeadOffice', modBranchList_string.value);
      params.append('oldHeadOffice', oldHeadOffice.value);
    }

    if (branch_type == 'InformationOffice') {
      params.append('InformationOffice', modBranchList_string.value);
      params.append('oldInformationOffice', oldInformationOffice.value);
    }

    let tempres = await doPost_c_sysconfig_webapi_modify(params);
    let sucess_count = 0;
    for (let i = 0; i < tempres.sysconfig.length; i++) {
      let code = tempres.sysconfig[i].Code;
      let message = tempres.sysconfig[i].Message;

      if (code != '00000000') {
        alert(`${code}: ${message}`);
      } else {
        sucess_count += 1;
      }
    }

    if (sucess_count == tempres.sysconfig.length) {
      alert('成功');
    }

    await query_config_setting();
  } catch (error) {
    let message = error;
    if (error instanceof Error) {
      message = error.message;
    }
    alert(`${message}`);
  } finally {
    hidemodList();
    isQuerying.value = false;

  }
}

function branch_mapping(branchCode: string) {
  return Branc_hList.value.find((x) => (x.code == branchCode))?.name || '';
}

function showmodList(tempmodtitle: string, temp_mod_array: string[]) {
  if (tempmodtitle == 'HeadOffice') {
    modtitle_ch.value = '總行單位';
  }
  if (tempmodtitle == 'InformationOffice') {
    modtitle_ch.value = '資訊處單位';
  }
  modBranchList.value = JSON.parse(JSON.stringify(temp_mod_array));
  //modBranchList.value = temp_mod_array;//全修改版本
  modtitle.value = modtitle_ch.value;
  modModal.value.show();
}

function hidemodList() {
  modModal.value.hide();
  wasValidated.value = false;
}

function doModBranchList() {
  if (modBranch.value.length == 0) {
    alert('必須選擇一個分行');
    return;
  }
  if (modBranchList.value.indexOf(modBranch.value) != -1) {
    alert('已存在該筆資料');
    return;
  }
  modBranchList.value.push(modBranch.value);
  modBranch.value = '';
}

function doModBranchList_del() {
  if (modBranch_del.value.length == 0) {
    alert('必須選擇一個分行');
    return;
  }
  if (modBranchList.value.indexOf(modBranch_del.value) != -1) {


    modBranchList.value.splice(modBranchList.value.indexOf(modBranch_del.value), 1);
  }
  else {
    alert('不存在該筆資料');
  }
}

// 初始化 Modal
function initModal() {
  const staticBackdropMod = document.getElementById('staticBackdropMod');
  if (staticBackdropMod != null) {
    modModal.value = new Modal(staticBackdropMod);
  }
}

onMounted(async () => {
  // 初始化 Modal
  initModal();
  // 展開此頁面選單
  await query_config_setting();
  isQuerying.value = true;
  await queryBranchList();
  isQuerying.value = false;
  store.setMainMenuSelect('system_setting');
  store.setSubMenuSelect('ni4-5');
});
</script>

<template>
  <!-- 處理中請稍候 -->
  <LoadingScreen message='處理中，請稍候...' :visible='isQuerying' />

  <!-- 頁面標題 -->
  <h1 class="text-center p-3">前置作業設定</h1>

  <!-- 表單 -->
  <form @submit.prevent="post_config_setting" id="addForm" :class="{ 'was-validated': wasValidated }"
    class="table-responsive" novalidate>
    <div class="table-responsive d-flex justify-content-center">
      <table class="table table-bordered" style="width: 80%;">
        <tbody>
          <tr v-for="(rows, i) in datas.row" :key="i" v-show="presetcontent.indexOf(rows.visible) != -1">
            <th v-if="presetcontent.indexOf(rows.visible) != -1" class="align-middle" style="background: lightgray">{{
    rows.title
}}</th>
            <td v-if="presetcontent.indexOf(rows.visible) != -1" class="p-3">
              <input class="form-control" type="text" :name="rows.id" v-if="rows.inputType == 'text'"
                v-model="rows.value" required />
              <input class="form-control" type="num" :name="rows.id" v-if="rows.inputType == 'num'" v-model="rows.value"
                required />
              <input class="form-control" type="password" :name="rows.id" v-if="rows.inputType == 'password'"
                v-model="rows.value" required />
              <select class="form-select" :name="rows.id" v-if="rows.inputType == 'select'" v-model="rows.value"
                required>
                <option v-for="(j, index) in rows.dataRange" :key="index" :value="j">{{ j }}</option>
              </select>
              <div class="text-nowrap" v-if="rows.inputType == 'checkbox'">
                <input type="radio" class="form-check-input mt-0 mx-2" :name="rows.id"
                  :value="rows.dataTypeTitle + 'SS'" v-model="rows.value" />印鑑
                <input type="radio" class="form-check-input mt-0 mx-2" :name="rows.id"
                  :value="rows.dataTypeTitle + 'SD'" v-model="rows.value" />文件
                <input type="radio" class="form-check-input mt-0 mx-2" :name="rows.id"
                  :value="rows.dataTypeTitle + 'SC'" v-model="rows.value" />身分證
                <input type="radio" class="form-check-input mt-0 mx-2" :name="rows.id"
                  :value="rows.dataTypeTitle + 'SH'" v-model="rows.value" />人像
              </div>
              <input type="text" class="form-control d-none" :name="'old' + rows.id" v-if="rows.oldData != undefined"
                v-model="rows.oldData" />
            </td>
          </tr>
          <tr>
            <th class="align-middle" style="background: lightgray">總行單位(列表)</th>
            <td class="p-3">
              <select class="form-select" name="HeadOffice" style="width: fit-content;display: inline;">
                <option v-for="item in HeadOffice_array" :key="item" :value="item">{{ branch_mapping(item) }}</option>
              </select><button type="button" class="btn btn-primary btn-lg me-5"
                @click="showmodList('HeadOffice', HeadOffice_array)">修改</button>
              <input type="text" class="form-control d-none" name="oldHeadOffice" v-model="oldHeadOffice" />
            </td>
          </tr>
          <tr>
            <th class="align-middle" style="background: lightgray">資訊處單位(列表)</th>
            <td class="p-3">
              <select class="form-select" name="InformationOffice" style="width: fit-content;display: inline;">
                <option v-for="item in InformationOffice_array" :key="item" :value="item">{{ branch_mapping(item) }}
                </option>
              </select><button type="button" class="btn btn-primary btn-lg me-5"
                @click="showmodList('InformationOffice', InformationOffice_array)">修改</button>
              <input type="text" class="form-control d-none" name="oldInformationOffice"
                v-model="oldInformationOffice" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 功能按鈕 -->
    <div class="d-flex justify-content-center mb-3">
      <button type="button" class="btn btn-secondary btn-lg me-5" @click="query_config_setting">重設</button>
      <button type="submit" class="btn btn-primary btn-lg">送出</button>
    </div>
  </form>


  <div class="modal fade" id="staticBackdropMod" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
    aria-labelledby="staticBackdropModLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="staticBackdropModLabel">修改{{ modtitle_ch }}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="table-responsive">
            <table class="table table-bordered">
              <tbody>
                <tr>
                  <th class="bg-table align-middle text-center">單位列表</th>
                  <td>
                    <select class="form-control" style="width: fit-content;display: inline;" placeholder="代建行"
                      v-model='modBranch'>
                      <option v-for="item in Branc_hList" :key="item.code" :value="item.code">{{ item.name }}</option>
                    </select>
                    <button type="button" class="btn btn-primary" @click="doModBranchList">新增</button>
                  </td>
                </tr>
                <tr>
                  <th class="bg-table align-middle text-center">{{ modtitle }}列表</th>
                  <td>
                    <select class="form-control" style="width: fit-content;display: inline;" placeholder="代建行"
                      v-model='modBranch_del'>
                      <option v-for="item in modBranchList" :key="item" :value="item">{{ branch_mapping(item) }}
                      </option>
                    </select>
                    <button type="button" class="btn btn-primary" @click="doModBranchList_del">刪除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button type="submit" class="btn btn-secondary" @click="hidemodList">取消</button>
          <button type="submit" class="btn btn-primary" @click="post_branch_setting(modtitle)">確認</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.bg-table {
  background: lightgray
}

.btn-icon:hover {
  background: #0000001a;
}
</style>
