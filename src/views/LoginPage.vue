<script lang='ts' setup>
import axios from 'axios';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useLoginStore } from '@/store/login';
import { useMenuStore } from '@/store/menu';
import BannerBox from '@/components/BannerBox.vue';
import LoadingScreen from '@/components/LoadingScreen.vue';
import { Properties, doPost_Dbconfig_mapping } from '@/store/dbconfig_mapping';
import { QSD } from '@/store/QSD';

const router = useRouter();
const login = useLoginStore();
const menu = useMenuStore();
const username = ref('');
const password = ref('');
const isQuerying = ref(false);
const now_db_code = ref('');
const props = defineProps({
  nii: {
    type: String,
    default: '',
  },
});
// 檢查登入狀態
onMounted(async () => {
  if (login.verifyid != null) {
    // 已經登入，跳轉頁面
    await router.push({ path: '/menu-ni' });
  }
  if (props.nii.length != 0) {
    await do_autologin();
  }
});

// 登入
async function doLogin() {
  // 清除儲存區
  clearStore();

  const params = new URLSearchParams();
  params.append('nii', username.value);
  params.append('nip', password.value);
  isQuerying.value = true;

  try {
    // 發送請求並解析結果
    let doc: Document;

    if (process.env.NODE_ENV == 'development') {
      const resp = await axios.get('/test/verifyid_seal_db.xml', {
        responseType: 'document',
      });
      doc = resp.data;
    } else {
      const resp = await axios.post('/nibox/verifyid_seal_db.jsp', params, {
        responseType: 'document',
      });
      doc = resp.data;
    }

    if (doc == null) {
      throw new Error('伺服器回傳錯誤的資料格式');
    }

    const basic = doc.querySelector('error[name="Basic"]')?.textContent;
    const message = doc.querySelector('error[name="Message"]')?.textContent;

    // 0=正常 8=第一次 9=過期  8與9不會回正常資訊只能暫存uid
    if (basic !== '00000000' && basic !== '00000008' && basic !== '00000009') {
      throw new Error(`登入失敗: ${basic}\n${message}`);
    }
    if (basic == '00000000') {
      // 寫到儲存區
      const uid = doc.querySelector('UID')?.textContent || '';
      const uname = doc.querySelector('UNAME')?.textContent || '';
      const companycode = doc.querySelector('COMPANYCODE')?.textContent || '';
      const companycode1 = doc.querySelector('COMPANYCODE1')?.textContent || '';
      const uallowed = doc.querySelector('UALLOWED')?.textContent || '';
      const presetcontent = doc.querySelector('presetcontent')?.textContent || '';
      const coid = doc.querySelector('CoID')?.textContent || '';
      const coname = doc.querySelector('CoName')?.textContent || '';
      const cct = doc.querySelector('CCT')?.textContent || '';
      const uct = doc.querySelector('UCT')?.textContent || '';
      const docisf = doc.querySelector('DOCISF')?.textContent || '';
      const allowkeyinbranch = doc.querySelector('ALLOWKEYINBRNACH')?.textContent || '';
      const dbconfig = doc.querySelector('dbconfig')?.textContent || '';
      const HeadOffice = doc.querySelector('HeadOffice')?.textContent || '';
      const RQI = doc.querySelector('RQI')?.textContent || '';

      let ulevel: string;
      if (uallowed.indexOf('SSSU') != -1 || uallowed.indexOf('SDSU') != -1 || uallowed.indexOf('SCSU') != -1 || uallowed.indexOf('SHSU') != -1) {
        if (uname.toUpperCase() == 'SUPER') {
          ulevel = 'SUPER';
        } else {
          ulevel = 'SU';
        }
      } else if (uallowed.indexOf('SSUU') != -1 || uallowed.indexOf('SDUU') != -1 || uallowed.indexOf('SCUU') != -1 || uallowed.indexOf('SHUU') != -1) {
        ulevel = 'UU';
      } else {
        ulevel = 'USR';
      }

      login.verifyid = {
        uid,
        uname,
        companycode,
        companycode1,
        uallowed,
        ulevel,
        presetcontent,
        coid,
        coname,
        cct,
        uct,
        docisf,
        allowkeyinbranch,
        dbconfig,
        HeadOffice,
        RQI,
      };
      //提示文件未核數
      if (uallowed.indexOf('SDS3') != -1) {
        await chech_doc_unconfrirm();
      }
      //alert(login.verifyid.uallowed);
      // 登入成功，跳轉頁面
      await router.push({ path: '/menu-ni' });
    }
    // 第一次登入 需變更密碼
    if (basic == '00000008') {
      alert(message + '請變更密碼');
      await router.push({
        path: '/AppChangePW',
        query: { tempid: username.value },
      });
    }
    // 密碼已過期
    if (basic == '00000009') {
      alert(message + '請變更密碼');
      await router.push({
        path: '/AppChangePW',
        query: { tempid: username.value },
      });
    }
  } catch (error) {
    let message = error;
    if (error instanceof Error) {
      message = error.message;
    }
    alert(`登入過程中發生錯誤:\n${message}`);
  } finally {
    isQuerying.value = false;
  }
}

