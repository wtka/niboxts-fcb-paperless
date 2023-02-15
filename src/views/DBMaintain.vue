<script lang="ts" setup>
import axios from 'axios';
import { Base64 } from 'js-base64';
import { Modal } from 'bootstrap';
import { ref, onMounted } from 'vue';
import { useMenuStore } from '@/store/menu';
import LoadingScreen from '@/components/LoadingScreen.vue';
import Pagination from '@/components/PageContainer.vue';

type db = {
  code: string;
  name: string;
  YearS: string;
  datasourcename: string;
  encdatapath: string,
  dbconfigpath: string;
  YearE: string;
  nistatus: string;
};

type json_db_query = {
  error: {
    Code: string;
    Message: string;
    Count?: string;
    totalpage?: string;
  }[];
  data: db[];
};

// menu 儲存區
const store = useMenuStore();

// Modal 實體
const addModal = ref();
const modModal = ref();
const isQuerying = ref(false);

// 查詢資料庫連線設定的資料
const dbData = ref<db[]>([]);

// 新增資料庫連線設定的資料
const addCode = ref('');
const addName = ref('');
const addYearS = ref('');
const addDataSourceName = ref('');
const addEncDataPath = ref('');
const addDBConfigPath = ref('');
const addYearE = ref('');
const addNistatus = ref('');

// 修改資料庫連線設定的資料
const modCode = ref('');
const modName = ref('');
const modYearS = ref('');
const modDataSourceName = ref('');
const modEncDataPath = ref('');
const modDBConfigPath = ref('');
const modYearE = ref('');
const modNistatus = ref('');

// 驗證樣式
const addWasValidated = ref(false);
const modWasValidated = ref(false);

// 驗證表單
const addForm = ref<HTMLFormElement>();
const modForm = ref<HTMLFormElement>();

// 當前頁面索引
const currentIndex = ref(0);

// 總分頁數
const totalPage = ref('1');

// 報表限制查詢筆數
const pageLimit = 10;

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
}

// 顯示新增視窗
function showAddPopup() {
  addModal.value.show();
}

// 隱藏新增視窗
function hideAddPopup() {
  // 清除新增資料
  clearAddData();
  addModal.value.hide();
  addWasValidated.value = false;
}

// 清除新增資料
function clearAddData() {
  addCode.value = '';
  addName.value = '';
  addYearS.value = '';
  addDataSourceName.value = '';
  addEncDataPath.value = '';
  addDBConfigPath.value = '';
  addYearE.value = '';
  addNistatus.value = '';
}

// 顯示修改視窗
function showModPopup(item: db) {
  // 同步資料
  modCode.value = item.code;
  modName.value = item.name;
  modYearS.value = item.YearS;
  modDataSourceName.value = item.datasourcename;
  modEncDataPath.value = item.encdatapath;
  modDBConfigPath.value = item.dbconfigpath;
  modYearE.value = item.YearE;
  modNistatus.value = item.nistatus.trim();

  // 顯示視窗
  modModal.value.show();
}

// 隱藏修改視窗
function hideModPopup() {
  modModal.value.hide();
  modWasValidated.value = false;
}

// 查詢資料庫連線設定 
async function queryDB() {
  let res: json_db_query;
  if (process.env.NODE_ENV == 'development') {
    const tmpres = await axios.get('/test/dbQuery.json', {
      responseType: 'json',
    });
    res = tmpres.data;
  } else {
    //post 參數設定
    let params = new URLSearchParams();
    params.append('optype', '0');

    // 查詢
    const tmpres = await axios.post('/nibox/dbconfig_mapping.jsp', params, {
      responseType: 'json',
    });
    res = tmpres.data;
  }

  let basic = res.error[0].Code;
  let message = res.error[0].Message;

  if (basic != '00000000') {
    throw new Error(`${basic}: ${message}`);
  }

  // 取得資料庫連線設定
  dbData.value = res.data;

  // 總分頁數
  totalPage.value = Math.ceil(dbData.value.length / pageLimit).toString();

  // 切換當前分頁
  currentIndex.value = 1;
}

