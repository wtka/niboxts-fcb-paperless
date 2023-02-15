import axios from 'axios';

export type jsonres_businessid_mapping = {
  error: {
    Code: string;
    Message: string;
    Count?: string;
    totalpage?: string;
    ExcelFile: string;
  }[];
  data: SubDocList[];
};

export type SubDocList = {
  mcode: string; //中類代碼
  mname: string; //中類名稱
  code: string; //小類代碼
  name: string; //小類名稱
  DocCode: string; //表單編號
  DocBarCode: string; //條碼編號
  DocMode: string; //主副件
  uid: string; //最後異動人員
  nistatus: string;//核可狀態
};

export async function doPost_businessid_mapping(params: URLSearchParams) {
  // 發送請求並回傳結果
  let res: jsonres_businessid_mapping;
  if (process.env.NODE_ENV == 'development') {
    const resp = await axios.get('test/businessid_mapping.json', {
      responseType: 'json',
    });
    res = resp.data;
  } else {
    const resp = await axios.post('/nibox/businessid_mapping.jsp', params, {
      responseType: 'json',
    });
    res = resp.data;
  }

  return res;
}