<script lang="ts" setup>
import axios from 'axios';
import { Modal } from 'bootstrap';
import { Base64 } from 'js-base64';
import { ref, onMounted, computed } from 'vue';
import { useMenuStore } from '@/store/menu';
import { BranchList, doPost_companyid_mapping } from '@/store/companyid_mapping';
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
const modAllowkeyinbrnach = ref('');
const addModal = ref();
const modModal = ref();
const delModal = ref();
const delAllowkeyinbrnach = ref<string[]>([]);
const isQuerying = ref(false);
const addName = ref('');
const addCode = ref('');
const addAllowkeyinbrnach = ref('');
const query_branch = ref('');


const addAllowkeyinbrnach_add = ref('');
const addAllowkeyinbrnach_del = ref('');
const addAllowkeyinbrnach_array = ref<string[]>([]);

const modAllowkeyinbrnach_add = ref('');
const modAllowkeyinbrnach_del = ref('');
const modAllowkeyinbrnach_array = ref<string[]>([]);

const current_page_index = ref(1);
const total_page = ref('1');
const data_count = ref(0);
const addwasValidated = ref(false);//新增驗證
const modwasValidated = ref(false);//修改驗證
const old_Moditem = ref<BranchList>();

const ListData = ref<BranchList[]>([]);


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
    params.append('code', query_branch.value);

    let tempres = await doPost_companyid_mapping(params);
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
    for (let i = 0; i < ListData.value.length; i++) {
      let temp_array = [];
      for (let j = 0; j < ListData.value[i].allowkeyinbrnach.split('_').length; j++) {
        temp_array.push(ListData.value[i].allowkeyinbrnach.split('_')[j]);
      }
      ListData.value[i].allowkeyinbrnach_array = temp_array;
    }
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


function showdelList(item: BranchList) {

  delCode.value = item.code;
  delName.value = item.name;
  delAllowkeyinbrnach.value = [];
  for (let i = 0; i < item.allowkeyinbrnach.split('_').length; i++) {
    delAllowkeyinbrnach.value.push(item.allowkeyinbrnach.split('_')[i]);
  }
  delModal.value.show();
}

function hidedelList() {
  delModal.value.hide();
  delAllowkeyinbrnach.value = [];
}

function showaddList() {
  addModal.value.show();
  addwasValidated.value = false;
  //初始化
  addAllowkeyinbrnach_add.value = '';
  addAllowkeyinbrnach_del.value = '';
  addAllowkeyinbrnach_array.value = [];
}

function hideaddList() {
  addModal.value.hide();
  addwasValidated.value = false;
  //初始化
  addAllowkeyinbrnach_add.value = '';
  addAllowkeyinbrnach_del.value = '';
  addAllowkeyinbrnach_array.value = [];
}

function showmodList(item: BranchList) {
  modwasValidated.value = false;
  const Moditem = JSON.parse(JSON.stringify(item));//deep copy
  modCode.value = Moditem.code;
  modName.value = Moditem.name;
  old_Moditem.value = item;

  for (let i = 0; i < Moditem.allowkeyinbrnach.split('_').length; i++) {
    modAllowkeyinbrnach_array.value.push(Moditem.allowkeyinbrnach.split('_')[i]);
    console.log(Moditem.allowkeyinbrnach.split('_')[i]);
  }

  modModal.value.show();
}

function hidemodList() {
  modwasValidated.value = false;
  modModal.value.hide();
  //初始化
  modAllowkeyinbrnach_add.value = '';
  modAllowkeyinbrnach_del.value = '';
  modAllowkeyinbrnach_array.value = [];
}