// 新增資料庫連線設定
async function confirmData() {
  // 取得表單
  const form = addForm.value;
  if (form == null) throw new ReferenceError();

  // 新增驗證樣式
  addWasValidated.value = true;

  // 檢查表單內的元素是否驗證
  if (form.checkValidity()) {
    //查詢
    isQuerying.value = true;

    try {
      // response
      let res: json_db_query;

      //post 參數設定
      let params = new URLSearchParams();
      params.append('optype', '2');
      params.append('code', addCode.value);
      params.append('name', Base64.encode(addName.value));
      params.append('datasourcename', addDataSourceName.value);
      params.append('encdatapath', addEncDataPath.value);
      params.append('dbconfigpath', addDBConfigPath.value);
      params.append('YearS', addYearS.value);
      params.append('YearE', addYearE.value);
      params.append('nistatus', addNistatus.value);

      // 新增
      const tmpres = await axios.post('/nibox/dbconfig_mapping.jsp', params, {
        responseType: 'json',
      });
      res = tmpres.data;

      let basic = res.error[0].Code;
      let message = res.error[0].Message;

      if (basic != '00000000') {
        throw new Error(`${basic}: ${message}`);
      }

      // 查詢資料庫連線設定
      await queryDB();

      // 總分頁數
      totalPage.value = Math.ceil(dbData.value.length / pageLimit).toString();

      // 切換當前分頁
      changePageIndex(parseInt(totalPage.value));
    } catch (error) {
      let message = error;
      if (error instanceof Error) {
        message = error.message;
      }
      alert(`${message}`);
    } finally {
      isQuerying.value = false;
    }

    // 清空新增資料
    clearAddData();

    // 移除驗證樣式
    addWasValidated.value = false;

    // 隱藏 modal 視窗
    addModal.value.hide();
  }
}

// 修改資料庫連線設定
async function modifyData() {
  // 取得表單
  const form = modForm.value;
  if (form == null) throw new ReferenceError();

  // 新增驗證樣式
  modWasValidated.value = true;
  console.log('mod = ' + form.checkValidity());

  // 檢查表單內的元素是否驗證
  if (form.checkValidity()) {
    // 查詢
    isQuerying.value = true;

    try {
      let res: json_db_query;

      //post 參數設定
      let params = new URLSearchParams();
      params.append('optype', '3');
      params.append('code', modCode.value);
      params.append('name', Base64.encode(modName.value));
      params.append('datasourcename', modDataSourceName.value);
      params.append('encdatapath', modEncDataPath.value);
      params.append('dbconfigpath', modDBConfigPath.value);
      params.append('YearS', modYearS.value);
      params.append('YearE', modYearE.value);
      params.append('nistatus', modNistatus.value);

      // 修改
      const tmpres = await axios.post('/nibox/dbconfig_mapping.jsp', params, {
        responseType: 'json',
      });
      res = tmpres.data;

      let basic = res.error[0].Code;
      let message = res.error[0].Message;

      if (basic != '00000000') {
        throw new Error(`${basic}: ${message}`);
      }

      // 查詢資料庫連線設定
      await queryDB();
    } catch (error) {
      let message = error;
      if (error instanceof Error) {
        message = error.message;
      }
      alert(`${message}`);
    } finally {
      isQuerying.value = false;
    }

    // 移除驗證樣式
    modWasValidated.value = false;

    // 隱藏 modal 視窗
    modModal.value.hide();
  }
}

