<script lang="ts" setup>
import axios from 'axios';
import { Base64 } from 'js-base64';
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useMenuStore } from '@/store/menu';
import { useLoginStore } from '@/store/login';
import { doPost_niusers , NiusersItem } from '@/store/niusers';
import LoadingScreen from '@/components/LoadingScreen.vue';
import Pagination from '@/components/PageContainer.vue';
import { Have_Full_Width, Have_CH } from '@/ts/comm';
import { MainDocList , doPost_businessidBDoc_mapping } from '@/store/businessidBDoc_mapping';

const login = useLoginStore();
const ulevel = computed(() => (login.verifyid?.ulevel || ''));
const ugroup = ref<type_nigroup[]>([]);
const queryselect = ref(true);
const queryFinish = ref(false);
const isModUser = ref(false);
const Moditem = ref<NiusersItem>();
//const Moditem_old = ref<NiusersItem>();
const store = useMenuStore();
const isQuerying = ref(false);
const queryUserName = ref('');
const current_page_index = ref(1);
const total_page = ref('1');
const niroletype = ref('');
const uid = computed(() => (login.verifyid?.uid || ''));
const uname = computed(() => (login.verifyid?.uname || ''));
const companycode = computed(() => (login.verifyid?.companycode || ''));
const data_count = ref(0);
const ListData = reactive<List>({ data: [] });
let ListLength = ref(0);
const Moditem_ugroup = ref('');
const Moditem_uid = ref('');
const Moditem_uname = ref('');
const Moditem_companycode = ref('');
const Moditem_MainDocList = ref<string[]>([]);
const MainDocListData = ref<MainDocList[]>([]);
const isNoData = ref(false);//無資料欄位;





type jsonres_nigroup = {
  error: {
    Code: string;
    Message: string;
    Count?: string;
  }[];
  data: type_nigroup[];
}

type type_nigroup = {
    nirole: string;
    niroletype: string;
    nigroup: string;
    hiddenflag: string;
}


type List = {
  data: NiusersItem[];
};

function openModUser(useritem: NiusersItem) {
  //將點擊的資料深度拷貝到修改頁面(不深度拷貝你在修改頁面修改的資料 會影響到清單中的'顯示資料')
  Moditem.value = JSON.parse(JSON.stringify(useritem));//deep copy
  //Moditem_old.value = useritem;
  queryFinish.value = false;
  isModUser.value = true;
  queryselect.value = false;
  Moditem_ugroup.value = useritem.ugroup;
  Moditem_uid.value = useritem.uid;
  Moditem_uname.value = useritem.uname;
  Moditem_companycode.value = useritem.companycode;

  for(let i = 0; i < useritem.mbusinesscode.split('_').length; i++){
    Moditem_MainDocList.value.push(useritem.mbusinesscode.split('_')[i]);
  }

}

function backToList() {
  //關閉修改頁面回到清單
  queryFinish.value = true;
  isModUser.value = false;
  queryselect.value = false;
  Moditem_MainDocList.value = [];
}

function backToQuery() {
  //關閉清單頁面回到查詢頁
  queryselect.value = true;
  queryFinish.value = false;
  isModUser.value = false;
}