async function doAddList() {
  //新增分行別
  for (let i = 0; i < addAllowkeyinbrnach_array.value.length; i++) {
    if (i != 0) {
      addAllowkeyinbrnach.value += '_';
    }
    addAllowkeyinbrnach.value += addAllowkeyinbrnach_array.value[i];
  }
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
    params.append('allowkeyinbrnach', addAllowkeyinbrnach.value);
    params.append('userName', uid.value);

    let tempres = await doPost_companyid_mapping(params);
    let basic = tempres.error[0].Code;
    let message = tempres.error[0].Message;
    if (basic != '00000000') {
      throw new Error(`${basic}: ${message}`);
    }

    hideaddList();
    addCode.value = '';
    addName.value = '';
    addAllowkeyinbrnach.value = '';

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
  //刪除分行別
  //檢核
  if (delCode.value == '') {
    alert('分行别不可為空');
    return;
  }
  isQuerying.value = true;
  try {
    //post 參數設定
    let params = new URLSearchParams();
    params.append('optype', '4');
    params.append('code', delCode.value);
    params.append('userName', uid.value);

    let tempres = await doPost_companyid_mapping(params);
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
  //修改分行別

  modAllowkeyinbrnach.value = '';
  for (let i = 0; i < modAllowkeyinbrnach_array.value.length; i++) {
    if (i != 0) {
      modAllowkeyinbrnach.value += '_';
    }
    modAllowkeyinbrnach.value += modAllowkeyinbrnach_array.value[i];
  }
  if (modAllowkeyinbrnach.value == '') {
    modAllowkeyinbrnach.value = ':::EMP:::';
  }
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
    params.append('allowkeyinbrnach', modAllowkeyinbrnach.value);
    if (old_Moditem.value != null) {
      params.append('oldname', Base64.encode(old_Moditem.value.name));
      params.append('oldallowkeyinbrnach', old_Moditem.value.allowkeyinbrnach);
    }


    params.append('userName', uid.value);

    let tempres = await doPost_companyid_mapping(params);
    let basic = tempres.error[0].Code;
    let message = tempres.error[0].Message;
    if (basic != '00000000') {
      throw new Error(`${basic}: ${message}`);
    }

    hidemodList();
    modName.value = '';
    modCode.value = '';
    modAllowkeyinbrnach.value = '';

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

function doAddAllowkeyinbrnach_add() {
  if (addAllowkeyinbrnach_add.value.length == 0) {
    alert('必須選擇一個分行');
    return;
  }
  if (addAllowkeyinbrnach_array.value.indexOf(addAllowkeyinbrnach_add.value) == -1) {


    addAllowkeyinbrnach_array.value.push(addAllowkeyinbrnach_add.value);
  }
  else {
    alert('已存在該筆資料');
  }
}

function doAddAllowkeyinbrnach_del() {
  if (addAllowkeyinbrnach_del.value.length == 0) {
    alert('必須選擇一個分行');
    return;
  }
  if (addAllowkeyinbrnach_array.value.indexOf(addAllowkeyinbrnach_del.value) != -1) {


    addAllowkeyinbrnach_array.value.splice(addAllowkeyinbrnach_array.value.indexOf(addAllowkeyinbrnach_del.value), 1);
  }
  else {
    alert('不存在該筆資料');
  }
}

function doModAllowkeyinbrnach_add() {
  if (modAllowkeyinbrnach_add.value.length == 0) {
    alert('必須選擇一個分行');
    return;
  }
  if (modAllowkeyinbrnach_array.value.indexOf(modAllowkeyinbrnach_add.value) == -1) {


    modAllowkeyinbrnach_array.value.push(modAllowkeyinbrnach_add.value);
  }
  else {
    alert('已存在該筆資料');
  }
}

function doModAllowkeyinbrnach_del() {
  if (modAllowkeyinbrnach_del.value.length == 0) {
    alert('必須選擇一個分行');
    return;
  }
  if (modAllowkeyinbrnach_array.value.indexOf(modAllowkeyinbrnach_del.value) != -1) {


    modAllowkeyinbrnach_array.value.splice(modAllowkeyinbrnach_array.value.indexOf(modAllowkeyinbrnach_del.value), 1);
  }
  else {
    alert('不存在該筆資料');
  }
}

function companyid_mapping(companycode: string) {
  return ListData.value.find((x) => (x.code == companycode))?.name || '';
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

function dataSplit(data: string) {
  const data_array = [];
  for (let i = 0; i < data.split('_').length; i++) {
    data_array.push(data.split('_')[i]);
  }
  return data_array;
}

function branch_mapping(branchCode: string) {
  return ListData.value.find((x) => (x.code == branchCode))?.name || '';
}

onMounted(async () => {
  // 初始化 Modal
  initModal();

  // 展開此頁面選單
  await queryList(1);
  current_page_index.value = 1;
  store.setMainMenuSelect('system_setting');
  store.setSubMenuSelect('ni4-1');
});
</script>

<template>
  <!--loading-->
  <LoadingScreen message='處理中，請稍候...' :visible='isQuerying' />

  <!-- 頁面標題 -->
  <h1 class="text-center p-3">分行別維護設定表</h1>

  <!-- 查詢條件 -->
  <div class="d-flex justify-content-center m-3">
    <input type="text" class="form-control" placeholder="分行别代號" v-model='query_branch' style="width:400px" />
    <button class="btn btn-primary" @click="queryList(1)">
      查詢
    </button>
  </div>

  <!-- 功能按鈕 -->
  <div class="d-flex justify-content-end m-3">
    <button class="btn btn-primary" @click="showaddList">
      <i class="bi bi-plus-circle"></i>
      新增分行別
    </button>
  </div>

  <!-- 表單 -->
  <div class="table-responsive d-flex justify-content-center">
    <table class="table table-bordered text-center">
      <thead class="text-nowrap">
        <tr class="bg-table">
          <th scope="col">分行別</th>
          <th scope="col">分行别名稱</th>
          <th scope="col">代建行</th>
          <th scope="col">修改</th>
          <th scope="col">刪除</th>
        </tr>
      </thead>
      <tbody class="text-nowrap">
        <tr class="align-middle" v-for="item in ListData" :key="item.code">
          <td scope="row">{{ item.code }}</td>
          <td>{{ item.name }}</td>
          <!--<td>{{ item.allowkeyinbrnach }}</td>-->
          <td>
            <select class="form-control">
              <option v-for="item2 in item.allowkeyinbrnach_array" :key="item2">{{ branch_mapping(item2) }}
              </option>
            </select>
          </td>
          <td>
            <button class="btn border-0 rounded btn-icon" @click="showmodList(item)">
              <i class="bi bi-pencil-square"></i>
            </button>
          </td>
          <td>
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

  <!-- 新增分行別 -->
  <form @submit.prevent="doAddList()" id="addForm" :class="{ 'was-validated': addwasValidated }"
    class="table-responsive" novalidate>
    <div class="modal fade" id="staticBackdropAdd" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
      aria-labelledby="staticBackdropAddLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="staticBackdropAddLabel">新增分行別</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="table-responsive">
              <table class="table table-bordered">
                <tbody>
                  <tr>
                    <th class="bg-table align-middle text-center">分行別</th>
                    <td><input type="text" class="form-control" placeholder="分行別" v-model='addCode' required /></td>
                  </tr>
                  <tr>
                    <th class="bg-table align-middle text-center">分行别名稱</th>
                    <td><input type="text" class="form-control" placeholder="分行别名稱" v-model='addName' required /></td>
                  </tr>
                  <tr>
                    <th class="bg-table align-middle text-center">代建行列表</th>
                    <td>
                      <select class="form-control" style="width: fit-content;display: inline;" placeholder="代建行"
                        v-model='addAllowkeyinbrnach_add'>
                        <option v-for="item in ListData" :key="item.code" :value="item.code">{{ item.name }}</option>
                      </select>
                      <button type="button" class="btn btn-primary" @click="doAddAllowkeyinbrnach_add">新增</button>
                    </td>
                  </tr>
                  <tr>
                    <th class="bg-table align-middle text-center">代建行</th>
                    <td>
                      <select class="form-control" style="width: fit-content;display: inline;" placeholder="代建行單位"
                        v-model='modAllowkeyinbrnach_del'>
                        <option v-for="item in addAllowkeyinbrnach_array" :key="item" :value="item">{{
                          companyid_mapping(item)
                        }}</option>
                      </select>
                      <button type="button" class="btn btn-primary" @click="doAddAllowkeyinbrnach_del">刪除</button>
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

  <!-- 修改分行別 -->
  <form @submit.prevent="doModList()" id="addForm" :class="{ 'was-validated': modwasValidated }"
    class="table-responsive" novalidate>
    <div class="modal fade" id="staticBackdropMod" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
      aria-labelledby="staticBackdropModLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="staticBackdropModLabel">修改分行別</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="table-responsive">
              <table class="table table-bordered">
                <tbody>
                  <tr>
                    <th class="bg-table align-middle text-center">分行別</th>
                    <td><input type="text" class="form-control" placeholder="分行別" v-model='modCode' disabled required />
                    </td>
                  </tr>
                  <tr>
                    <th class="bg-table align-middle text-center">分行别名稱</th>
                    <td><input type="text" class="form-control" placeholder="分行别名稱" v-model='modName' required /></td>
                  </tr>
                  <tr>
                    <th class="bg-table align-middle text-center">代建行列表</th>
                    <td>
                      <select class="form-control" style="width: fit-content;display: inline;" placeholder="代建行"
                        v-model='modAllowkeyinbrnach_add'>
                        <option v-for="item in ListData" :key="item.code" :value="item.code">{{ item.name }}</option>
                      </select>
                      <button type="button" class="btn btn-primary" @click="doModAllowkeyinbrnach_add">新增</button>
                    </td>
                  </tr>
                  <tr>
                    <th class="bg-table align-middle text-center">代建行</th>
                    <td>
                      <select class="form-control" style="width: fit-content;display: inline;" placeholder="代建行單位"
                        v-model='modAllowkeyinbrnach_del'>
                        <option v-for="item in modAllowkeyinbrnach_array" :key="item" :value="item">{{
                          companyid_mapping(item)
                        }}</option>
                      </select>
                      <button type="button" class="btn btn-primary" @click="doModAllowkeyinbrnach_del">刪除</button>
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

  <!-- 刪除分行別 -->
  <div class="modal fade" id="staticBackdropDel" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
    aria-labelledby="staticBackdropDelLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="staticBackdropDelLabel">刪除分行別</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="table-responsive">
            <table class="table table-bordered">
              <tbody>
                <tr>
                  <th class="bg-table align-middle text-center">分行別</th>
                  <td><input type="text" class="form-control" placeholder="分行別" v-model='delCode' disabled /></td>
                </tr>
                <tr>
                  <th class="bg-table align-middle text-center">分行別名稱</th>
                  <td><input type="text" class="form-control" placeholder="分行別名稱" v-model='delName' disabled /></td>
                </tr>
                <tr>
                  <th class="bg-table align-middle text-center">代建行</th>
                  <td>
                    <select class="form-control" style="width: fit-content;display: inline;" placeholder="代建行單位">
                      <option v-for="item in delAllowkeyinbrnach" :key="item" :value="item">{{
                        companyid_mapping(item)
                      }}</option>
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
