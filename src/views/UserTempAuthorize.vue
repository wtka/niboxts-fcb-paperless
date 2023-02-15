<script lang="ts" setup>
import axios from 'axios';
import { Base64 } from 'js-base64';
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useMenuStore } from '@/store/menu';
import { useLoginStore } from '@/store/login';
import LoadingScreen from '@/components/LoadingScreen.vue';
import Pagination from '@/components/PageContainer.vue';
import { Have_Full_Width, Have_CH , res4Mapping } from '@/ts/comm';
import { doPost_niusers , NiusersItem } from '@/store/niusers';

const login = useLoginStore();
const ugroup = ref<type_nigroup>({ data: [] });
const queryselect = ref(true);
const queryFinish = ref(false);
const isModUser = ref(false);
const Moditem = ref<NiusersItem>();
const store = useMenuStore();
const isQuerying = ref(false);
const queryUserName = ref('');
const current_page_index = ref(1);
const total_page = ref('1');
const uid = computed(() => (login.verifyid?.uid || ''));
const uname = computed(() => (login.verifyid?.uname || ''));
const data_count = ref(1);//有BUG
const ListData = ref<NiusersItem[]>([]);
const Moditem_ugroup = ref('');
const Moditem_uid = ref('');
const Moditem_uname = ref('');
const Moditem_companycode = ref('');
const isNoData = ref(false);//無資料欄位;


type type_nigroup = {
  data: {
    nirole: string;
    niroletype: string;
    nigroup: string;
    hiddenflag: string;
  }[];
}


function openModUser(useritem: { uid: string, ugroup: string, companycode: string, uname: string, ustatus: string, res4: string }) {
  //將點擊的資料深度拷貝到修改頁面(不深度拷貝你在修改頁面修改的資料 會影響到清單中的'顯示資料')
  Moditem.value = JSON.parse(JSON.stringify(useritem));//deep copy
  //Moditem_old.value[0] = useritem;
  queryFinish.value = false;
  isModUser.value = true;
  queryselect.value = false;
  Moditem_ugroup.value = useritem.ugroup;
  Moditem_uid.value = useritem.uid;
  Moditem_uname.value = useritem.uname;
  Moditem_companycode.value = useritem.companycode;
}

function backToQuery() {
  //關閉清單頁面回到查詢頁
  queryselect.value = true;
  queryFinish.value = false;
  isModUser.value = false;
}

