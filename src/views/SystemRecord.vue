<script lang="ts" setup>
import axios from 'axios';
import { ref, computed, onMounted } from 'vue';
import { useMenuStore } from '@/store/menu';
import { useLoginStore } from '@/store/login';
import LoadingScreen from '@/components/LoadingScreen.vue';
import Pagination from '@/components/PageContainer.vue';
import { DateDiff, date_check_comparator, date_check_year } from '@/ts/comm';

type system = {
  Index: string;
  optype: string;
  res6: string;
  sludate: string;
  sluser: string;
};

type json_system_query = {
  Code: string;
  Message: string;
  PostDataCount?: string;
  PostDatas: system[];
};

// 查詢分行各時段掃描量統計表
const systemData = ref<system[]>([]);

// 使用 Menu 的儲存區
const store = useMenuStore();

// 使用 Login 的儲存區
const login = useLoginStore();

// 驗證樣式
const wasValidated = ref(false);

// 是否查詢中
const isQuerying = ref(false);

// 判斷查詢介面是否顯示
const queryForm = ref(true);

// 判斷查詢結果介面是否顯示
const queryResult = ref(false);

// 今天日期
let today = new Date();

// 起訖日期的今天日期
let beginToday: string, endToday: string;
beginToday = today.toISOString().split('T')[0];
endToday = today.toISOString().split('T')[0];

// 起訖日期
const beginDate = ref(beginToday);
const endDate = ref(endToday);

// 日期區間
const RQI = computed(() => (login.verifyid?.RQI || ''));

// 當前頁面索引
const currentIndex = ref(0);

// 總分頁數
const totalPage = ref('1');

// 報表限制查詢筆數
const pageLimit = 10;

// PDF URL
const pdfURL = ref('');

// EXCEL URL
const excelURL = ref('');

// 無資料
const isNoData = ref(false);

// 操作者
const sluser = ref('');

// 執行動作 1
const optype1 = ref('');

// 執行動作 2
const optype2 = ref('');

// 遮罩
const isMask = ref(false);

// 查詢報表
async function query() {
  if (!date_check_comparator(beginDate.value, endDate.value)) {
    alert('截止日期必須大於起始日');
    return;
  }
  if (DateDiff(new Date(endDate.value), new Date(beginDate.value)) > parseInt(RQI.value)) {
    alert('日期區間不可大於' + RQI.value + '日');
    return;
  }
  if (!date_check_year(beginDate.value)) {
    alert('西元年不得小於1901或大於9999');
    return;
  }
  if (!date_check_year(endDate.value)) {
    alert('西元年不得小於1901或大於9999');
    return;
  }

  //查詢初始化
  systemData.value = [];

  // 無資料隱藏
  isNoData.value = false;

  // 取得表單
  const form = document.forms[0];

  // 新增驗證樣式
  wasValidated.value = true;

  // 檢查表單內的元素是否驗證
  if (form.checkValidity()) {
    // 顯示查詢中
    isQuerying.value = true;

    try {
      let res: json_system_query;
      //post 參數設定
      const maskStr = (isMask.value) ? '1' : '0';
      let params = new URLSearchParams();
      params.append('OPAction', 'query');
      params.append('sluser', sluser.value);
      params.append('optype1', optype1.value);
      params.append('optype2', optype2.value);
      params.append('sludate1', beginDate.value.replaceAll('-', ''));
      params.append('sludate2', endDate.value.replaceAll('-', ''));
      params.append('mask', maskStr);

      // 查詢
      const tmpres = await axios.post('/nibox/OneBank/SystemSetupRecord.jsp', params, {
        responseType: 'json',
      });
      res = tmpres.data;

      let code = res.Code;
      let message = res.Message;

      if (code != '00000000' && code != '00000005') {
        throw new Error(`${code}: ${message}`);
      }

      if (code == '00000005') {
        res.PostDatas = [];
        totalPage.value = '0';
        isNoData.value = true;
      }

      if (res.PostDatas == null) {
        throw new Error('伺服器回傳錯誤的資料格式');
      }

      // Pdf 參數
      let params_pdf = new URLSearchParams();
      params_pdf.append('OPAction', 'printPDF');
      params_pdf.append('sluser', sluser.value);
      params_pdf.append('optype1', optype1.value);
      params_pdf.append('optype2', optype2.value);
      params_pdf.append('sludate1', beginDate.value.replaceAll('-', ''));
      params_pdf.append('sludate2', endDate.value.replaceAll('-', ''));
      params_pdf.append('mask', maskStr);
      pdfURL.value = '/nibox/OneBank/SystemSetupRecord.jsp?' + params_pdf;

      // Excel 參數
      let params_excel = new URLSearchParams();
      params_excel.append('OPAction', 'printEXCEL');
      params_excel.append('sluser', sluser.value);
      params_excel.append('optype1', optype1.value);
      params_excel.append('optype2', optype2.value);
      params_excel.append('sludate1', beginDate.value.replaceAll('-', ''));
      params_excel.append('sludate2', endDate.value.replaceAll('-', ''));
      params_excel.append('mask', maskStr);
      excelURL.value = '/nibox/OneBank/SystemSetupRecord.jsp?' + params_excel;

      // 掃描結果
      systemData.value = res.PostDatas;

      // 總分頁數
      totalPage.value = Math.ceil(systemData.value.length / pageLimit).toString();
      // 切換當前分頁
      currentIndex.value = 1;
      // 隱藏查詢畫面
      queryForm.value = false;
      // 顯示查詢結果
      queryResult.value = true;
    } catch (error) {
      let message = error;
      if (error instanceof Error) {
        message = error.message;
      }
      alert(`${message}`);
    } finally {
      // 隱藏查詢中
      isQuerying.value = false;
    }
  }
}

