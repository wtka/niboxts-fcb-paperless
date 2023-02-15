<script lang="ts" setup>
import axios from 'axios';
import { Modal } from 'bootstrap';
import { Base64 } from 'js-base64';
import { ref, reactive, onMounted, computed } from 'vue';
import { useMenuStore } from '@/store/menu';
import LoadingScreen from '@/components/LoadingScreen.vue';
import Pagination from '@/components/PageContainer.vue';
import { useLoginStore } from '@/store/login';

const login = useLoginStore();
const uid = computed(() => (login.verifyid?.uid || ''));
const store = useMenuStore();
const delCode = ref('');
const delName = ref('');
const modCode = ref('');
const modName = ref('');
const addModal = ref();
const modModal = ref();
const delModal = ref();
const isQuerying = ref(false);
const addName = ref('');
const addCode = ref('');
const current_page_index = ref(1);
const total_page = ref('1');
const data_count = ref(0);
const addwasValidated = ref(false);//新增驗證
const modwasValidated = ref(false);//修改驗證

type jsonres_queryipcheck_mapping = {
  error: {
    Code: string;
    Message: string;
    Count?: string;
    totalpage?: string;
  }[];
  data: List[];
};

type List = {
  code: string;
  name: string;
  rqstatus: string;
};

const ListData = ref<List[]>([]);

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

    let tempres = await doPost_queryipcheck_mapping(params);
    let basic = tempres.error[0].Code;
    let message = tempres.error[0].Message;
    if (basic != '00000000') {
      throw new Error(`${basic}: ${message}`);
    }

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

function showdelList(ip: string, text: string) {
  delCode.value = ip;
  delName.value = text;
  delModal.value.show();
}

function hidedelList() {
  delModal.value.hide();
}

function showaddList() {
  addwasValidated.value = false;
  addModal.value.show();
}

function hideaddList() {
  addwasValidated.value = false;
  addModal.value.hide();
}

function showmodList(ip: string, text: string) {
  modCode.value = ip;
  modName.value = text;
  modwasValidated.value = false;
  modModal.value.show();
}

function hidemodList() {
  modwasValidated.value = false;
  modModal.value.hide();
}

async function doPost_queryipcheck_mapping(params: URLSearchParams) {
  // 發送請求並回傳結果
  let res: jsonres_queryipcheck_mapping;
  if (process.env.NODE_ENV == 'development') {
    const resp = await axios.get('test/queryipcheck_mapping.json', {
      responseType: 'json',
    });
    res = resp.data;
  } else {
    const resp = await axios.post('/nibox/queryipcheck_mapping.jsp', params, {
      responseType: 'json',
    });
    res = resp.data;
  }

  return res;
}

async function doAddList() {
  //新增白名單
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
    params.append('code', addCode.value);
    params.append('rqstatus', '1');
    params.append('userName', uid.value);

    let tempres = await doPost_queryipcheck_mapping(params);
    let basic = tempres.error[0].Code;
    let message = tempres.error[0].Message;
    if (basic != '00000000') {
      throw new Error(`${basic}: ${message}`);
    }

    hideaddList();
    addCode.value = '';
    addName.value = '';

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
  //刪除白名單
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
    params.append('userName', uid.value);

    let tempres = await doPost_queryipcheck_mapping(params);
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
  //修改白名單
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
    params.append('name', Base64.encode(modName.value));
    params.append('code', modCode.value);
    params.append('rqstatus', '2');
    params.append('userName', uid.value);

    let tempres = await doPost_queryipcheck_mapping(params);
    let basic = tempres.error[0].Code;
    let message = tempres.error[0].Message;
    if (basic != '00000000') {
      throw new Error(`${basic}: ${message}`);
    }

    hidemodList();
    modName.value = '';
    modCode.value = '';

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

  // 展開此頁面選單
  await queryList(1);
  current_page_index.value = 1;
  store.setMainMenuSelect('system_setting');
  store.setSubMenuSelect('ni4-4');
});
</script>

<template>
  <!--loading-->
  <LoadingScreen message='處理中，請稍候...' :visible='isQuerying' />

  <!-- 頁面標題 -->
  <h1 class="text-center p-3">白名單設定維護</h1>

  <!-- 功能按鈕 -->
  <div class="d-flex justify-content-end m-3">
    <button class="btn btn-primary" @click="showaddList">
      <i class="bi bi-plus-circle"></i>
      新增白名單
    </button>
  </div>

  <!-- 表單 -->
  <div class="table-responsive d-flex justify-content-center">
    <table class="table table-bordered text-center">
      <thead class="text-nowrap">
        <tr class="bg-table">
          <th scope="col">IP</th>
          <th scope="col">說明</th>
          <th scope="col">修改</th>
          <th scope="col">刪除</th>
        </tr>
      </thead>
      <tbody class="text-nowrap">
        <tr class="align-middle" v-for="item in ListData" :key="item.code">
          <td scope="row">{{ item.code }}</td>
          <td>{{ item.name }}</td>
          <td>
            <button class="btn border-0 rounded btn-icon" @click="showmodList(item.code, item.name)">
              <i class="bi bi-pencil-square"></i>
            </button>
          </td>
          <td>
            <button class="btn border-0 rounded btn-icon" @click="showdelList(item.code, item.name)">
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

  <!-- 新增白名單 -->
  <form @submit.prevent="doAddList" id="addForm" :class="{ 'was-validated': addwasValidated }" class="table-responsive"
    novalidate>
    <div class="modal fade" id="staticBackdropAdd" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
      aria-labelledby="staticBackdropAddLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="staticBackdropAddLabel">新增白名單</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="table-responsive">
              <table class="table table-bordered">
                <tbody>
                  <tr>
                    <th class="bg-table align-middle text-center">白名單IP</th>
                    <td><input type="text" class="form-control" placeholder="白名單IP" v-model='addCode' required /></td>
                  </tr>
                  <tr>
                    <th class="bg-table align-middle text-center">白名單說明</th>
                    <td><input type="text" class="form-control" placeholder="白名單說明" v-model='addName' required /></td>
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
  <!-- 修改白名單 -->
  <form @submit.prevent="doModList" id="addForm" :class="{ 'was-validated': modwasValidated }" class="table-responsive"
    novalidate>
    <div class="modal fade" id="staticBackdropMod" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
      aria-labelledby="staticBackdropModLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="staticBackdropModLabel">修改白名單</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="table-responsive">
              <table class="table table-bordered">
                <tbody>
                  <tr>
                    <th class="bg-table align-middle text-center">白名單IP</th>
                    <td><input type="text" class="form-control" placeholder="白名單IP" v-model='modCode' disabled
                        required /></td>
                  </tr>
                  <tr>
                    <th class="bg-table align-middle text-center">白名單說明</th>
                    <td><input type="text" class="form-control" placeholder="白名單說明" v-model='modName' required /></td>
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
  <!-- 刪除白名單 -->
  <div class="modal fade" id="staticBackdropDel" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
    aria-labelledby="staticBackdropDelLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="staticBackdropDelLabel">刪除白名單</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="table-responsive">
            <table class="table table-bordered">
              <tbody>
                <tr>
                  <th class="bg-table align-middle text-center">白名單IP</th>
                  <td><input type="text" class="form-control" placeholder="白名單IP" v-model='delCode' disabled /></td>
                </tr>
                <tr>
                  <th class="bg-table align-middle text-center">白名單說明</th>
                  <td><input type="text" class="form-control" placeholder="白名單說明" v-model='delName' disabled /></td>
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