// 刪除資料庫連線設定
async function deleteData(code: string) {
  // 查詢
  isQuerying.value = true;

  try {
    let res: json_db_query;

    // post 參數設定
    let params = new URLSearchParams();
    params.append('optype', '4');
    params.append('code', code);

    // 刪除
    const tmpres = await axios.post('/nibox/dbconfig_mapping.jsp', params, {
      responseType: 'json',
    });
    res = tmpres.data;

    let basic = res.error[0].Code;
    let message = res.error[0].Message;

    if (basic != '00000000') {
      throw new Error(`${basic}: ${message}`);
    }

    // 查詢資料庫連線設定
    await queryDB();

    // 總分頁數
    totalPage.value = Math.ceil(dbData.value.length / pageLimit).toString();

    // 切換當前分頁
    changePageIndex(parseInt(totalPage.value));
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

// 切換分頁
function changePageIndex(index: number) {
  currentIndex.value = index;
}

onMounted(async () => {
  // 展開此頁面選單
  store.setMainMenuSelect('system_setting');
  store.setSubMenuSelect('ni4-9');

  // 初始化 Modal
  initModal();

  // 查詢
  isQuerying.value = true;

  try {
    // 查詢資料庫連線設定
    await queryDB();
  } catch (error) {
    let message = error;
    if (error instanceof Error) {
      message = error.message;
    }
    alert(`${message}`);
  } finally {
    isQuerying.value = false;
  }
});
</script>

<template>
  <!--loading-->
  <LoadingScreen message='處理中，請稍候...' :visible='isQuerying' />

  <!-- 頁面標題 -->
  <h1 class="text-center p-3">資料庫連線設定維護</h1>

  <!-- 功能按鈕 -->
  <div class="d-flex justify-content-end m-3">
    <button class="btn btn-primary" @click="showAddPopup()">
      <i class="bi bi-plus-circle"></i>
      新增連線設定
    </button>
  </div>

  <!-- 表單 -->
  <div class="table-responsive">
    <table class="table table-bordered text-center">
      <thead class="text-nowrap">
        <tr class="bg-table">
          <th scope="col">代號</th>
          <th scope="col">名稱</th>
          <th scope="col">DataSource 名稱</th>
          <th scope="col">年分 (起)</th>
          <th scope="col">年分 (訖)</th>
          <th scope="col">帳號密碼參數檔路徑</th>
          <th scope="col">資料庫設定檔路徑</th>
          <th scope="col">資料庫屬性</th>
          <th scope="col">修改</th>
          <th scope="col">刪除</th>
        </tr>
      </thead>
      <tbody class="text-nowrap">
        <tr class="align-middle" v-for="(item, index) in dbData" :key="item.code"
          v-show="index < (currentIndex * pageLimit) && index >= (currentIndex - 1) * pageLimit">
          <td scope="row">{{ item.code }}</td>
          <td>{{ item.name }}</td>
          <td>{{ item.datasourcename }}</td>
          <td>{{ item.YearS }}</td>
          <td>{{ item.YearE }}</td>
          <td>{{ item.encdatapath }}</td>
          <td>{{ item.dbconfigpath }}</td>
          <td>{{ item.nistatus }}</td>
          <td>
            <button class="btn border-0 rounded btn-icon" @click="showModPopup(item)">
              <i class="bi bi-pencil-square"></i>
            </button>
          </td>
          <td>
            <button class="btn border-0 rounded btn-icon" @click="deleteData(item.code)">
              <i class="bi bi-trash3"></i>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 新增資料庫連線設定 -->
  <form @submit.prevent="confirmData()" ref="addForm" :class="{ 'was-validated': addWasValidated }"
    class="table-responsive " oninput="chkPWD.setCustomValidity(chkPWD.value != PWD.value ? '密碼與確認密碼不符' : '')"
    novalidate>
    <div class=" modal fade" id="staticBackdropAdd" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
      aria-labelledby="staticBackdropAddLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="staticBackdropAddLabel">新增連線設定</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"
              @click="hideAddPopup()"></button>
          </div>
          <div class="modal-body">
            <div class="table-responsive">
              <div class="d-flex justify-content-center">
                <table class="table table-bordered" style="width: 90%;">
                  <tbody>
                    <tr>
                      <th class="bg-table align-middle text-center">代號</th>
                      <td>
                        <input type="text" class="form-control" placeholder="代號" v-model="addCode" maxlength="3"
                          required />
                        <div class="invalid-feedback mx-3">必須輸入代號</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">名稱</th>
                      <td>
                        <input type="text" class="form-control" placeholder="名稱" v-model="addName" required />
                        <div class="invalid-feedback mx-3">必須輸入名稱</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">DataSource 名稱</th>
                      <td>
                        <input type="text" class="form-control" placeholder="使用者帳號" v-model="addDataSourceName"
                          required />
                        <div class="invalid-feedback mx-3">必須輸入 DataSource 名稱</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">年分 (起)</th>
                      <td>
                        <input type="date" class="form-control" placeholder="年分 (起)" v-model="addYearS" required />
                        <div class="invalid-feedback mx-3">必須輸入年分</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">年分 (訖)</th>
                      <td>
                        <input type="date" class="form-control" placeholder="年分 (訖)" v-model="addYearE" required />
                        <div class="invalid-feedback mx-3">必須輸入年分</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">帳號密碼參數檔路徑</th>
                      <td>
                        <input type="text" class="form-control" placeholder="帳號密碼參數檔路徑" v-model="addEncDataPath"
                          required />
                        <div class="invalid-feedback mx-3">必須輸入帳號密碼參數檔路徑</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">資料庫設定檔路徑</th>
                      <td>
                        <input type="text" class="form-control" placeholder="資料庫設定檔路徑" v-model="addDBConfigPath"
                          required />
                        <div class="invalid-feedback mx-3">必須輸入資料庫設定檔路徑</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">資料庫屬性</th>
                      <td>
                        <select class="form-select" v-model="addNistatus" required>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                        </select>
                        <div class="invalid-feedback mx-3">必須輸入資料庫屬性</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="hideAddPopup()">取消</button>
            <button type="submit" class="btn btn-primary">確認</button>
          </div>
        </div>
      </div>
    </div>
  </form>

  <!-- 修改資料庫連線設定 -->
  <form ref="modForm" @submit.prevent="modifyData()" :class="{ 'was-validated': modWasValidated }"
    class="table-responsive " novalidate>
    <div class="modal fade" id="staticBackdropMod" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
      aria-labelledby="staticBackdropModLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="staticBackdropModLabel">修改連線設定</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"
              @click="hideModPopup()"></button>
          </div>
          <div class="modal-body">
            <div class="table-responsive">
              <div class="d-flex justify-content-center">
                <table class="table table-bordered" style="width: 90%;">
                  <tbody>
                    <tr>
                      <th class="bg-table align-middle text-center">代號</th>
                      <td>
                        <input type="text" class="form-control" placeholder="代號" v-model="modCode" maxlength="3"
                          required />
                        <div class="invalid-feedback mx-3">必須輸入代號</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">名稱</th>
                      <td>
                        <input type="text" class="form-control" placeholder="名稱" v-model="modName" required />
                        <div class="invalid-feedback mx-3">必須輸入名稱</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">DataSource 名稱</th>
                      <td>
                        <input type="text" class="form-control" placeholder="使用者帳號" v-model="modDataSourceName"
                          required />
                        <div class="invalid-feedback mx-3">必須輸入 DataSource 名稱</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">年分 (起)</th>
                      <td>
                        <input type="text" class="form-control" placeholder="民國年" v-model="modYearS" required />
                        <div class="invalid-feedback mx-3">必須輸入年分</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">年分 (訖)</th>
                      <td>
                        <input type="text" class="form-control" placeholder="民國年" v-model="modYearE" required />
                        <div class="invalid-feedback mx-3">必須輸入年分</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">帳號密碼參數檔路徑</th>
                      <td>
                        <input type="text" class="form-control" placeholder="帳號密碼參數檔路徑" v-model="modEncDataPath"
                          required />
                        <div class="invalid-feedback mx-3">必須輸入帳號密碼參數檔路徑</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">資料庫設定檔路徑</th>
                      <td>
                        <input type="text" class="form-control" placeholder="資料庫設定檔路徑" v-model="modDBConfigPath"
                          required />
                        <div class="invalid-feedback mx-3">必須輸入資料庫設定檔路徑</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">資料庫屬性</th>
                      <td>
                        <select class="form-select" v-model="modNistatus" required>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                        </select>
                        <div class="invalid-feedback mx-3">必須輸入資料庫屬性</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="hideModPopup()">取消</button>
            <button type="submit" class="btn btn-primary">確認</button>
          </div>
        </div>
      </div>
    </div>
  </form>

  <!-- 分頁 -->
  <div class="d-flex justify-content-end">
    <Pagination :queryCount="dbData.length" :currentIndex="currentIndex" :totalPage="totalPage"
      @change-page-index="changePageIndex" />
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