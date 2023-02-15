<script lang="ts" setup>
import axios from 'axios';
import { Modal } from 'bootstrap';
import { Base64 } from 'js-base64';
import { ref, reactive, onMounted, computed } from 'vue';
import { useMenuStore } from '@/store/menu';
import LoadingScreen from '@/components/LoadingScreen.vue';
import Pagination from '@/components/PageContainer.vue';
import { useLoginStore } from '@/store/login';
import { MainDocList, doPost_businessidBDoc_mapping } from '@/store/businessidBDoc_mapping';
import { BranchList, doPost_companyid_mapping } from '@/store/companyid_mapping';

const store = useMenuStore();
const delCode = ref('');
const delName = ref('');
const modCode = ref('');
const modName = ref('');
const modAccGroup = ref('');
const addModal = ref();
const modModal = ref();
const delModal = ref();
const isQuerying = ref(false);
const addName = ref('');
const addCode = ref('');
const current_page_index = ref(1);
const total_page = ref('1');
const data_count = ref(0);
const login = useLoginStore();
const addAccGroup = ref('');
const addAccGroup_del = ref('');//暫存刪除字串
const modAccGroup_del = ref('');//暫存刪除字串
const uid = computed(() => (login.verifyid?.uid.toUpperCase() || ''));
const addAccGroupList = ref<string[]>([]);
const modAccGroupList = ref<string[]>([]);
const delAccGroupList = ref<string[]>([]);
const addwasValidated = ref(false);//新增驗證
const modwasValidated = ref(false);//修改驗證


const ListData = ref<MainDocList[]>([]);
const Branc_hList = ref<BranchList[]>([]);

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

    let tempres = await doPost_businessidBDoc_mapping(params);
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
      for (let j = 0; j < ListData.value[i].AccGroup.split('_').length; j++) {
        temp_array.push(ListData.value[i].AccGroup.split('_')[j]);
      }
      ListData.value[i].AccGroup_array = temp_array;
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

function showdelList(item: MainDocList) {
  delCode.value = item.bcode;
  delName.value = item.bname;
  for (let i = 0; i < item.AccGroup.split('_').length; i++) {
    delAccGroupList.value.push(item.AccGroup.split('_')[i]);
  }
  delModal.value.show();
}

function hidedelList() {
  delAccGroupList.value = [];
  delModal.value.hide();
}

function showaddList() {
  addAccGroupList.value = [];
  addAccGroup.value = '';
  addAccGroup_del.value = '';
  addModal.value.show();
}

function hideaddList() {
  addAccGroupList.value = [];
  addAccGroup.value = '';
  addAccGroup_del.value = '';
  addModal.value.hide();
  addwasValidated.value = false;
}

function showmodList(item: MainDocList) {
  const Moditem = JSON.parse(JSON.stringify(item));//deep copy
  modCode.value = Moditem.bcode;
  modName.value = Moditem.bname;
  modAccGroup.value = '';
  modModal.value.show();

  for (let i = 0; i < item.AccGroup.split('_').length; i++) {
    modAccGroupList.value.push(item.AccGroup.split('_')[i]);
  }
}

function hidemodList() {
  modwasValidated.value = false;
  modAccGroupList.value = [];
  modModal.value.hide();
}


