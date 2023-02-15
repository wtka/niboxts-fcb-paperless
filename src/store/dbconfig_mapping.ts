import axios from 'axios';

export type Properties = {
  code: string; //db代碼
  name: string; //db名稱
  YearS: string; //起始年
  datasourcename: string; //DataSource 名稱
  encdatapath: string; //路徑
  dbconfigpath: string; //路徑(傳送這個為主)
  YearE: string; //終止年
  nistatus: string; //資料庫屬性
};

export type jsonres_Dbconfig_mapping = {
  error: {
    Code: string;
    Message: string;
    Count?: string;
    totalpage?: string;
  }[];
  data?: Properties[]
};

export async function doPost_Dbconfig_mapping(params: URLSearchParams) {
  // 發送請求並回傳結果
  let res: jsonres_Dbconfig_mapping;
  if (process.env.NODE_ENV == 'development') {
    const resp = await axios.get('test/dbconfig_mapping.json', {
      responseType: 'json',
    });
    res = resp.data;
  } else {
    const resp = await axios.post('/nibox/dbconfig_mapping.jsp', params, {//正式
      responseType: 'json',
    });
    res = resp.data;
  }

  return res;
}