async function do_autologin() {
  // 清除儲存區
  clearStore();

  const params = new URLSearchParams();
  params.append('nii', props.nii);
  params.append('SSOMode', '9');
  isQuerying.value = true;

  try {
    // 發送請求並解析結果
    let doc: Document;

    if (process.env.NODE_ENV == 'development') {
      const resp = await axios.get('/test/verifyid_seal_db_inter.xml', {
        responseType: 'document',
      });
      doc = resp.data;
    } else {
      const resp = await axios.post('/nibox/verifyid_seal_db_inter.jsp', params, {
        responseType: 'document',
      });
      doc = resp.data;
    }

    if (doc == null) {
      throw new Error('伺服器回傳錯誤的資料格式');
    }

    const basic = doc.querySelector('error[name="Basic"]')?.textContent;
    const message = doc.querySelector('error[name="Message"]')?.textContent;

    // 0=正常 8=第一次 9=過期  8與9不會回正常資訊只能暫存uid
    if (basic !== '00000000' && basic !== '00000008' && basic !== '00000009') {
      throw new Error(`登入失敗: ${basic}\n${message}`);
    }
    if (basic == '00000000') {
      // 寫到儲存區
      const uid = doc.querySelector('UID')?.textContent || '';
      const uname = doc.querySelector('UNAME')?.textContent || '';
      const companycode = doc.querySelector('COMPANYCODE')?.textContent || '';
      const companycode1 = doc.querySelector('COMPANYCODE1')?.textContent || '';
      const uallowed = doc.querySelector('UALLOWED')?.textContent || '';
      const presetcontent = doc.querySelector('presetcontent')?.textContent || '';
      const coid = doc.querySelector('CoID')?.textContent || '';
      const coname = doc.querySelector('CoName')?.textContent || '';
      const cct = doc.querySelector('CCT')?.textContent || '';
      const uct = doc.querySelector('UCT')?.textContent || '';
      const docisf = doc.querySelector('DOCISF')?.textContent || '';
      const allowkeyinbranch = doc.querySelector('ALLOWKEYINBRNACH')?.textContent || '';
      const dbconfig = doc.querySelector('dbconfig')?.textContent || '';
      const HeadOffice = doc.querySelector('HeadOffice')?.textContent || '';
      const RQI = doc.querySelector('RQI')?.textContent || '';

      let ulevel: string;
      if (uallowed.indexOf('SSSU') != -1 || uallowed.indexOf('SDSU') != -1 || uallowed.indexOf('SCSU') != -1 || uallowed.indexOf('SHSU') != -1) {
        if (uname.toUpperCase() == 'SUPER') {
          ulevel = 'SUPER';
        } else {
          ulevel = 'SU';
        }
      } else if (uallowed.indexOf('SSUU') != -1 || uallowed.indexOf('SDUU') != -1 || uallowed.indexOf('SCUU') != -1 || uallowed.indexOf('SHUU') != -1) {
        ulevel = 'UU';
      } else {
        ulevel = 'USR';
      }

      login.verifyid = {
        uid,
        uname,
        companycode,
        companycode1,
        uallowed,
        ulevel,
        presetcontent,
        coid,
        coname,
        cct,
        uct,
        docisf,
        allowkeyinbranch,
        dbconfig,
        HeadOffice,
        RQI,
      };

      //提示文件未核數
      if (uallowed.indexOf('SDS3') != -1) {
        await chech_doc_unconfrirm();
      }

      //alert(login.verifyid.uallowed);
      // 登入成功，跳轉頁面
      await router.push({ path: '/menu-ni' });
    }
    // 第一次登入 需變更密碼
    if (basic == '00000008') {
      alert(message + '請變更密碼');
      await router.push({
        path: '/AppChangePW',
        query: { tempid: username.value },
      });
    }
    // 密碼已過期
    if (basic == '00000009') {
      alert(message + '請變更密碼');
      await router.push({
        path: '/AppChangePW',
        query: { tempid: username.value },
      });
    }
  } catch (error) {
    let message = error;
    if (error instanceof Error) {
      message = error.message;
    }
    alert(`登入過程中發生錯誤:\n${message}`);
  } finally {
    isQuerying.value = false;
  }
}