async function doAddList() {
  //新增
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
    params.append('bname', Base64.encode(addName.value));
    params.append('bcode', addCode.value);
    params.append('userName', uid.value);
    let addAccGroup_string = '';
    if (addAccGroupList.value.length < 1) {
      alert('至少要一個管理單位');
      return;
    }
    for (let i = 0; i < addAccGroupList.value.length; i++) {
      if (i != 0) {
        addAccGroup_string += '_';
      }
      addAccGroup_string += addAccGroupList.value[i];
    }
    params.append('AccGroup', addAccGroup_string);

    let tempres = await doPost_businessidBDoc_mapping(params);
    let basic = tempres.error[0].Code;
    let message = tempres.error[0].Message;
    if (basic != '00000000') {
      throw new Error(`${basic}: ${message}`);
    }

    hideaddList();
    addCode.value = '';
    addName.value = '';
    addAccGroupList.value = [];
    addAccGroup_string = '';

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
  //刪除
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
    params.append('bcode', delCode.value);
    params.append('userName', uid.value);

    let tempres = await doPost_businessidBDoc_mapping(params);
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
  //修改
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
    params.append('bname', Base64.encode(modName.value));
    params.append('bcode', modCode.value);
    params.append('userName', uid.value);
    let modAccGroup_string = '';
    if (modAccGroupList.value.length < 1) {
      alert('至少要一個管理單位');
      return;
    }
    for (let i = 0; i < modAccGroupList.value.length; i++) {
      if (i != 0) {
        modAccGroup_string += '_';
      }
      modAccGroup_string += modAccGroupList.value[i];
    }
    params.append('AccGroup', modAccGroup_string);

    let tempres = await doPost_businessidBDoc_mapping(params);
    let basic = tempres.error[0].Code;
    let message = tempres.error[0].Message;
    if (basic != '00000000') {
      throw new Error(`${basic}: ${message}`);
    }

    hidemodList();
    modName.value = '';
    modCode.value = '';
    modAccGroup.value = '';
    modAccGroupList.value = [];
    modAccGroup_string = '';

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

function doAddAccGroupList() {
  if (addAccGroup.value.length == 0) {
    alert('必須選擇一個分行');
    return;
  }
  if (addAccGroupList.value.indexOf(addAccGroup.value) != -1) {
    alert('已存在該筆資料');
    return;
  }
  addAccGroupList.value.push(addAccGroup.value);
  addAccGroup.value = '';
}

function doAddAccGroupList_del() {
  if (addAccGroup_del.value.length == 0) {
    alert('必須選擇一個分行');
    return;
  }
  if (addAccGroupList.value.indexOf(addAccGroup_del.value) != -1) {


    addAccGroupList.value.splice(addAccGroupList.value.indexOf(addAccGroup_del.value), 1);
  }
  else {
    alert('不存在該筆資料');
  }
}

function doModAccGroupList() {
  if (modAccGroup.value.length == 0) {
    alert('必須選擇一個分行');
    return;
  }
  if (modAccGroupList.value.indexOf(modAccGroup.value) != -1) {
    alert('已存在該筆資料');
    return;
  }
  modAccGroupList.value.push(modAccGroup.value);
  modAccGroup.value = '';
}


function doModAccGroupList_del() {
  if (modAccGroup_del.value.length == 0) {
    alert('必須選擇一個分行');
    return;
  }
  if (modAccGroupList.value.indexOf(modAccGroup_del.value) != -1) {
    modAccGroupList.value.splice(modAccGroupList.value.indexOf(modAccGroup_del.value), 1);
  }
  else {
    alert('不存在該筆資料');
  }
}

async function changePageIndex(index: number) {
  current_page_index.value = index;
  await queryList(current_page_index.value);
}

function branch_mapping(branchCode: string) {
  return Branc_hList.value.find((x) => (x.code == branchCode))?.name || '';
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
  await queryBranchList();
  store.setMainMenuSelect('system_setting');
  store.setSubMenuSelect('ni4-2');
});
</script>

