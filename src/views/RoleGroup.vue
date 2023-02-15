<script lang="ts" setup>
import axios from 'axios';
import { Modal } from 'bootstrap';
import { Base64 } from 'js-base64';
import { ref, reactive, onMounted, computed } from 'vue';
import { useMenuStore } from '@/store/menu';
import { useLoginStore } from '@/store/login';
import LoadingScreen from '@/components/LoadingScreen.vue';
import { doPost_niusers , NiusersItem } from '@/store/niusers';
import { Nirole_data , doPost_nigroup } from '@/store/nigroup';

const store = useMenuStore();
const Del_nirole = ref('');
const Del_niroletype = ref('');
const Del_nigroup = ref('');
const Del_nigroup_array = ref([]);
const Mod_nirole = ref('');
const Mod_niroletype = ref('');
const Mod_nigroup = ref('');
const Mod_nigroup_array = ref([]);
const isQuerying = ref(false);
const login = useLoginStore();
const ulevel = computed(() => (login.verifyid?.ulevel || ''));
const NiroleData = ref<Nirole_data[]>([]);
const addgroupNirole = ref('');
const addgroupNiroletype = ref('');
const addgroupNigroup = ref([]);
const addModal = ref();
const modModal = ref();
const delModal = ref();
const isNoData = ref(false);//無資料欄位;


type jsonres_accessto = {
  error: {
    Code: string;
    Message: string;
    Count?: string;
  }[];
  data?: accessto[];
};


type Nigroup = {
  nirole: string;
  niroletype: string;
  nigroup: string;
  hiddenflag: string;
  nigroup_array?: string[];
};

type accessto = {
    code: string;
    niright: string;
    nigroup: string;
    hiddenflag: string;
};

const tempAccess = ref<accessto[]>([]);

function showAddGroup() {
  //顯示 新增視窗
  addModal.value.show();
}

function hideAddGroup() {
  //隱藏 新增視窗
  addModal.value.hide();
}

function showModGroup(item: Nigroup) {
  //設定 修改參數(deep copy) 顯示修改畫面
  Mod_nirole.value = JSON.parse(JSON.stringify(item.nirole));
  Mod_niroletype.value = JSON.parse(JSON.stringify(item.niroletype));
  Mod_nigroup.value = JSON.parse(JSON.stringify(item.nigroup));
  Mod_nigroup_array.value = JSON.parse(JSON.stringify(item.nigroup_array));
  modModal.value.show();
}

function hideModGroup() {
  //清空 修改參數(deep copy) 隱藏修改畫面
  Mod_nirole.value = '';
  Mod_niroletype.value = '';
  Mod_nigroup.value = '';
  Mod_nigroup_array.value = [];
  modModal.value.hide();
}

function showDelGroup(item: Nigroup) {
  //設定 刪除參數(deep copy) 顯示刪除畫面
  Del_nirole.value = JSON.parse(JSON.stringify(item.nirole));
  Del_niroletype.value = JSON.parse(JSON.stringify(item.niroletype));
  Del_nigroup.value = JSON.parse(JSON.stringify(item.nigroup));
  Del_nigroup_array.value = JSON.parse(JSON.stringify(item.nigroup_array));
  delModal.value.show();
}

function hideDelGroup() {
  //清空 修改參數(deep copy) 隱藏刪除畫面
  Del_nirole.value = '';
  Del_niroletype.value = '';
  Del_nigroup.value = '';
  Del_nigroup_array.value = [];
  delModal.value.hide();
}

async function doPost_accessto(params: URLSearchParams) {
  // 發送請求並回傳結果
  let res: jsonres_accessto;
  if (process.env.NODE_ENV == 'development') {
    const resp = await axios.get('test/accessto.json', {
      responseType: 'json',
    });
    res = resp.data;
  } else {
    const resp = await axios.post('/nibox/accessto.jsp', params, {
      responseType: 'json',
    });
    res = resp.data;
  }
  return res;
}