async function queryList(query_page: number) {
  //查詢清單 queryUserName = uid 不輸入查全部
  isNoData.value = false; //無資料隱藏
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
  ListData.data.length = 0;
  isQuerying.value = true;
  if (niroletype.value == '') {
    alert('權限錯誤');
    return;
  }
  let query_ugroup = ':::EMP:::';
  //let query_ugroup = '';
  for (let i = 0; i < ugroup.value.length; i++) {
    if (query_ugroup != '') {
      query_ugroup += '_';
    }
    query_ugroup += ugroup.value[i].nirole;
  }
  if(query_ugroup == ''){
    query_ugroup = ':::EMP:::';
  }
  try {
    //post 參數設定
    let params = new URLSearchParams();
    params.append('optype', '1');
    params.append('pages', query_page.toString());
    params.append('companycode', companycode.value);//限定查自己分行 但不顯示分行別
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
      isNoData.value = true; //無資料顯示
    }
    let totalpage = tempres.error[0].totalpage;
    if (tempres.data == null || count == null || totalpage == null) {
      throw new Error('伺服器回傳錯誤的資料格式');
    }

    ListData.data = tempres.data;
    queryselect.value = false;
    queryFinish.value = true;
    total_page.value = totalpage;
    if (total_page.value == '0') {
      total_page.value = '1';
    }
    ListLength.value = ListData.data.length;
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



async function queryAccess2() {
  /*修改與建立使用者需判斷權限
  有三種權限SU>>UU>>USR
  ugroup = 選擇角色用的option清單
  */
  switch (ulevel.value) {
    case 'SUPER':
      niroletype.value = 'SU';
      break;
    case 'SU':
      niroletype.value = 'UU';
      break;
    case 'UU':
      niroletype.value = 'USR';
      break;
    case 'USR':
      niroletype.value = '';
      break;
    default:
      niroletype.value = '';
      break;
  }
  if (niroletype.value == '') {
    alert('權限錯誤');
    return;
  }
  
  isQuerying.value = true;
  try {
    let params = new URLSearchParams();
    params.append('optype', '0');
    params.append('niroletype', niroletype.value);

    let res: jsonres_nigroup;
    if (process.env.NODE_ENV == 'development') {
      const resp = await axios.get('test/nigroup.json', {
        responseType: 'json',
      });
      res = resp.data;
    } else {
      const resp = await axios.post('/nibox/nigroup.jsp', params, {
        responseType: 'json',
      });
      res = resp.data;
    }

    let code = res.error[0].Code;
    if (code != '00000000') {
      throw new Error('查詢角色錯誤，無法取得群組名稱');
    }

    if (res.data == null) {
      throw new Error('伺服器回傳錯誤的資料格式');
    }

    ugroup.value = res.data;
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

async function delUser() {
  //刪除使用者 參數僅需uid
  let temp_uid = Moditem.value?.uid || '';
  if (temp_uid == '') {
    alert('參數錯誤');
    return;
  }

  isQuerying.value = true;
  try {
    let params = new URLSearchParams();
    params.append('optype', '4');
    params.append('uid', temp_uid);
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

async function modUser() {
  //刪除使用者 參數僅需uid
  let temp_uid = Moditem.value?.uid || '';
  let temp_uname = Moditem.value?.uname || '';
  let temp_ugroup = Moditem.value?.ugroup || '';
  let temp_companycode = Moditem.value?.companycode || '';
  let temp_mbusinesscode = Moditem.value?.mbusinesscode || '';

  if (temp_uid == '') {
    alert('參數錯誤,ID不可為空');
    return;
  }
  if (temp_uname == '') {
    alert('參數錯誤,使用者姓名不可為空');
    return;
  }

  isQuerying.value = true;
  try {
    //post 參數設定
    let params = new URLSearchParams();
    params.append('optype', '3');
    params.append('uid', temp_uid);
    params.append('uname', Base64.encode(Moditem_uname.value));
    params.append('ugroup', Base64.encode(Moditem_ugroup.value));
    params.append('companycode', Moditem_companycode.value);
    params.append('olduname', Base64.encode(temp_uname));
    params.append('oldcompanycode', temp_companycode);
    params.append('oldugroup', Base64.encode(temp_ugroup));
    params.append('loginUserID', uid.value);
    params.append('loginUserName', Base64.encode(uname.value)); //server need base64
    let Moditem_MainDocList_string = '';
    for(let i = 0; i < Moditem_MainDocList.value.length;i++){
      
      if(Moditem_MainDocList.value[i] != ''){
        if(Moditem_MainDocList_string  != ''){
          Moditem_MainDocList_string += '_';
        }
        Moditem_MainDocList_string += Moditem_MainDocList.value[i];
      }
    }
    if(Moditem_MainDocList_string == ''){
      alert('至少需要一項授權');
      return;
    }
    params.append('mbusinesscode', Moditem_MainDocList_string);
    params.append('oldmbusinesscode', temp_mbusinesscode);

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


async function query_MainDocList() {
  //post 參數設定
  let params = new URLSearchParams();
  params.append('optype', '0');
  let tempres = await doPost_businessidBDoc_mapping(params);
  MainDocListData.value = tempres.data;
}

async function changePageIndex(index: number) {
  current_page_index.value = index;
  await queryList(current_page_index.value);
}

function clear_queryUserName() {
  queryUserName.value = '';
}



onMounted(async () => {
  //查詢初始化
  isQuerying.value = true;
  await queryAccess2();//初始化角色清單
  await query_MainDocList();//初始化文件大類
  isQuerying.value = false;
  // 展開此頁面選單
  store.setMainMenuSelect('user_setting');
  store.setSubMenuSelect('ni2-2');
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
  <h1 class="text-center p-3">使用者授權</h1>

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
            <th scope="col">使用者帳號</th>
            <th scope="col">使用者姓名</th>
            <th scope="col">分行別</th>
            <th scope="col">建立日期</th>
            <th scope="col">群組名稱</th>
            <th scope="col">狀態</th>
          </tr>
        </thead>
        <tbody class="text-nowrap">
          <tr class="align-middle" v-for="item in ListData.data" :key="item.uid">
            <td class="pointer" style="width:20%" scope="row" @click="openModUser(item)">{{ item.uid }}</td>
            <td class="pointer" scope="row" @click="openModUser(item)">{{ item.uname }}</td>
            <td class="pointer" @click="openModUser(item)">{{ item.companycode }}</td>
            <td class="pointer" @click="openModUser(item)">{{ item.udate }}</td>
            <td class="pointer" @click="openModUser(item)">{{ item.ugroup }}</td>
            <td class="pointer" @click="openModUser(item)" v-if="item.niApproveStatus != 'ok'">
              {{ item.niApproveStatus }}
            </td>
            <td class="pointer" @click="openModUser(item)" v-if="item.niApproveStatus == 'ok'">正常</td>
          </tr>
          <tr  v-if="isNoData"><td colspan="6">查無資料</td></tr>
        </tbody>
      </table>
    </div>
    <!-- 分頁 -->
    <div class="d-flex justify-content-end">
      <Pagination :queryCount="ListLength" :currentIndex="current_page_index" :totalPage="total_page"
        @change-page-index="changePageIndex" />
    </div>
  </div>

  <!-- 註銷使用者 -->
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
                  v-model='Moditem_uname' />
              </td>
            </tr>
            <tr>
              <th class="bg-table align-middle text-center" scope="row">分行別</th>
              <td><input type="text" class="form-control" maxlength="60" placeholder="分行別"
                  v-model='Moditem_companycode' :disabled="true" />
              </td>
            </tr>
            <tr>
              <th class="bg-table align-middle text-center" scope="row">群組名稱</th>
              <td>
                <select name="nigroup" class="form-select" v-model='Moditem_ugroup'>
                  <option v-for="item in ugroup" :key="item.nirole" :value='item.nirole'>{{ item.nirole }}</option>
                </select>
              </td>
            </tr>
            <tr>
              <th class="bg-table align-middle text-center" scope="row">文件大項類別授權</th>
              <td>
                <div v-for="item_inner in MainDocListData" :key="item_inner.bname">
                  <input type="checkbox" name="nigroup0" class="form-check-input mt-0 mx-2 align-middle" :value="item_inner.bcode" v-model="Moditem_MainDocList" />{{ item_inner.bname }}
                </div>
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
