import { defineStore } from 'pinia';
import { computed, Ref } from 'vue';
import { useLoginStore } from '@/store/login';
import router from '@/router';
import axios from 'axios';

const login = useLoginStore();
const uallowed = computed(() => login.verifyid?.uallowed || '');

export type MenuState = {
  menu: {
    id: string;
    title: string;
    visible: Ref<boolean>;
    selected: boolean;
    pages: {
      id: string;
      title: string;
      visible: Ref<boolean>;
      selected: boolean;
      callback?: () => void;
    }[];
  }[];
};

export const useMenuStore = defineStore('menu', {
  state: (): MenuState => ({
    menu: [
      {
        id: 'ad_function',
        title: '廣告功能',
        visible: computed(() => true),
        selected: false,
        pages: [
          {
            id: 'ni1-1',
            title: '檔案管理',
            visible: computed(() => true),
            selected: false,
          },
          {
            id: 'ni1-2',
            title: '廣告管理',
            visible: computed(() => true),
            selected: false,
          },
        ],
      },
      {
        id: 'user_setting',
        title: '使用者管理',
        visible: computed(
          () =>
            uallowed.value.indexOf('SSSU') != -1 ||
            uallowed.value.indexOf('SDSU') != -1 ||
            uallowed.value.indexOf('SCSU') != -1 ||
            uallowed.value.indexOf('SHSU') != -1 ||
            uallowed.value.indexOf('SSUU') != -1 ||
            uallowed.value.indexOf('SDUU') != -1 ||
            uallowed.value.indexOf('SCUU') != -1 ||
            uallowed.value.indexOf('SHUU') != -1,
        ),
        selected: false,
        pages: [
          {
            id: 'ni2-2',
            title: '使用者授權',
            visible: computed(
              () =>
                uallowed.value.indexOf('SSSU') != -1 ||
                uallowed.value.indexOf('SDSU') != -1 ||
                uallowed.value.indexOf('SCSU') != -1 ||
                uallowed.value.indexOf('SHSU') != -1 ||
                uallowed.value.indexOf('SSUU') != -1 ||
                uallowed.value.indexOf('SDUU') != -1 ||
                uallowed.value.indexOf('SCUU') != -1 ||
                uallowed.value.indexOf('SHUU') != -1,
            ),
            selected: false,
          },
          {
            id: 'ni2-3',
            title: '角色設定',
            visible: computed(
              () =>
                uallowed.value.indexOf('SSSU') != -1 ||
                uallowed.value.indexOf('SDSU') != -1 ||
                uallowed.value.indexOf('SCSU') != -1 ||
                uallowed.value.indexOf('SHSU') != -1 ||
                uallowed.value.indexOf('SSUU') != -1 ||
                uallowed.value.indexOf('SDUU') != -1 ||
                uallowed.value.indexOf('SCUU') != -1 ||
                uallowed.value.indexOf('SHUU') != -1,
            ),
            selected: false,
          },
          {
            id: 'ni2-4',
            title: '使用者臨時授權',
            visible: computed(
              () =>
                uallowed.value.indexOf('SSSU') != -1 ||
                uallowed.value.indexOf('SDSU') != -1 ||
                uallowed.value.indexOf('SCSU') != -1 ||
                uallowed.value.indexOf('SHSU') != -1 ||
                uallowed.value.indexOf('SSUU') != -1 ||
                uallowed.value.indexOf('SDUU') != -1 ||
                uallowed.value.indexOf('SCUU') != -1 ||
                uallowed.value.indexOf('SHUU') != -1,
            ),
            selected: false,
          },
          {
            id: 'ni2-5',
            title: '使用者解除鎖定',
            visible: computed(
              () =>
                uallowed.value.indexOf('SSSU') != -1 ||
                uallowed.value.indexOf('SDSU') != -1 ||
                uallowed.value.indexOf('SCSU') != -1 ||
                uallowed.value.indexOf('SHSU') != -1 ||
                uallowed.value.indexOf('SSUU') != -1 ||
                uallowed.value.indexOf('SDUU') != -1 ||
                uallowed.value.indexOf('SCUU') != -1 ||
                uallowed.value.indexOf('SHUU') != -1,
            ),
            selected: false,
          },
          {
            id: 'ni2-6',
            title: '人員權限明細表',
            visible: computed(
              () =>
                uallowed.value.indexOf('SSSU') != -1 ||
                uallowed.value.indexOf('SDSU') != -1 ||
                uallowed.value.indexOf('SCSU') != -1 ||
                uallowed.value.indexOf('SHSU') != -1 ||
                uallowed.value.indexOf('SSUU') != -1 ||
                uallowed.value.indexOf('SDUU') != -1 ||
                uallowed.value.indexOf('SCUU') != -1 ||
                uallowed.value.indexOf('SHUU') != -1,
            ),
            selected: false,
          },
          {
            id: 'ni2-7',
            title: '人員權限異動明細表',
            visible: computed(
              () =>
                uallowed.value.indexOf('SSSU') != -1 ||
                uallowed.value.indexOf('SDSU') != -1 ||
                uallowed.value.indexOf('SCSU') != -1 ||
                uallowed.value.indexOf('SHSU') != -1 ||
                uallowed.value.indexOf('SSUU') != -1 ||
                uallowed.value.indexOf('SDUU') != -1 ||
                uallowed.value.indexOf('SCUU') != -1 ||
                uallowed.value.indexOf('SHUU') != -1,
            ),
            selected: false,
          },
        ],
      },
      {
        id: 'system_report',
        title: '報表查詢',
        visible: computed(() => uallowed.value.indexOf('SDS5') != -1),
        selected: false,
        pages: [
          {
            id: 'ni3-1',
            title: '文件建檔狀態明細表',
            visible: computed(() => uallowed.value.indexOf('SDS5') != -1),
            selected: false,
          },
          {
            id: 'ni3-2',
            title: '使用者登出入報表',
            visible: computed(() => uallowed.value.indexOf('SDS5') != -1),
            selected: false,
          },
          {
            id: 'ni3-3',
            title: '資料查詢明細表',
            visible: computed(() => uallowed.value.indexOf('SDS5') != -1),
            selected: false,
          },
          {
            id: 'ni3-6',
            title: '分行歸檔清單報表',
            visible: computed(() => uallowed.value.indexOf('SDS5') != -1),
            selected: false,
          },
          {
            id: 'ni3-7',
            title: '分行調閱聯行存匯資料報表',
            visible: computed(() => uallowed.value.indexOf('SDS5') != -1),
            selected: false,
          },
          {
            id: 'ni3-8',
            title: '分行各時段掃描量統計表',
            visible: computed(() => uallowed.value.indexOf('SDS5') != -1),
            selected: false,
          },
          {
            id: 'ni3-9',
            title: '系統設定紀錄表',
            visible: computed(() => uallowed.value.indexOf('SDS5') != -1),
            selected: false,
          },
        ],
      },
      {
        id: 'system_setting',
        title: '作業維護設定',
        visible: computed(
          () =>
            uallowed.value.indexOf('SSSU') != -1 ||
            uallowed.value.indexOf('SDSU') != -1 ||
            uallowed.value.indexOf('SCSU') != -1 ||
            uallowed.value.indexOf('SHSU') != -1,
        ),
        selected: false,
        pages: [
          {
            id: 'ni4-1',
            title: '分行別維護設定表',
            visible: computed(
              () =>
                uallowed.value.indexOf('SSSU') != -1 ||
                uallowed.value.indexOf('SDSU') != -1 ||
                uallowed.value.indexOf('SCSU') != -1 ||
                uallowed.value.indexOf('SHSU') != -1,
            ),
            selected: false,
          },
          {
            id: 'ni4-2',
            title: '文件大項類別設定維護',
            visible: computed(
              () =>
                uallowed.value.indexOf('SSSU') != -1 ||
                uallowed.value.indexOf('SDSU') != -1 ||
                uallowed.value.indexOf('SCSU') != -1 ||
                uallowed.value.indexOf('SHSU') != -1,
            ),
            selected: false,
          },
          {
            id: 'ni4-10',
            title: '文件中項類別設定維護',
            visible: computed(
              () =>
                uallowed.value.indexOf('SSSU') != -1 ||
                uallowed.value.indexOf('SDSU') != -1 ||
                uallowed.value.indexOf('SCSU') != -1 ||
                uallowed.value.indexOf('SHSU') != -1,
            ),
            selected: false,
          },
          {
            id: 'ni4-3',
            title: '文件小項類別設定維護',
            visible: computed(
              () =>
                uallowed.value.indexOf('SSSU') != -1 ||
                uallowed.value.indexOf('SDSU') != -1 ||
                uallowed.value.indexOf('SCSU') != -1 ||
                uallowed.value.indexOf('SHSU') != -1,
            ),
            selected: false,
          },
          {
            id: 'ni4-11',
            title: '文件小項類別核可',
            visible: computed(
              () =>
                uallowed.value.indexOf('SSSU') != -1 ||
                uallowed.value.indexOf('SDSU') != -1 ||
                uallowed.value.indexOf('SCSU') != -1 ||
                uallowed.value.indexOf('SHSU') != -1,
            ),
            selected: false,
          },
          {
            id: 'ni4-4',
            title: '白名單設定維護',
            visible: computed(
              () =>
                uallowed.value.indexOf('SSSU') != -1 ||
                uallowed.value.indexOf('SDSU') != -1 ||
                uallowed.value.indexOf('SCSU') != -1 ||
                uallowed.value.indexOf('SHSU') != -1,
            ),
            selected: false,
          },
          {
            id: 'ni4-5',
            title: '前置作業設定',
            visible: computed(
              () =>
                uallowed.value.indexOf('SSSU') != -1 ||
                uallowed.value.indexOf('SDSU') != -1 ||
                uallowed.value.indexOf('SCSU') != -1 ||
                uallowed.value.indexOf('SHSU') != -1,
            ),
            selected: false,
          },
          {
            id: 'ni4-6',
            title: '使用者同步作業',
            visible: computed(
              () =>
                uallowed.value.indexOf('SSSU') != -1 ||
                uallowed.value.indexOf('SDSU') != -1 ||
                uallowed.value.indexOf('SCSU') != -1 ||
                uallowed.value.indexOf('SHSU') != -1,
            ),
            selected: false,
          },
          {
            id: 'ni4-7',
            title: '使用者資料表回存作業',
            visible: computed(
              () =>
                uallowed.value.indexOf('SSSU') != -1 ||
                uallowed.value.indexOf('SDSU') != -1 ||
                uallowed.value.indexOf('SCSU') != -1 ||
                uallowed.value.indexOf('SHSU') != -1,
            ),
            selected: false,
          },
          {
            id: 'ni4-8',
            title: 'FTP連線設定維護',
            visible: computed(
              () =>
                uallowed.value.indexOf('SSSU') != -1 ||
                uallowed.value.indexOf('SDSU') != -1 ||
                uallowed.value.indexOf('SCSU') != -1 ||
                uallowed.value.indexOf('SHSU') != -1,
            ),
            selected: false,
          },
          {
            id: 'ni4-9',
            title: '資料庫連線設定維護',
            visible: computed(
              () =>
                uallowed.value.indexOf('SSSU') != -1 ||
                uallowed.value.indexOf('SDSU') != -1 ||
                uallowed.value.indexOf('SCSU') != -1 ||
                uallowed.value.indexOf('SHSU') != -1,
            ),
            selected: false,
          },
        ],
      },      
    ],
  }),
  actions: {
    // 設定側邊選單主項目展開
    setMainMenuSelect(id: string) {
      this.menu.forEach((item) => {
        if (item.id === id) {
          item.selected = true;
        } else {
          item.selected = false;
        }
      });
    },
    // 設定側邊選單子項目展開
    setSubMenuSelect(id: string) {
      this.menu.forEach((item) => {
        item.pages.forEach((page) => {
          if (page.id === id) {
            page.selected = true;
          } else {
            page.selected = false;
          }
        });
      });
    },
    // 設定側邊選單連結函式
    setCallback(pageId: string, callback: () => void) {
      this.menu.forEach((menuItem) => {
        menuItem.pages.forEach((page) => {
          if (page.id === pageId) {
            page.callback = () => check_timeout(() => callback());
          }
        });
      });
    },
    // 清除選單狀態
    reset() {
      this.setMainMenuSelect('');
      this.setSubMenuSelect('');
    },
  },
});
/** 1=正常 0=超時 */
async function check_timeout(callback: () => void) {
  // 發送請求並解析結果
  let doc: Document;
  const params = new URLSearchParams();
  params.append('nii', login.verifyid?.uid || '');
  params.append('checkUser', '1');
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

  if (basic !== '00000000') {
    // 清空登入資訊
    login.verifyid = null;
    // 跳轉回首頁
    await router.push({ path: '/' });
  } else {
    callback();
  }
}
