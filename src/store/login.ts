import { defineStore } from 'pinia';

export type LoginState = {
  verifyid: null | {
    uid: string; // 使用者代號
    uname: string // 使用者名稱
    companycode: string; // 分行別
    companycode1: string; // 分行別
    uallowed: string; // 權限字串
    ulevel: string; // 權限層級
    presetcontent: string; // 前置作業設定
    coid: string; // 公司代碼
    coname: string; // 銀行名稱
    cct: string; // 建檔不需核可類別
    uct: string; // 變更不需核可類別
    docisf: string; // 文件聯行變更開關
    allowkeyinbranch: string; // 代建行    
    dbconfig: string; // 資料庫設定
    HeadOffice: string, // 總行代碼
    RQI: string, // 報表日期區間
  };
};

export const useLoginStore = defineStore('login', {
  state: (): LoginState => ({
    verifyid: null,
  }),
  actions: {
    load() {
      const text = sessionStorage.getItem('verifyid');
      if (text != null) {
        this.verifyid = JSON.parse(text);
      } else {
        this.verifyid = null;
      }
    },
    save() {
      sessionStorage.setItem('verifyid', JSON.stringify(this.verifyid));
    },
    reset() {
      this.verifyid = null;
    },
  },
});
