<script lang="ts" setup>
import axios from 'axios';
import { Modal } from 'bootstrap';
import { Base64 } from 'js-base64';
import { ref, reactive, onMounted, watch, computed } from 'vue';
import { useMenuStore } from '@/store/menu';
import LoadingScreen from '@/components/LoadingScreen.vue';
import Pagination from '@/components/PageContainer.vue';
import { useLoginStore } from '@/store/login';
import { MainDocList, doPost_businessidBDoc_mapping } from '@/store/businessidBDoc_mapping';
import { MiddleDocList, doPost_businessidDoc_mapping } from '@/store/businessidDoc_mapping';
import { SubDocList, doPost_businessid_mapping } from '@/store/businessid_mapping';

const store = useMenuStore();
/** 查詢參數 */
const query_Bcode = ref('');
const query_Mcode = ref('');
const query_DocCode = ref('');
const query_BarCode = ref('');
const query_uid = ref('');
const query_DocMode = ref('');
const query_nistatus = ref('');
const query_hide_minus = ref(true);

/** 修改參數 */
const modBcode = ref('');
const modMname = ref('');
const modMcode = ref('');
const modName = ref('');
const modCode = ref('');
const modDocCode = ref('');
const modDocBarCode = ref('');
const modDocMode = ref('');

/** 刪除參數 */
const delMname = ref('');
const delMcode = ref('');
const delName = ref('');
const delCode = ref('');
const delDocCode = ref('');
const delDocBarCode = ref('');
const delDocMode = ref('');

const addModal = ref();
const modModal = ref();
const delModal = ref();
const isQuerying = ref(false);

/** 新增參數 */
const addBcode = ref('');
const addMname = ref('');
const addMcode = ref('');
const addName = ref('');
const addCode = ref('');
const addDocCode = ref('');
const addDocBarCode = ref('');
const addDocMode = ref('0');


const current_page_index = ref(1);
const total_page = ref('1');
const data_count = ref(0);
const excel_URL = ref('');
const login = useLoginStore();
const uid = computed(() => (login.verifyid?.uid.toUpperCase() || ''));
const uname = computed(() => (login.verifyid?.uname || ''));
const addwasValidated = ref(false);//新增驗證
const modwasValidated = ref(false);//修改驗證
const queryselect = ref(true);//查詢選單
const queryFinish = ref(false);//查詢選單


const ListData = ref<SubDocList[]>([]);
const MiddleDocListData = ref<MiddleDocList[]>([]);
const MainDocListData = ref<MainDocList[]>([]);

// 監控 Props.currentIndex 變更
watch(() => addMcode.value, () => {
  addMname.value = MiddleDocListData.value.find((x) => (x.mcode == addMcode.value))?.mname || '';
});