/** 查詢文件未核數 */
async function chech_doc_unconfrirm() {
  
  isQuerying.value = true;
  try {
    await query_dblist();
    if(now_db_code.value == ''){
      alert('查詢資料庫列表失敗，無法取得未核可資料');
    }
    const qsd = new QSD(location.protocol + '//' + location.host);
    qsd.multibranchdb = now_db_code.value;
    qsd.select('a.nilobid'); // 案件編號
    qsd.from('doc AS a');
    qsd.from('LEFT JOIN nimmalid AS b ON a.nilobid = b.slmainid AND a.niformat = b.res2');
    qsd.from('LEFT JOIN nipdata AS c ON b.slpersonid = c.niid');
    qsd.where('a.nistatus', '=', '0');
    await qsd.doQuery();
    console.log('unconfirm length' + qsd.results.length );
    if (qsd.results.length > 0) {
      alert( '尚有' + qsd.results.length + '筆文件未核可');
    }
  } catch (error) {
    let message = error;
    if (error instanceof Error) {
      message = error.message;
    }
    alert(`查詢未核可資料中發生錯誤:\n${message}`);
  }
  finally {
    isQuerying.value = false;
  }


}

async function query_dblist() {
  //查詢角色建立選單
  isQuerying.value = true;
  try {
    let params = new URLSearchParams();
    params.append('optype', '0');
    let tempres = await doPost_Dbconfig_mapping(params);
    let Code = tempres.error[0].Code;
    let message = tempres.error[0].Message;
    if (Code != '00000000') {

      throw new Error(`${Code}: ${message}`);
    }

    if (tempres.data == null) {
      throw new Error('伺服器回傳錯誤的資料格式');
    }
    tempres.data.forEach(function (i) {
      if (i.nistatus == '2') {//2為目前使用
        now_db_code.value = i.code;
      }
    });
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

// 重置儲存區
function clearStore() {
  login.reset();
  menu.reset();
}
</script>

<template>
  <!-- 處理中請稍候 -->
  <LoadingScreen message='處理中，請稍候...' :visible='isQuerying' />
  <!-- 導覽列 -->
  <BannerBox />
  <!-- 登入視窗 -->
  <section class="container py-5 h-100">
    <div class="row d-flex justify-content-center align-items-center h-100">
      <div class="col-12 col-md-8 col-lg-6 col-xl-5">
        <div class="card" @keyup.enter="doLogin">
          <div class="card-body p-5 text-center">
            <h1 class="mb-5">通用表單影像管理系統</h1>
            <div class="form-outline mb-4">
              <input type="text" class="form-control form-control-lg" placeholder='請輸入使用者代號' v-model="username" />
            </div>
            <div class="form-outline mb-4">
              <input type="password" class="form-control form-control-lg" placeholder='請輸入密碼' v-model="password" />
            </div>
            <button type="button" class="btn btn-primary btn-lg btn-block" @click="doLogin">登入</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>