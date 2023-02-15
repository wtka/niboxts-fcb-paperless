<script lang="ts" setup>
import axios from 'axios';
import { Base64 } from 'js-base64';
import { Modal } from 'bootstrap';
import { ref, onMounted } from 'vue';
import { useMenuStore } from '@/store/menu';
import LoadingScreen from '@/components/LoadingScreen.vue';
import Pagination from '@/components/PageContainer.vue';

type ftp = {
  code: string;
  name: string;
  userid: string;
  pwd: string;
  checkpwd: string,
  ftpip: string;
  ftpfold: string;
  port: string;
  type: string;
  explicit: string;
};

type json_ftp_query = {
  error: {
    Code: string;
    Message: string;
    Count?: string;
    totalpage?: string;
  }[];
  data: ftp[];
};

// menu 儲存區
const store = useMenuStore();

// Modal 實體
const addModal = ref();
const modModal = ref();
const isQuerying = ref(false);

// 查詢 FTP 設定的資料
const ftpData = ref<ftp[]>([]);

// 新增 FTP 設定的資料
const addCode = ref('');
const addName = ref('');
const addUserID = ref('');
const addPWD = ref('');
const addCheckPwd = ref('');
const addFTPIp = ref('');
const addFTPFold = ref('');
const addPort = ref('');
const addType = ref('');
const addExplicit = ref('');

// 修改 FTP 設定的資料
const modCode = ref('');
const modName = ref('');
const modUserID = ref('');
const modPWD = ref('');
const modFTPIp = ref('');
const modFTPFold = ref('');
const modPort = ref('');
const modType = ref('');
const modExplicit = ref('');

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
  addUserID.value = '';
  addPWD.value = '';
  addCheckPwd.value = '';
  addFTPIp.value = '';
  addFTPFold.value = '';
  addPort.value = '';
  addType.value = '';
  addExplicit.value = '';
}

// 顯示修改視窗
function showModPopup(item: ftp) {
  // 同步資料
  modCode.value = item.code;
  modName.value = item.name;
  modUserID.value = item.userid;
  modPWD.value = item.pwd;
  modFTPIp.value = item.ftpip;
  modFTPFold.value = item.ftpfold;
  modPort.value = item.port;

  // 傳輸類型
  if (item.explicit == '隱含') modExplicit.value = '0';
  if (item.explicit == '外顯') modExplicit.value = '1';

  // 傳輸類型
  if (item.type == 'FTP') modType.value = '0';
  else if (item.type == 'FTPS') modType.value = '1';
  else if (item.type == 'SFTP') modType.value = '2';

  // 顯示視窗
  modModal.value.show();
}

// 隱藏修改視窗
function hideModPopup() {
  modModal.value.hide();
  modWasValidated.value = false;
}

// 查詢 FTP 連線設定 
async function queryFTP() {
  let res: json_ftp_query;
  if (process.env.NODE_ENV == 'development') {
    const tmpres = await axios.get('/test/ftpQuery.json', {
      responseType: 'json',
    });
    res = tmpres.data;
  } else {
    //post 參數設定
    let params = new URLSearchParams();
    params.append('optype', '0');

    // 查詢
    const tmpres = await axios.post('/nibox/ftp_mapping.jsp', params, {
      responseType: 'json',
    });
    res = tmpres.data;
  }

  let basic = res.error[0].Code;
  let message = res.error[0].Message;

  if (basic != '00000000') {
    throw new Error(`${basic}: ${message}`);
  }

  // 轉換代號為中文字
  res.data.forEach((item) => {
    // 傳輸
    if (item.explicit == '0') item.explicit = '隱含';
    else if (item.explicit == '1') item.explicit = '外顯';

    // 傳輸類型
    if (item.type == '0') item.type = 'FTP';
    else if (item.type == '1') item.type = 'FTPS';
    else if (item.type == '2') item.type = 'SFTP';
  });

  // 取得 FTP 連線設定
  ftpData.value = res.data;

  // 總分頁數
  totalPage.value = Math.ceil(ftpData.value.length / pageLimit).toString();

  // 切換當前分頁
  currentIndex.value = 1;
}

