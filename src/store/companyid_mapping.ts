
import axios from 'axios';
import { ref, computed } from 'vue';
import { useLoginStore } from '@/store/login';

const login = useLoginStore();
const companycode = computed(() => (login.verifyid?.companycode || ''));
const HeadOffice = computed(() => (login.verifyid?.HeadOffice || ''));
const HeadOffice_List = <string[]>[];
const uid = computed(() => (login.verifyid?.uid || ''));

for (let i = 0; i < HeadOffice.value.split('_').length; i++) {
  HeadOffice_List.push(HeadOffice.value.split('_')[i]);
}

export type jsonres_queryipcheck_mapping = {
  error: {
    Code: string;
    Message: string;
    Count?: string;
    totalpage?: string;
  }[];
  data: BranchList[];
};

export type BranchList = {
  code: string; // 分行別
  name: string; // 分行別名稱
  allowkeyinbrnach: string; //代建行
  allowkeyinbrnach_array: string[];
};

export async function doPost_companyid_mapping(params: URLSearchParams) {
  // 發送請求並回傳結果
  let res: jsonres_queryipcheck_mapping;
  if (process.env.NODE_ENV == 'development') {
    const resp = await axios.get('test/BranchMaintain.json', {
      responseType: 'json',
    });
    res = resp.data;
  } else {
    const resp = await axios.post('/nibox/companyid_mapping.jsp', params, {
      responseType: 'json',
    });
    res = resp.data;
  }

  return res;
}
const BranchList = ref<BranchList[]>([]);
export async function queryBranchList() {
  BranchList.value.length = 0;
  //查詢初始化
  try {
    const params = new URLSearchParams();
    params.append('optype', '1');

    const tempres = await doPost_companyid_mapping(params);
    const basic = tempres.error[0].Code;
    const message = tempres.error[0].Message;
    if (basic != '00000000') {
      throw new Error(`${basic}: ${message}`);
    }
    if (tempres.data == null) {
      throw new Error('伺服器回傳錯誤的資料格式');
    }
    const uid = computed(() => (login.verifyid?.uid || ''));
    if (HeadOffice_List.indexOf(companycode.value) != -1 || uid.value.toUpperCase() == 'SUPER') {//總行單位 or SUPER
      BranchList.value = tempres.data;
      return BranchList.value;
    }
    else {
      for (let i = 0; i < tempres.data.length; i++) {
        if (tempres.data[i].code == companycode.value) {
          BranchList.value.push(tempres.data[i]);
        }
      }
      return BranchList.value;
    }

  } catch (error) {
    let message = error;
    if (error instanceof Error) {
      message = error.message;
    }
    alert(`${message}`);
  }
}