async function query_Accessto() {
  //查詢權限清單
  tempAccess.value.length = 0;
  //查詢初始化
  isQuerying.value = true;
  try {
    //post 參數設定
    let params = new URLSearchParams();
    params.append('optype', '0');

    let tempres = await doPost_accessto(params);
    let basic = tempres.error[0].Code;
    let message = tempres.error[0].Message;
    if (basic != '00000000') {
      throw new Error(`${basic}: ${message}`);
    }

    if (tempres.data == null) {
      throw new Error('伺服器回傳錯誤的資料格式');
    }

    tempAccess.value = tempres.data;
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

async function queryNirole() {
  //查詢角色建立選單
  isNoData.value = false; //無資料隱藏
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
    let count = tempres.error[0].Count || '';
    if (parseInt(count)  == 0) {
      isNoData.value = true;//無資料顯示
    }
    NiroleData.value = tempres.data;
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
  for (let i = 0; i < NiroleData.value.length; i++) {
    let temp_array = [];
    for (let j = 0; j < NiroleData.value[i].nigroup.split('_').length; j++) {
      temp_array.push(NiroleData.value[i].nigroup.split('_')[j]);
    }
    NiroleData.value[i].nigroup_array = temp_array;
  }
}


async function doAddGroup() {
  if (addgroupNirole.value == '') {
    alert('參數錯誤,群組名稱不可為空');
    return;
  }
  if (addgroupNiroletype.value == '') {
    alert('參數錯誤,權限不可為空');
    return;
  }
  let temp_nigroup = '';
  for (let i = 0; i < addgroupNigroup.value.length; i++) {
    if (temp_nigroup != '') {
      temp_nigroup += '_';
    }
    temp_nigroup += addgroupNigroup.value[i];
  }
  if (temp_nigroup == '') {
    alert('參數錯誤,群組角色不可為空');
    return;
  }
  //新增群組
  isQuerying.value = true;
  try {
    let params = new URLSearchParams();
    params.append('optype', '2');
    params.append('nirole', Base64.encode(addgroupNirole.value));
    params.append('nigroup', Base64.encode(temp_nigroup));
    params.append('niroletype', addgroupNiroletype.value);
    params.append('hiddenflag', '');

    let tempres = await doPost_nigroup(params);
    let basic = tempres.error[0].Code;
    let message = tempres.error[0].Message;
    if (basic != '00000000') {
      throw new Error(`${basic}: ${message}`);
    }

    hideAddGroup();
    await queryNirole();
    addgroupNirole.value = '';//清空欄位
    addgroupNigroup.value = [];
    addgroupNiroletype.value = '';
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

async function doDelGroup() {
  //刪除群組


  isQuerying.value = true;
  try {
    //檢查是否有使用者為該群組
    let params_check_group = new URLSearchParams();
    params_check_group.append('optype', '1');
    params_check_group.append('ugroup', Base64.encode(Del_nirole.value));
    let tempres_check_group = await doPost_niusers(params_check_group);
    let basic_check_group = tempres_check_group.error[0].Code;
    let message_check_group = tempres_check_group.error[0].Message;
    if (basic_check_group != '00000000') {
      throw new Error(`${basic_check_group}: ${message_check_group}`);
    }
    if (tempres_check_group.data?.length != 0) {
      alert('尚有使用者為此群組，無法刪除此群組');
      return;
    }
    //
    let params = new URLSearchParams();
    params.append('optype', '4');
    params.append('nirole', Base64.encode(Del_nirole.value));

    let tempres = await doPost_nigroup(params);
    let basic = tempres.error[0].Code;
    let message = tempres.error[0].Message;
    if (basic != '00000000') {
      throw new Error(`${basic}: ${message}`);
    }

    hideDelGroup();
    await queryNirole();
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

async function doModGroup() {
  if (Mod_nirole.value == '') {
    alert('參數錯誤,群組名稱不可為空');
    return;
  }
  if (Mod_niroletype.value == '') {
    alert('參數錯誤,權限不可為空');
    return;
  }
  let temp_nigroup = '';
  for (let i = 0; i < Mod_nigroup_array.value.length; i++) {//將array轉成底線串的形式  [1,2,3]  ==> '1_2_3'
    if (temp_nigroup != '') {
      temp_nigroup += '_';
    }
    temp_nigroup += Mod_nigroup_array.value[i];
  }
  if (temp_nigroup == '') {
    alert('參數錯誤,群組角色不可為空');
    return;
  }
  //修改群組
  isQuerying.value = true;
  try {
    let params = new URLSearchParams();
    params.append('optype', '3');
    params.append('nirole', Base64.encode(Mod_nirole.value));
    params.append('nigroup', Base64.encode(temp_nigroup));
    params.append('niroletype', Mod_niroletype.value);
    params.append('hiddenflag', '');

    let tempres = await doPost_nigroup(params);
    let basic = tempres.error[0].Code;
    let message = tempres.error[0].Message;
    if (basic != '00000000') {
      throw new Error(`${basic}: ${message}`);
    }

    hideModGroup();
    await queryNirole();
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

  // 初始化權限
  await query_Accessto();

  // 查詢群組清單
  await queryNirole();

  // 展開此頁面選單
  store.setMainMenuSelect('user_setting');
  store.setSubMenuSelect('ni2-3');
});
</script>
<template>
  <!--loading-->
  <LoadingScreen message='處理中，請稍候...' :visible='isQuerying' />

  <!-- 頁面標題 -->
  <h1 class="text-center p-3">角色設定</h1>

  <!-- 功能按鈕 -->
  <div class="d-flex justify-content-end m-3">
    <button class="btn btn-primary" @click="showAddGroup()">
      <i class="bi bi-plus-circle"></i>
      新增群組
    </button>
  </div>

  <!-- 表單 -->
  <div class="table-responsive d-flex justify-content-center">
    <table class="table table-bordered text-center">
      <thead class="text-nowrap">
        <tr class="bg-table">
          <th scope="col">群組名稱</th>
          <th scope="col">角色權限</th>
          <th scope="col">功能</th>
          <th scope="col">修改</th>
          <th scope="col">刪除</th>
        </tr>
      </thead>
      <tbody class="text-nowrap">
        <tr class="align-middle" v-for="item in NiroleData" :key="item.nirole">
          <td scope="row">{{ item.nirole }}</td>
          <td>
            <select class="form-select" :value="item.niroletype" disabled>
              <option value="SU">系統管理者</option>
              <option value="UU">帳號管理員</option>
              <option value="USR">一般使用者</option>
            </select>
          </td>
          <td class="text-start">
            <div class="my-3" v-for="item_inner in tempAccess" :key="item_inner.nigroup">
              <input type="checkbox" class="form-check-input mt-0 mx-2 align-middle" :value="item_inner.nigroup"
                v-model="item.nigroup_array" disabled />
              <span>{{ item_inner.nigroup }}</span>
            </div>
          </td>
          <td>
            <button class="btn border-0 rounded btn-icon" @click="showModGroup(item)">
              <i class="bi bi-pencil-square"></i>
            </button>
          </td>
          <td>
            <button class="btn border-0 rounded btn-icon" @click="showDelGroup(item)">
              <i class="bi bi-trash3"></i>
            </button>
          </td>
        </tr>
        <tr v-if="isNoData" ><td colspan="5">查無資料</td></tr>
      </tbody>
    </table>
  </div>

  <!-- 分頁 -->
  <!-- <div class="d-flex justify-content-end">
    <Pagination :currentIndex="current_page_index" :totalPage="total_page" @change-page-index="changePageIndex" />
  </div> -->

  <!-- 新增群組 -->
  <div class="modal fade" id="staticBackdropAdd" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
    aria-labelledby="staticBackdropAddLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="staticBackdropAddLabel">新增群組</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="table-responsive">
            <table class="table table-bordered">
              <tbody>
                <tr>
                  <th class="bg-table align-middle text-center">群組名稱</th>
                  <td><input type="text" class="form-control" maxlength="60" placeholder="群組名稱"
                      v-model='addgroupNirole' /></td>
                </tr>
                <tr>
                  <th class="bg-table align-middle text-center">角色權限</th>
                  <td>
                    <select class="form-select" v-model="addgroupNiroletype">
                      <option value="SU">系統管理者</option>
                      <option value="UU">帳號管理員</option>
                      <option value="USR">一般使用者</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <th class="bg-table align-middle text-center">功能</th>
                  <td>
                    <div class="my-3" v-for="item_inner in tempAccess" :key="item_inner.nigroup">
                      <label>
                        <input type="checkbox" class="form-check-input mt-0 mx-2 align-middle"
                          :value="item_inner.nigroup" v-model="addgroupNigroup" />
                        <span class="align-middle">{{ item_inner.nigroup }}</span>
                      </label>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="hideAddGroup()">取消</button>
          <button type="button" class="btn btn-primary" @click="doAddGroup()">確認</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 修改群組 -->
  <div class="modal fade" id="staticBackdropMod" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
    aria-labelledby="staticBackdropModLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="staticBackdropModLabel">修改群組</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="table-responsive">
            <table class="table table-bordered">
              <tbody>
                <tr>
                  <th class="bg-table align-middle text-center">群組名稱</th>
                  <td><input type="text" class="form-control" maxlength="60" placeholder="群組名稱" v-model='Mod_nirole' disabled="true" />
                  </td>
                </tr>
                <tr>
                  <th class="bg-table align-middle text-center">角色權限</th>
                  <td>
                    <select class="form-select" v-model="Mod_niroletype">
                      <option value="SU">系統管理者</option>
                      <option value="UU">帳號管理員</option>
                      <option value="USR">一般使用者</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <th class="bg-table align-middle text-center">功能</th>
                  <td>
                    <div class="my-3" v-for="item_inner in tempAccess" :key="item_inner.nigroup">
                      <input type="checkbox" class="" :value="item_inner.nigroup" v-model="Mod_nigroup_array" />
                      <span>{{ item_inner.nigroup }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="hideModGroup()">取消</button>
          <button type="button" class="btn btn-primary" @click="doModGroup()">確認</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 刪除群組 -->
  <div class="modal fade" id="staticBackdropDel" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
    aria-labelledby="staticBackdropDelLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="staticBackdropDelLabel">修改群組</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="table-responsive">
            <table class="table table-bordered">
              <tbody>
                <tr>
                  <th class="bg-table align-middle text-center">群組名稱</th>
                  <td><input type="text" class="form-control" maxlength="60" placeholder="群組名稱" v-model='Del_nirole' disabled="true" />
                  </td>
                </tr>
                <tr>
                  <th class="bg-table align-middle text-center">角色權限</th>
                  <td>
                    <select class="form-select" v-model="Del_niroletype" disabled="true">
                      <option value="SU">系統管理者</option>
                      <option value="UU">帳號管理員</option>
                      <option value="USR">一般使用者</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <th class="bg-table align-middle text-center">功能</th>
                  <td>
                    <div class="my-3" v-for="item_inner in tempAccess" :key="item_inner.nigroup">
                      <input type="checkbox" class="" :value="item_inner.nigroup" v-model="Del_nigroup_array" disabled="true" />
                      <span>{{ item_inner.nigroup }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="hideDelGroup()">取消</button>
          <button type="button" class="btn btn-primary" @click="doDelGroup()">確認</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.bg-table {
  background: lightgray
}
</style>