// 新增 FTP 連線設定
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
      let res: json_ftp_query;

      //post 參數設定
      let params = new URLSearchParams();
      params.append('optype', '2');
      params.append('code', addCode.value);
      params.append('name', Base64.encode(addName.value));
      params.append('userid', addUserID.value);
      params.append('pwd', addPWD.value);
      params.append('ftpip', addFTPIp.value);
      params.append('ftpfold', addFTPFold.value);
      params.append('port', addPort.value);
      params.append('explicit', addExplicit.value);

      // 傳輸類型
      let tmpType = '';
      if (addType.value == '0') tmpType = 'FTP';
      else if (addType.value == '1') tmpType = 'FTPS';
      else if (addType.value == '2') tmpType = 'SFTP';
      params.append('type', tmpType);

      // 新增
      const tmpres = await axios.post('/nibox/ftp_mapping.jsp', params, {
        responseType: 'json',
      });
      res = tmpres.data;

      let basic = res.error[0].Code;
      let message = res.error[0].Message;

      if (basic != '00000000') {
        throw new Error(`${basic}: ${message}`);
      }

      // 查詢 FTP 連線設定
      await queryFTP();

      // 總分頁數
      totalPage.value = Math.ceil(ftpData.value.length / pageLimit).toString();

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

// 修改 FTP 連線設定
async function modifyData() {
  // 取得表單
  const form = modForm.value;
  if (form == null) throw new ReferenceError();

  // 新增驗證樣式
  modWasValidated.value = true;

  // 檢查表單內的元素是否驗證
  if (form.checkValidity()) {
    // 查詢
    isQuerying.value = true;

    try {
      let res: json_ftp_query;

      //post 參數設定
      let params = new URLSearchParams();
      params.append('optype', '3');
      params.append('code', modCode.value);
      params.append('name', Base64.encode(modName.value));
      params.append('userid', modUserID.value);
      params.append('pwd', modPWD.value);
      params.append('ftpip', modFTPIp.value);
      params.append('ftpfold', modFTPFold.value);
      params.append('port', modPort.value);
      params.append('explicit', modExplicit.value);

      // 傳輸類型
      let tmpType = '';
      if (modType.value == '0') tmpType = 'FTP';
      else if (modType.value == '1') tmpType = 'FTPS';
      else if (modType.value == '2') tmpType = 'SFTP';
      params.append('type', tmpType);

      // 修改
      const tmpres = await axios.post('/nibox/ftp_mapping.jsp', params, {
        responseType: 'json',
      });
      res = tmpres.data;

      let basic = res.error[0].Code;
      let message = res.error[0].Message;

      if (basic != '00000000') {
        throw new Error(`${basic}: ${message}`);
      }

      // 查詢 FTP 連線設定
      await queryFTP();
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

// 刪除 FTP 連線設定
async function deleteData(code: string) {
  // 查詢
  isQuerying.value = true;

  try {
    let res: json_ftp_query;

    //post 參數設定
    let params = new URLSearchParams();
    params.append('optype', '4');
    params.append('code', code);

    // 刪除
    const tmpres = await axios.post('/nibox/ftp_mapping.jsp', params, {
      responseType: 'json',
    });
    res = tmpres.data;

    let basic = res.error[0].Code;
    let message = res.error[0].Message;

    if (basic != '00000000') {
      throw new Error(`${basic}: ${message}`);
    }

    // 查詢 FTP 連線設定
    await queryFTP();

    // 總分頁數
    totalPage.value = Math.ceil(ftpData.value.length / pageLimit).toString();

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
  store.setSubMenuSelect('ni4-8');

  // 初始化 Modal
  initModal();

  // 查詢
  isQuerying.value = true;

  try {
    // 查詢 FTP 連線設定
    await queryFTP();
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
  <h1 class="text-center p-3">FTP 連線設定維護</h1>

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
          <th scope="col">使用者帳號</th>
          <!-- <th scope="col">密碼</th> -->
          <th scope="col">FTP IP</th>
          <th scope="col">FTP 目錄</th>
          <th scope="col">連接埠</th>
          <th scope="col">傳輸協定</th>
          <th scope="col">傳輸類型</th>
          <th scope="col">修改</th>
          <th scope="col">刪除</th>
        </tr>
      </thead>
      <tbody class="text-nowrap">
        <tr class="align-middle" v-for="(item, index) in ftpData" :key="item.code"
          v-show="index < (currentIndex * pageLimit) && index >= (currentIndex - 1) * pageLimit">
          <td scope="row">{{ item.code }}</td>
          <td>{{ item.name }}</td>
          <td>{{ item.userid }}</td>
          <!-- <td>{{ item.pwd }}</td> -->
          <td>{{ item.ftpip }}</td>
          <td>{{ item.ftpfold }}</td>
          <td>{{ item.port }}</td>
          <td>{{ item.explicit }}</td>
          <td>{{ item.type }}</td>
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

  <!-- 新增 FTP 連線設定 -->
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
                      <th class="bg-table align-middle text-center">使用者帳號</th>
                      <td>
                        <input type="text" class="form-control" placeholder="使用者帳號" v-model="addUserID" required />
                        <div class="invalid-feedback mx-3">必須輸入使用者帳號</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">密碼</th>
                      <td>
                        <input name="PWD" type="password" class="form-control" placeholder="密碼" v-model="addPWD"
                          required />
                        <div class="invalid-feedback mx-3">必須輸入密碼</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">確認密碼</th>
                      <td>
                        <input name="chkPWD" type="password" class="form-control" placeholder="確認密碼"
                          v-model="addCheckPwd" required />
                        <div v-if="addCheckPwd == ''" class="invalid-feedback mx-3">必須輸入確認密碼</div>
                        <div v-if="addPWD !== addCheckPwd" class="invalid-feedback mx-3">密碼與確認密碼不符</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">FTP IP</th>
                      <td>
                        <input type="text" class="form-control" placeholder="FTP IP" v-model="addFTPIp" required />
                        <div class="invalid-feedback mx-3">必須輸入 FTP IP</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">FTP 目錄</th>
                      <td>
                        <input type="text" class="form-control" placeholder="FTP 目錄" v-model="addFTPFold" required />
                        <div class="invalid-feedback mx-3">必須輸入 FTP 目錄</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">連接埠</th>
                      <td>
                        <input type="text" class="form-control" placeholder="連接埠" v-model="addPort" required />
                        <div class="invalid-feedback mx-3">必須輸入連接埠</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">傳輸協定</th>
                      <td>
                        <select class="form-select" v-model="addExplicit" required>
                          <option value="0">隱含</option>
                          <option value="1">外顯</option>
                        </select>
                        <div class="invalid-feedback mx-3">必須輸入傳輸協定</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">傳輸類型</th>
                      <td>
                        <select class="form-select" v-model="addType" required>
                          <option value="0">FTP</option>
                          <option value="1">FTPS</option>
                          <option value="2">SFTP</option>
                        </select>
                        <div class="invalid-feedback mx-3">必須輸入傳輸類型</div>
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

  <!-- 修改 FTP 連線設定 -->
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
                        <input type="text" class="form-control" placeholder="代號" v-model="modCode" disabled />
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
                      <th class="bg-table align-middle text-center">使用者帳號</th>
                      <td>
                        <input type="text" class="form-control" placeholder="使用者帳號" v-model="modUserID" required />
                        <div class="invalid-feedback mx-3">必須輸入使用者帳號</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">密碼</th>
                      <td>
                        <input type="password" class="form-control" placeholder="密碼" v-model="modPWD" required />
                        <div class="invalid-feedback mx-3">必須輸入密碼</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">FTP IP</th>
                      <td>
                        <input type="text" class="form-control" placeholder="FTP IP" v-model="modFTPIp" required />
                        <div class="invalid-feedback mx-3">必須輸入 FTP IP</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">FTP 目錄</th>
                      <td>
                        <input type="text" class="form-control" placeholder="FTP 目錄" v-model="modFTPFold" required />
                        <div class="invalid-feedback mx-3">必須輸入 FTP 目錄</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">連接埠</th>
                      <td>
                        <input type="text" class="form-control" placeholder="連接埠" v-model="modPort" required />
                        <div class="invalid-feedback mx-3">必須輸入連接埠</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">傳輸協定</th>
                      <td>
                        <select class="form-select" v-model="modExplicit" required>
                          <option value="0">隱含</option>
                          <option value="1">外顯</option>
                        </select>
                        <div class="invalid-feedback mx-3">必須輸入傳輸協定</div>
                      </td>
                    </tr>
                    <tr>
                      <th class="bg-table align-middle text-center">傳輸類型</th>
                      <td>
                        <select class="form-select" v-model="modType" required>
                          <option value="0">FTP</option>
                          <option value="1">FTPS</option>
                          <option value="2">SFTP</option>
                        </select>
                        <div class="invalid-feedback mx-3">必須輸入傳輸類型</div>
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
    <Pagination :queryCount="ftpData.length" :currentIndex="currentIndex" :totalPage="totalPage"
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