// 列印 PDF
function printPDF() {
  window.open(pdfURL.value);
}

// 下載 Excel
function downLoadExcel() {
  window.open(excelURL.value);
}

// 切換分頁
function changePageIndex(index: number) {
  currentIndex.value = index;
}

// 重新查詢
function backToQuery() {
  queryForm.value = true;
  queryResult.value = false;
  wasValidated.value = false;
}

// 初始化
onMounted(() => {
  // 設定選單預設值
  optype1.value = '0';
  optype2.value = '0';

  // 展開此頁面選單
  store.setMainMenuSelect('system_report');
  store.setSubMenuSelect('ni3-9');
});
</script>

<template>
  <!--loading-->
  <LoadingScreen message='處理中，請稍候...' :visible='isQuerying' />

  <!-- 頁面標題 -->
  <h1 class="text-center p-3">系統設定紀錄表</h1>

  <!-- 查詢表單 -->
  <form v-show="queryForm" @submit.prevent="query()" :class="{ 'was-validated': wasValidated }"
    class="table-responsive " novalidate>
    <div class="d-flex justify-content-center">
      <table class="table table-bordered" style="width: 80%;">
        <tbody>
          <tr>
            <th class="bg-table align-middle text-center">操作者</th>
            <td>
              <input type="text" class="form-control" maxlength="20" v-model='sluser' />
            </td>
          </tr>
          <tr>
            <th class="bg-table align-middle text-center">執行動作</th>
            <td>
              <div class="d-flex">
                <div class="w-100">
                  <select class="form-select" v-model="optype1" required>
                    <option value="0">全部</option>
                    <option value="1">角色設定</option>
                    <option value="6">角色設定核可</option>
                    <option value="7">角色設定不核可</option>
                    <option value="4">分行別代號維護</option>
                    <option value="5">前置作業設定</option>
                    <option value="8">FTP設定代號</option>
                    <option value="9">資料庫設定代號</option>
                    <option value="10">文件類別大類代號</option>
                    <option value="11">白名單代號</option>
                  </select>
                  <div class="invalid-feedback mx-3">必須輸入執行動作 1</div>
                </div>
                <span class="mx-3 mt-1">-</span>
                <div class="w-100">
                  <select class="form-select" v-model="optype2" required>
                    <option value="0">全部</option>
                    <option value="Add">新增</option>
                    <option value="Delete">刪除</option>
                    <option value="Update">修改</option>
                  </select>
                  <div class="invalid-feedback mx-3">必須輸入執行動作 2</div>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <th class="bg-table align-middle text-center">執行日期時間</th>
            <td>
              <div class="d-flex">
                <div class="w-100">
                  <input type="date" max="9999-12-31" class="form-control" v-model='beginDate' required />
                  <div class="invalid-feedback mx-3">必須輸入起始日期</div>
                </div>
                <span class="mx-3 mt-1">-</span>
                <div class="w-100">
                  <input type="date" max="9999-12-31" class="form-control" v-model='endDate' required />
                  <div class="invalid-feedback mx-3">必須輸入截止日期</div>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <th class="bg-table align-middle text-center">是否遮罩</th>
            <td>
              <input type="checkbox" class="form-check-input" v-model="isMask" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- 功能按鈕 -->
    <div class="d-flex justify-content-center mb-3">
      <button type="submit" class="btn btn-primary btn-lg">送出</button>
    </div>
  </form>

  <!-- 查詢結果表單 -->
  <div v-show="queryResult">
    <!-- 功能按鈕 -->
    <div class="d-flex justify-content-end m-3">
      <button class="btn btn-primary me-3" @click="printPDF()">
        <i class="bi bi-file-text"></i>
        列印PDF
      </button>
      <button class="btn btn-primary me-3" @click="downLoadExcel()">
        <i class="bi bi-file-text"></i>
        下載EXCEL
      </button>
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
            <th scope="col">序號</th>
            <th scope="col">執行動作</th>
            <th scope="col">資料狀態</th>
            <th scope="col">執行日期時間</th>
            <th scope="col">操作者</th>
          </tr>
        </thead>
        <tbody class="text-nowrap">
          <tr class="align-middle" v-for="(item, Index) in systemData" :key="item.Index"
            v-show="Index < (currentIndex * pageLimit) && Index >= (currentIndex - 1) * pageLimit">
            <td scope="row">{{ item.Index }}</td>
            <td>{{ item.optype }}</td>
            <td>{{ item.res6 }}</td>
            <td>{{ item.sludate }}</td>
            <td>{{ item.sluser }}</td>
          </tr>
          <tr v-if="isNoData">
            <td colspan="11">查無資料</td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- 分頁 -->
    <div class="d-flex justify-content-end">
      <Pagination :queryCount="systemData.length" :currentIndex="currentIndex" :totalPage="totalPage"
        @change-page-index="changePageIndex" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.bg-table {
  background: lightgray
}
</style>