async function queryList(page: number) {
  if (page < 1) {
    alert('頁數不可小於1');
    return;
  }
  if (page > parseInt(total_page.value)) {
    alert('頁數不可大於最大頁數');
    return;
  }
  if (page == 0) {
    return;
  }
  //查詢初始化
  ListData.value.length = 0;
  //查詢
  isQuerying.value = true;
  try {
    let params = new URLSearchParams();
    params.append('optype', '1');
    params.append('pages', page.toString());

    params.append('query_Bcode', query_Bcode.value);
    params.append('query_Mcode', query_Mcode.value);
    params.append('query_DocCode', query_DocCode.value);
    params.append('query_BarCode', query_BarCode.value);
    params.append('query_uid', query_uid.value);
    params.append('query_DocMode', query_DocMode.value);
    params.append('query_nistatus', query_nistatus.value);
    let temp_hide_mius = '0';
    if(query_hide_minus.value == true){
      temp_hide_mius = '1';
    }
    params.append('query_hide_minus', temp_hide_mius);

    let tempres = await doPost_businessid_mapping(params);
    let basic = tempres.error[0].Code;
    let message = tempres.error[0].Message;
    if (basic != '00000000') {
      throw new Error(`${basic}: ${message}`);
    }
    excel_URL.value = tempres.error[0].ExcelFile;
    let count = tempres.error[0].Count;
    let totalpage = tempres.error[0].totalpage;
    if (tempres.data == null || count == null || totalpage == null) {
      throw new Error('伺服器回傳錯誤的資料格式');
    }

    ListData.value = tempres.data;
    data_count.value = parseInt(count);
    total_page.value = totalpage;

    hideSelect();

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

function showdelList(item: SubDocList) {
  delMcode.value = item.mcode;
  delMname.value = item.mname;
  delCode.value = item.code;
  delName.value = item.name;
  delDocCode.value = item.DocCode;
  delDocBarCode.value = item.DocBarCode;
  delDocMode.value = item.DocMode;
  delModal.value.show();
}

function hidedelList() {
  delModal.value.hide();
}

function showaddList() {
  addModal.value.show();
  addwasValidated.value = false;
}

function hideaddList() {
  addCode.value = '';
  addName.value = '';
  addMcode.value = '';
  addMname.value = '';
  addDocCode.value = '';
  addDocBarCode.value = '';
  addDocMode.value = '';
  addBcode.value = MainDocListData.value[0].bcode;//第一個選項
  addwasValidated.value = false;
  addModal.value.hide();

}

function showmodList(item: SubDocList) {
  const Moditem = JSON.parse(JSON.stringify(item));//deep copy
  modBcode.value = MiddleDocListData.value.find((x) => (x.mcode == item.mcode))?.bcode || '';
  modMcode.value = Moditem.mcode;
  modMname.value = Moditem.mname;
  modCode.value = Moditem.code;
  modName.value = Moditem.name;
  modDocCode.value = Moditem.DocCode;
  modDocBarCode.value = Moditem.DocBarCode;
  modDocMode.value = Moditem.DocMode;
  modwasValidated.value = false;

  modModal.value.show();
}

function hidemodList() {
  modBcode.value = '';
  modName.value = '';
  modCode.value = '';
  modMcode.value = '';
  modMname.value = '';
  modDocCode.value = '';
  modDocBarCode.value = '';
  modDocMode.value = '';
  modwasValidated.value = false;
  modModal.value.hide();
}

function hideSelect() {
  queryselect.value = false;
  queryFinish.value = true;
}

function ShowSelect(){
  queryselect.value = true;
  queryFinish.value = false;
}


async function query_MiddleDocList() {
  //post 參數設定
  let params = new URLSearchParams();
  params.append('optype', '0');
  let tempres = await doPost_businessidDoc_mapping(params);
  MiddleDocListData.value = tempres.data;
}

async function query_MainDocList() {
  //post 參數設定
  let params = new URLSearchParams();
  params.append('optype', '0');
  let tempres = await doPost_businessidBDoc_mapping(params);
  MainDocListData.value = tempres.data;
}


async function doAddList() {
  //新增小類
  //檢核
  addwasValidated.value = true;
  const form = document.forms[0];
  if (!form.checkValidity()) {
    return;
  }
  isQuerying.value = true;
  try {
    //post 參數設定
    let params = new URLSearchParams();
    params.append('optype', '2');

    params.append('name', Base64.encode(addName.value));
    params.append('mcode', addMcode.value);
    params.append('mname', Base64.encode(addMname.value));
    params.append('DocCode', addDocCode.value);
    params.append('DocBarCode', addDocBarCode.value);
    params.append('DocMode', addDocMode.value);
    params.append('uid', uid.value);
    params.append('userName', Base64.encode(uname.value));
    params.append('nicuser', uid.value);

    let tempres = await doPost_businessid_mapping(params);
    let basic = tempres.error[0].Code;
    let message = tempres.error[0].Message;
    if (basic != '00000000') {
      throw new Error(`${basic}: ${message}`);
    }

    hideaddList();//同時初始化新增視窗

    await queryList(1);
    current_page_index.value = 1;
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

async function doDelList() {
  //刪除小類
  //檢核
  if (delCode.value == '') {
    alert('IP不可為空');
    return;
  }
  isQuerying.value = true;
  try {
    //post 參數設定
    let params = new URLSearchParams();
    params.append('optype', '4');
    params.append('code', delCode.value);
    params.append('userName', Base64.encode(uname.value));
    params.append('nicuser', uid.value);

    let tempres = await doPost_businessid_mapping(params);
    let basic = tempres.error[0].Code;
    let message = tempres.error[0].Message;
    if (basic != '00000000') {
      throw new Error(`${basic}: ${message}`);
    }

    hidedelList();
    delCode.value = '';
    await queryList(1);
    current_page_index.value = 1;
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

async function doModList() {
  //修改小類
  //檢核
  modwasValidated.value = true;
  const form = document.forms[1];
  if (!form.checkValidity()) {
    return;
  }
  isQuerying.value = true;
  try {
    //post 參數設定
    let params = new URLSearchParams();
    params.append('optype', '3');
    params.append('code', modCode.value);
    params.append('name', Base64.encode(modName.value));
    params.append('mcode', modMcode.value);
    params.append('mname', Base64.encode(modMname.value));
    params.append('DocCode', modDocCode.value);
    params.append('DocBarCode', modDocBarCode.value);
    params.append('DocMode', modDocMode.value);
    params.append('uid', uid.value);
    params.append('userName', Base64.encode(uname.value));
    params.append('nicuser', uid.value);

    let tempres = await doPost_businessid_mapping(params);
    let basic = tempres.error[0].Code;
    let message = tempres.error[0].Message;
    if (basic != '00000000') {
      throw new Error(`${basic}: ${message}`);
    }

    hidemodList();//同時初始化修改視窗


    await queryList(1);
    current_page_index.value = 1;
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

function downloadExcel() {
  window.open(excel_URL.value || '');
}

// 初始化 Modal
function initModal() {
  const staticBackdropAdd = document.getElementById('staticBackdropAdd');
  if (staticBackdropAdd != null) {
    addModal.value = new Modal(staticBackdropAdd);
  }

  const staticBackdropMod = document.getElementById('staticBackdropMod');
  if (staticBackdropMod != null) {
    modModal.value = new Modal(staticBackdropMod);
  }

  const staticBackdropDel = document.getElementById('staticBackdropDel');
  if (staticBackdropDel != null) {
    delModal.value = new Modal(staticBackdropDel);
  }
}

onMounted(async () => {
  // 初始化 Modal
  initModal();
  //取得中類清單
  await query_MiddleDocList();
  await query_MainDocList();
  addBcode.value = MainDocListData.value[0].bcode;
  // 展開此頁面選單
  current_page_index.value = 1;
  store.setMainMenuSelect('system_setting');
  store.setSubMenuSelect('ni4-3');
});
</script>

<template>
  <!--loading-->
  <LoadingScreen message='處理中，請稍候...' :visible='isQuerying' />

  <!-- 頁面標題 -->
  <h1 class="text-center p-3">文件小項類別設定維護</h1>

  <!-- 查詢選擇 -->
  <div v-show="queryselect">
    <div class="table-responsive">
      <div class="d-flex justify-content-center">
        <table class="table table-bordered" style="width: 80%;">
          <tbody>
            <tr>
              <th class="bg-table align-middle text-center">大項業務代號</th>
              <td>
                <select class="form-control" placeholder="大項業務代號" v-model='query_Bcode' required>
                  <option value="">全部</option>
                  <option v-for="item in MainDocListData" :key="item.bcode" :value="item.bcode">{{ item.bname }}
                  </option>
                </select>
              </td>
            </tr>
            <tr>
              <th class="bg-table align-middle text-center">中項業務代號</th>
              <td>
                <select class="form-control" placeholder="中項業務代號" v-model='query_Mcode' required>
                  <option value="">全部</option>
                  <option v-for="item in MiddleDocListData" :key="item.mcode" :value="item.mcode"
                    v-show="item.bcode == query_Bcode">{{ item.mname }}</option>
                </select>
              </td>
            </tr>
            <tr>
              <th class="bg-table align-middle text-center">表單編號</th>
              <td><input type="text" class="form-control" placeholder="表單編號" v-model='query_DocCode' maxlength="50" />
              </td>
            </tr>
            <tr>
              <th class="bg-table align-middle text-center">條碼編號</th>
              <td><input type="text" class="form-control" placeholder="條碼編號" v-model='query_BarCode' maxlength="50" />
              </td>
            </tr>
            <tr>
              <th class="bg-table align-middle text-center">最後異動人員</th>
              <td><input type="text" class="form-control" placeholder="最後異動人員" v-model='query_uid' maxlength="50" />
              </td>
            </tr>
            <tr>
              <th class="bg-table align-middle text-center">主附件</th>
              <td>
                <select class="form-control" placeholder="主附件" v-model='query_DocMode' required>
                  <option value="">全部</option>
                  <option value="0">主件</option>
                  <option value="1">附件</option>
                </select>
              </td>
            </tr>
            <tr>
              <th class="bg-table align-middle text-center">核可狀態</th>
              <td>
                <select class="form-control" placeholder="主附件" v-model='query_nistatus' required>
                  <option value="">全部</option>
                  <option value="0">未核</option>
                  <option value="1">已核</option>
                </select>
              </td>
            </tr>
            <tr>
              <th class="bg-table align-middle text-center">隱藏負數條碼編號</th>
              <td>
                  <input type="checkbox" v-model="query_hide_minus" class="form-check-input" :value="true" />
              </td>
            </tr>

          </tbody>
        </table>
      </div>
      <!-- 功能按鈕 -->
      <div class="d-flex justify-content-center mb-3">
        <button type="button" class="btn btn-primary btn-lg me-5" @click="queryList(1)">查詢</button>
      </div>
    </div>
  </div>

  <div v-show="queryFinish">
    <!-- 功能按鈕 -->
    <div class="d-flex justify-content-between m-3">
      <button class="btn btn-primary" @click="showaddList">
        <i class="bi bi-plus-circle"></i>
        新增文件小項類別
      </button>
      <div>
      <button class="btn btn-primary" @click="downloadExcel">
        <i class="bi bi-plus-circle"></i>
        匯出EXCEL
      </button>
      <button class="btn btn-primary" @click="ShowSelect">
        <i class="bi bi-plus-circle"></i>
        返回查詢
      </button>
      </div>
    </div>

    <!-- 表單 -->

    <div class="table-responsive d-flex justify-content-center">
      <table class="table table-bordered text-center">
        <thead class="">
          <tr class="bg-table">
            <th scope="col">中項業務類別名稱</th>
            <th width="350px" scope="col">文件名稱</th>
            <th scope="col">表單編號</th>
            <th scope="col">條碼編號</th>
            <th scope="col">最後異動人員</th>
            <th scope="col">主附件</th>
            <th scope="col">核可狀態</th>
            <th scope="col">修改</th>
            <th scope="col" v-if="uid == 'SUPER'">刪除</th>
          </tr>
        </thead>
        <tbody class="text-nowrap">
          <tr class="align-middle" v-for="item in ListData" :key="item.code">

            <td :title="item.mname">{{ MiddleDocListData.find((x) => (x.mcode == item.mcode))?.mname || '' }}</td>
            <td :title="item.name">{{ item.name }}</td>
            <td :title="item.DocCode">{{ item.DocCode }}</td>
            <td :title="item.DocBarCode">{{ item.DocBarCode }}</td>
            <td :title="item.DocBarCode">{{ item.uid }}</td>
            <td v-if="item.DocMode == '0'">主件</td>
            <td v-if="item.DocMode == '1'">附件</td>
            <td v-if="item.nistatus == '0' || item.nistatus == ''">未核可</td>
            <td v-if="item.nistatus == '1'">已核可</td>
            <td v-if="item.nistatus != '0' && item.nistatus != '' && item.nistatus != '1'">{{ item.nistatus }}</td>
            <td>
              <button class="btn border-0 rounded btn-icon" @click="showmodList(item)">
                <i class="bi bi-pencil-square"></i>
              </button>
            </td>
            <td v-if="uid == 'SUPER'">
              <button class="btn border-0 rounded btn-icon" @click="showdelList(item)">
                <i class="bi bi-trash3"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- 分頁 -->
    <div class="d-flex justify-content-end">
      <Pagination :queryCount="data_count" :currentIndex="current_page_index" :totalPage="total_page"
        @change-page-index="changePageIndex" />
    </div>
  </div>
  <form @submit.prevent="doAddList" id="addForm" :class="{ 'was-validated': addwasValidated }" class="table-responsive"
    novalidate>
    <!-- 新增文件小項類別 -->
    <div class="modal fade" id="staticBackdropAdd" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
      aria-labelledby="staticBackdropAddLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="staticBackdropAddLabel">新增文件小項類別</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="table-responsive">
              <table class="table table-bordered">
                <tbody>
                  <tr>
                    <th class="bg-table align-middle text-center">大項業務代號</th>
                    <td>
                      <select class="form-control" placeholder="大項業務代號" v-model='addBcode' required>
                        <option v-for="item in MainDocListData" :key="item.bcode" :value="item.bcode">{{ item.bname }}
                        </option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <th class="bg-table align-middle text-center">中項業務代號</th>
                    <td>
                      <select class="form-control" placeholder="中項業務代號" v-model='addMcode' required>
                        <option v-for="item in MiddleDocListData" :key="item.mcode" :value="item.mcode"
                          v-show="item.bcode == addBcode">{{ item.mname }}</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <th class="bg-table align-middle text-center">文件名稱</th>
                    <td><input type="text" class="form-control" placeholder="文件名稱" v-model='addName' maxlength="50"
                        required /></td>
                  </tr>
                  <tr>
                    <th class="bg-table align-middle text-center">表單編號</th>
                    <td><input type="text" class="form-control" placeholder="表單編號" v-model='addDocCode' required /></td>
                  </tr>

                  <tr>
                    <th class="bg-table align-middle text-center">條碼編號</th>
                    <td><input type="text" class="form-control" placeholder="條碼編號" v-model='addDocBarCode' required />
                    </td>
                  </tr>
                  <tr>
                    <th class="bg-table align-middle text-center">主附件</th>
                    <td>
                      <select class="form-control" placeholder="主附件" v-model='addDocMode' required>
                        <option value="0">主件</option>
                        <option value="1">附件</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="hideaddList">取消</button>
            <button type="submit" class="btn btn-primary">確認</button>
          </div>
        </div>
      </div>
    </div>
  </form>
  <!-- 修改文件小項類別 -->
  <form @submit.prevent="doModList" id="addForm" :class="{ 'was-validated': modwasValidated }" class="table-responsive"
    novalidate>
    <div class="modal fade" id="staticBackdropMod" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
      aria-labelledby="staticBackdropModLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="staticBackdropModLabel">修改文件小項類別</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="table-responsive">
              <table class="table table-bordered">
                <tbody>
                  <tr>
                    <th class="bg-table align-middle text-center">大項業務代號</th>
                    <td>
                      <select class="form-control" placeholder="大項業務代號" v-model='modBcode' disabled="true" required>
                        <option v-for="item in MainDocListData" :key="item.bcode" :value="item.bcode">{{ item.bname }}
                        </option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <th class="bg-table align-middle text-center">中項業務類別名稱</th>
                    <td><input :title="modMname" type="text" class="form-control" placeholder="中項業務類別名稱"
                        v-model='modMname' disabled="true" required /></td>
                  </tr>
                  <tr>
                    <th class="bg-table align-middle text-center">文件名稱</th>
                    <td><input :title="modName" type="text" class="form-control" placeholder="文件名稱" v-model='modName'
                        maxlength="50" required /></td>
                  </tr>
                  <tr>
                    <th class="bg-table align-middle text-center">表單編號</th>
                    <td><input :title="modDocCode" type="text" class="form-control" placeholder="表單編號"
                        v-model='modDocCode' disabled="true" required /></td>
                  </tr>

                  <tr>
                    <th class="bg-table align-middle text-center">條碼編號</th>
                    <td><input :title="modDocBarCode" type="text" class="form-control" placeholder="條碼編號"
                        v-model='modDocBarCode' disabled="true" required /></td>
                  </tr>
                  <tr>
                    <th class="bg-table align-middle text-center">主附件</th>
                    <td>
                      <select class="form-control" placeholder="主附件" v-model='modDocMode' required>
                        <option value="0">主件</option>
                        <option value="1">附件</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="hidemodList">取消</button>
            <button type="submit" class="btn btn-primary">確認</button>
          </div>
        </div>
      </div>
    </div>
  </form>
  <!-- 刪除文件小項類別 -->
  <div class="modal fade" id="staticBackdropDel" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
    aria-labelledby="staticBackdropDelLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="staticBackdropDelLabel">刪除文件小項類別</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="table-responsive">
            <table class="table table-bordered">
              <tbody>
                <tr>
                  <th class="bg-table align-middle text-center">中項業務類別名稱</th>
                  <td><input :title="delMname" type="text" class="form-control" placeholder="中項業務類別名稱"
                      v-model='delMname' disabled="true" /></td>
                </tr>
                <tr>
                  <th class="bg-table align-middle text-center">文件名稱</th>
                  <td><input :title="delName" type="text" class="form-control" placeholder="文件名稱" v-model='delName'
                      disabled="true" /></td>
                </tr>
                <tr>
                  <th class="bg-table align-middle text-center">表單編號</th>
                  <td><input :title="delDocCode" type="text" class="form-control" placeholder="表單編號"
                      v-model='delDocCode' disabled="true" /></td>
                </tr>
                <tr>
                  <th class="bg-table align-middle text-center">條碼編號</th>
                  <td><input :title="delDocBarCode" type="text" class="form-control" placeholder="條碼編號"
                      v-model='delDocBarCode' disabled="true" /></td>
                </tr>
                <tr>
                  <th class="bg-table align-middle text-center">主附件</th>
                  <td>
                    <select class="form-control" placeholder="主附件" v-model='delDocMode' disabled="true">
                      <option value="0">主件</option>
                      <option value="1">附件</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="hidedelList">取消</button>
          <button type="button" class="btn btn-primary" @click="doDelList">確認</button>
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