<template>
  <!--loading-->
  <LoadingScreen message='處理中，請稍候...' :visible='isQuerying' />

  <!-- 頁面標題 -->
  <h1 class="text-center p-3">文件大項類別設定維護</h1>

  <!-- 功能按鈕 -->
  <div class="d-flex justify-content-end m-3">
    <button class="btn btn-primary" @click="showaddList">
      <i class="bi bi-plus-circle"></i>
      新增文件大項類別
    </button>
  </div>

  <!-- 表單 -->
  <div class="table-responsive d-flex justify-content-center">
    <table class="table table-bordered text-center">
      <thead class="text-nowrap">
        <tr class="bg-table">
          <th scope="col">代號</th>
          <th scope="col">文件類別名稱</th>
          <th scope="col">管理單位</th>
          <th scope="col">修改</th>
          <th scope="col" v-if="uid == 'SUPER'">刪除</th>
        </tr>
      </thead>
      <tbody class="text-nowrap">
        <tr class="align-middle" v-for="item in ListData" :key="item.bcode">
          <td scope="row">{{ item.bcode }}</td>
          <td>{{ item.bname }}</td>
          <td>
            <select class="form-control">
              <option v-for="item2 in item.AccGroup_array" :key="item2">{{ branch_mapping(item2) }}
              </option>
            </select>
          </td>
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

  <!-- 新增文件大項類別 -->
  <form @submit.prevent="doAddList()" id="addForm" :class="{ 'was-validated': addwasValidated }"
    class="table-responsive" novalidate>
    <div class="modal fade" id="staticBackdropAdd" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
      aria-labelledby="staticBackdropAddLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="staticBackdropAddLabel">新增文件大項類別</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="table-responsive">
              <table class="table table-bordered">
                <tbody>
                  <tr>
                    <th class="bg-table align-middle text-center">代號</th>
                    <td><input type="text" class="form-control" placeholder="代號" v-model='addCode' required /></td>
                  </tr>
                  <tr>
                    <th class="bg-table align-middle text-center">文件類別名稱</th>
                    <td><input type="text" class="form-control" placeholder="文件類別名稱" v-model='addName' required /></td>
                  </tr>
                  <tr>
                    <th class="bg-table align-middle text-center">管理單位</th>
                    <td>
                      <select class="form-control" style="width: fit-content;display: inline;" placeholder="代建行"
                        v-model='addAccGroup'>
                        <option v-for="item in Branc_hList" :key="item.code" :value="item.code">{{ item.name }}</option>
                      </select>
                      <button type="button" class="btn btn-primary" @click="doAddAccGroupList">新增</button>
                    </td>
                  </tr>
                  <tr>
                    <th class="bg-table align-middle text-center">管理單位列表</th>
                    <td>
                      <select class="form-control" style="width: fit-content;display: inline;" placeholder="代建行"
                        v-model='addAccGroup_del'>
                        <option v-for="item in addAccGroupList" :key="item" :value="item">{{ branch_mapping(item) }}
                        </option>
                      </select>
                      <button type="button" class="btn btn-primary" @click="doAddAccGroupList_del">刪除</button>
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

  <!-- 修改文件大項類別 -->
  <form @submit.prevent="doModList()" id="addForm" :class="{ 'was-validated': modwasValidated }"
    class="table-responsive" novalidate>
    <div class="modal fade" id="staticBackdropMod" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
      aria-labelledby="staticBackdropModLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="staticBackdropModLabel">修改文件大項類別</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="table-responsive">
              <table class="table table-bordered">
                <tbody>
                  <tr>
                    <th class="bg-table align-middle text-center">代號</th>
                    <td><input type="text" class="form-control" placeholder="代號" v-model='modCode' disabled required/></td>
                  </tr>
                  <tr>
                    <th class="bg-table align-middle text-center">文件類別名稱</th>
                    <td><input type="text" class="form-control" placeholder="文件類別名稱" v-model='modName' required/></td>
                  </tr>
                  <tr>
                    <th class="bg-table align-middle text-center">管理單位</th>
                    <td>
                      <select class="form-control" style="width: fit-content;display: inline;" placeholder="代建行"
                        v-model='modAccGroup'>
                        <option v-for="item in Branc_hList" :key="item.code" :value="item.code">{{ item.name }}</option>
                      </select>
                      <button type="button" class="btn btn-primary" @click="doModAccGroupList">新增</button>
                    </td>
                  </tr>
                  <tr>
                    <th class="bg-table align-middle text-center">管理單位列表</th>
                    <td>
                      <select class="form-control" style="width: fit-content;display: inline;" placeholder="代建行"
                        v-model='modAccGroup_del'>
                        <option v-for="item in modAccGroupList" :key="item" :value="item">{{ branch_mapping(item) }}
                        </option>
                      </select>
                      <button type="button" class="btn btn-primary" @click="doModAccGroupList_del">刪除</button>
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
  <!-- 刪除文件大項類別 -->
  <div class=" modal fade" id="staticBackdropDel" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
              aria-labelledby="staticBackdropDelLabel" aria-hidden="true">
              <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title" id="staticBackdropDelLabel">刪除文件大項類別</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body">
                    <div class="table-responsive">
                      <table class="table table-bordered">
                        <tbody>
                          <tr>
                            <th class="bg-table align-middle text-center">代號</th>
                            <td><input type="text" class="form-control" placeholder="代號" v-model='delCode' disabled />
                            </td>
                          </tr>
                          <tr>
                            <th class="bg-table align-middle text-center">文件類別名稱</th>
                            <td><input type="text" class="form-control" placeholder="文件類別名稱" v-model='delName'
                                disabled /></td>
                          </tr>
                          <tr>
                            <th class="bg-table align-middle text-center">管理單位列表</th>
                            <td>
                              <select class="form-control" style="width: fit-content;display: inline;"
                                placeholder="代建行">
                                <option v-for="item in delAccGroupList" :key="item" :value="item">{{
                                    branch_mapping(item)
                                }}
                                </option>
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
