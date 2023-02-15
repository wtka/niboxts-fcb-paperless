import axios from 'axios';

export type jsonres_businessidDoc_mapping = {
  error: {
    Code: string;
    Message: string;
    Count?: string;
    totalpage?: string;
  }[];
  data: MiddleDocList[];
};

export type MiddleDocList = {
  mcode: string; //中類文件代碼
  mname: string; //中類名稱
  bcode: string//大類名稱
};

export async function doPost_businessidDoc_mapping(params: URLSearchParams) {
  // 發送請求並回傳結果
  let res: jsonres_businessidDoc_mapping;
  if (process.env.NODE_ENV == 'development') {
    const resp = await axios.get('test/businessidDoc_mapping.json', {
      responseType: 'json',
    });
    res = resp.data;
  } else {
    const resp = await axios.post('/nibox/businessidDoc_mapping.jsp', params, {
      responseType: 'json',
    });
    res = resp.data;
  }

  return res;
}