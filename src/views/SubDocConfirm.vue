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
const modBcode = ref('');
const modMname = ref('');
const modMcode = ref('');
const modName = ref('');
const modCode = ref('');
const modDocCode = ref('');
const modDocBarCode = ref('');
const modDocMode = ref('');
const modModal = ref();
const isQuerying = ref(false);
const current_page_index = ref(1);
const total_page = ref('1');
const data_count = ref(0);
const excel_URL = ref('');
const login = useLoginStore();
const uid = computed(() => (login.verifyid?.uid.toUpperCase() || ''));
const uname = computed(() => (login.verifyid?.uname || ''));


const ListData = ref<SubDocList[]>([]);
const MiddleDocListData = ref<MiddleDocList[]>([]);
const MainDocListData = ref<MainDocList[]>([]);

// 監控 Props.currentIndex 變更

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
    params.append('nistatus', '0');
    params.append('uid', uid.value);

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

function showmodList(item: SubDocList) {
  const Moditem = JSON.parse(JSON.stringify(item));//deep copy
  modBcode.value = MiddleDocListData.value.find((x)=>(x.mcode == item.mcode))?.bcode || '';
  modMcode.value = Moditem.mcode;
  modMname.value = Moditem.mname;
  modCode.value = Moditem.code;
  modName.value = Moditem.name;
  modDocCode.value = Moditem.DocCode;
  modDocBarCode.value = Moditem.DocBarCode;
  modDocMode.value = Moditem.DocMode;
  modModal.value.show();
}

function hidemodList() {
  modName.value = '';
  modCode.value = '';
  modMcode.value = '';
  modMname.value = '';
  modDocCode.value = '';
  modDocBarCode.value = '';
  modDocMode.value = '';
  modModal.value.hide();
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

/** 核可 */
async function doModList() {
  isQuerying.value = true;
  try {
    //post 參數設定
    let params = new URLSearchParams();
    params.append('optype', '3');
    params.append('code', modCode.value);
    params.append('nistatus', '1');
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
  const staticBackdropMod = document.getElementById('staticBackdropMod');
  if (staticBackdropMod != null) {
    modModal.value = new Modal(staticBackdropMod);
  }
}

onMounted(async () => {
  // 初始化 Modal
  initModal();
  //取得中類清單
  await query_MiddleDocList();
  await query_MainDocList();
  // 展開此頁面選單
  await queryList(1);
  current_page_index.value = 1;
  store.setMainMenuSelect('system_setting');
  store.setSubMenuSelect('ni4-11');
});
</script>

<template>
  <!--loading-->
  <LoadingScreen message='處理中，請稍候...' :visible='isQuerying' />

  <!-- 頁面標題 -->
  <h1 class="text-center p-3">文件小項類別核可</h1>

  <!-- 功能按鈕 -->
  <div class="d-flex justify-content-end m-3">
    <button class="btn btn-primary" @click="downloadExcel">
      <i class="bi bi-plus-circle"></i>
      匯出EXCEL
    </button>
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
          <th scope="col">核可</th>
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
          <td>
            <button class="btn border-0 rounded btn-icon" @click="showmodList(item)">
              <i class="bi bi-pencil-square"></i>
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
  <!-- 修改文件小項類別 -->
  <div class="modal fade" id="staticBackdropMod" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
    aria-labelledby="staticBackdropModLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="staticBackdropModLabel">核可文件小項類別</h5>
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
                      maxlength="50" disabled="true" required /></td>
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
                    <select class="form-control" placeholder="主附件" v-model='modDocMode' disabled="true" required>
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
          <button type="submit" class="btn btn-primary" @click="doModList">核可</button>
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
