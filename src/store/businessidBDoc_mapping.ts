import axios from 'axios';

export type jsonres_businessidDoc_mapping = {
  error: {
    Code: string;
    Message: string;
    Count?: string;
    totalpage?: string;
  }[];
  data: MainDocList[];
};

export type MainDocList = {
  bcode: string; //大類文件代碼
  bname: string; //大類名稱
  AccGroup: string; //管理單位
  AccGroup_array: string[];//管理單位以_切割
};

export async function doPost_businessidBDoc_mapping(params: URLSearchParams) {
  // 發送請求並回傳結果
  let res: jsonres_businessidDoc_mapping;
  if (process.env.NODE_ENV == 'development') {
    const resp = await axios.get('test/businessidBDoc_mapping.json', {
      responseType: 'json',
    });
    res = resp.data;
  } else {
    const resp = await axios.post('/nibox/businessidBDoc_mapping.jsp', params, {
      responseType: 'json',
    });
    res = resp.data;
  }

  return res;
}