async function queryList(query_page: number) {
  //查詢清單 queryUserName = uid 不輸入查全部
  isNoData.value = false;//無資料隱藏
  if (query_page < 1) {
    alert('頁數不可小於1');
    return;
  }
  if (query_page > parseInt(total_page.value)) {
    alert('頁數不可大於最大頁數');
    return;
  }
  if (query_page == 0) {
    return;
  }
  ListData.value = [];
  isQuerying.value = true;
  let query_ugroup = '';
  for (let i = 0; i < ugroup.value.data.length; i++) {
    if (query_ugroup != '') {
      query_ugroup += '_';
    }
    query_ugroup += ugroup.value.data[i].nirole;
  }
  try {
    //post 參數設定
    let params = new URLSearchParams();
    params.append('optype', '1');
    params.append('pages', query_page.toString());
    params.append('ugroup', Base64.encode(query_ugroup));//先用niroletype查可以改的角色 送角色中文 以底線'_' 串 把該角色的使用者查出來 =>轉base64
    params.append('ipage', '10');//一頁10筆

    if (queryUserName.value != '') {
      params.append('uid', queryUserName.value);
    }

    let tempres = await doPost_niusers(params);
    let basic = tempres.error[0].Code;
    let message = tempres.error[0].Message;
    if (basic != '00000000') {
      throw new Error(`${basic}: ${message}`);
    }

    let count = tempres.error[0].Count || '';
    if (parseInt(count)  == 0) {
      isNoData.value = true;//無資料顯示
    }
    let totalpage = tempres.error[0].totalpage;
    if (tempres.data == null || count == null || totalpage == null) {
      throw new Error('伺服器回傳錯誤的資料格式');
    }

    ListData.value = tempres.data;
    queryselect.value = false;
    queryFinish.value = true;
    total_page.value = totalpage;
    if (total_page.value == '0') {
      total_page.value = '1';
    }
    data_count.value = parseInt(count);
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

async function modUser() {
  //刪除使用者 參數僅需uid
  let temp_uid = Moditem.value?.uid || '';
  let temp_uname = Moditem.value?.uname || '';
  let temp_ugroup = Moditem.value?.ugroup || '';
  let temp_companycode = Moditem.value?.companycode || '';

  if (temp_uid == '') {
    alert('參數錯誤,ID不可為空');
    return;
  }
  if (temp_uname == '') {
    alert('參數錯誤,使用者姓名不可為空');
    return;
  }
  if (temp_companycode == '') {
    alert('參數錯誤,分行別不可為空');
    return;
  }

  isQuerying.value = true;
  try {
    //post 參數設定
    let params = new URLSearchParams();
    params.append('optype', '3');
    params.append('uid', temp_uid);
    params.append('uname', Base64.encode(Moditem_uname.value));
    if(Moditem_ugroup.value != ''){
      params.append('ugroup', Base64.encode(Moditem_ugroup.value));
    }
    else{
      params.append('ugroup', Base64.encode(':::del:::'));
    }
    params.append('companycode', Moditem_companycode.value);
    params.append('olduname', Base64.encode(temp_uname));
    params.append('oldcompanycode', temp_companycode);
    params.append('oldugroup', Base64.encode(temp_ugroup));
    params.append('loginUserID', uid.value);
    params.append('loginUserName', Base64.encode(uname.value)); //server need base64

    let tempres = await doPost_niusers(params);
    let basic = tempres.error[0].Code;
    let message = tempres.error[0].Message;
    if (basic != '00000000') {
      throw new Error(`${basic}: ${message}`);
    }

    await queryList(current_page_index.value);//刪除成功後保持查詢頁 並刷新
    backToList();//關閉修改頁
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

function clear_queryUserName() {
  queryUserName.value = '';
}

function backToList() {
  //關閉修改頁面回到清單
  queryFinish.value = true;
  isModUser.value = false;
  queryselect.value = false;
}


onMounted(async () => {
  // 展開此頁面選單
  store.setMainMenuSelect('user_setting');
  store.setSubMenuSelect('ni2-4');
});


watch(() => queryUserName.value, (newValue, oldValue) => {
  if (Have_Full_Width(newValue)) {
    queryUserName.value = oldValue;
  }
  if (Have_CH(newValue)) {
    queryUserName.value = oldValue;
  }
});
</script>
<template>
  <!--loading-->
  <LoadingScreen message='處理中，請稍候...' :visible='isQuerying' />

  <!-- 頁面標題 -->
  <h1 class="text-center p-3">查詢可授權之使用者資料</h1>

  <!-- 查詢選擇 -->
  <div v-if="queryselect">
    <div class="table-responsive">
      <div class="d-flex justify-content-center">
        <table class="table table-bordered" style="width: 80%;">
          <tbody>
            <!-- <tr>
              <th class="text-center" colspan="2" scope="row">尋找/更改目標</th>
            </tr> -->
            <tr>
              <th class="bg-table align-middle text-center">使用者帳號(不輸入表示查詢全部)</th>
              <td><input type="text" class="form-control" maxlength="20" placeholder="使用者帳號" v-model='queryUserName' />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- 功能按鈕 -->
      <div class="d-flex justify-content-center mb-3">
        <button type="button" class="btn btn-secondary btn-lg me-5" @click="queryList(1)">查詢</button>
        <button type="button" class="btn btn-primary btn-lg" @click="clear_queryUserName()">清除</button>
      </div>
    </div>
  </div>

  <!-- 查詢完成 -->
  <div v-show="queryFinish">
    <!-- 功能按鈕 -->
    <div class="d-flex justify-content-end m-3">
      <button class="btn btn-primary" @click="backToQuery()">
        <i class="bi bi-arrow-clockwise"></i>
        重新查詢
      </button>
    </div>

    <!-- 表單 -->
    <div class="table-responsive d-flex justify-content-center">
      <table class="table table-bordered text-center">
        <thead class="text-nowrap">
          <tr class="bg-table">
            <th scope="col">使用者代號</th>
            <th scope="col">使用者姓名</th>
            <th scope="col">HR階層</th>
            <th scope="col">角色權限</th>
            <th scope="col">狀態</th>
            <th scope="col">執行</th>
          </tr>
        </thead>
        <tbody class="text-nowrap">
          <tr class="align-middle" v-for="item in ListData" :key="item.uid">
            <td  style="width:20%" scope="row" >{{ item.uid }}</td>
            <td  scope="row" >{{ item.uname }}</td>
            <td  >{{ res4Mapping(item.res4) }}</td>
            <td  >{{ item.ugroup }}</td>
            <td   v-if="item.ustatus != '1'">
              {{ item.ustatus }}
            </td>
            <td   v-if="item.ustatus == '1'">
              已登入
            </td>
            <td ><button @click="openModUser(item)">查看</button></td>
          </tr>
          <tr v-if="isNoData"><td  colspan="6">查無資料</td></tr>
        </tbody>
      </table>
    </div>
    <!-- 分頁 -->
    <div class="d-flex justify-content-end">
      <Pagination :queryCount="data_count" :currentIndex="current_page_index" :totalPage="total_page"
        @change-page-index="changePageIndex" />
    </div>
  </div>
  <div v-if="isModUser">
    <!-- 功能按鈕 -->
    <div class="d-flex justify-content-end m-3">
      <button class="btn btn-primary" @click="backToList()">
        <i class="bi bi-arrow-clockwise"></i>
        回上頁
      </button>
    </div>

    <!-- 表單 -->
    <div class="table-responsive">
      <div class="d-flex justify-content-center">
        <table class="table table-bordered" style="width: 80%;">
          <tbody>
            <!-- <tr>
              <th class="text-center" colspan="2" scope="row">尋找/更改目標</th>
            </tr> -->
            <tr>
              <th class="bg-table align-middle text-center" scope="row">使用者帳號</th>
              <td><input type="text" class="form-control" placeholder="使用者帳號" v-model="Moditem_uid"  disabled />
              </td>
            </tr>
            <tr>
              <th class="bg-table align-middle text-center" scope="row">使用者姓名</th>
              <td><input type="text" class="form-control" maxlength="60" placeholder="使用者姓名"
                  v-model='Moditem_uname' :disabled="true" />
              </td>
            </tr>
            <tr>
              <th class="bg-table align-middle text-center" scope="row">分行別</th>
              <td><input type="text" class="form-control" maxlength="60" placeholder="分行別"
                  v-model='Moditem_companycode' :disabled="true" />
              </td>
            </tr>
            <tr>
              <th class="bg-table align-middle text-center" scope="row">使用者權限</th>
              <td>
                <select name="nigroup" class="form-select" v-model='Moditem_ugroup'>
                  <option value=''>無權限</option>
                  <option value='最高授權管理者'>最高授權管理者</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- 功能按鈕 -->
      <div class="d-flex justify-content-center mb-3">
        <button type="button" class="btn btn-primary btn-lg" @click="modUser()">確認儲存</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.pointer {
  cursor: pointer;
}

.bg-table {
  background: lightgray
}
</style>
