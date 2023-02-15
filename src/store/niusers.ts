import axios from 'axios';

export type NiusersItem = {
  uid: string; //使用者ID
  companycode: string; //分行別
  ugroup: string; //群組
  uname: string; //使用者名稱
  udate: string; //建立日期
  mbusinesscode: string;//文件類別(大類)
  res4: string; // HR階層
  niApproveStatus: string; //核可狀態?
  ustatus: string; //登入狀態

};

export type jsonres_niusers = {
  error: {
    Code: string;
    Message: string;
    Count?: string;
    totalpage?: string;
  }[];
  data: NiusersItem[]
}

export async function doPost_niusers(params: URLSearchParams) {
  // 發送請求並回傳結果
  let res: jsonres_niusers;
  if (process.env.NODE_ENV == 'development') {
    const resp = await axios.get('test/niusers.json', {
      responseType: 'json',
    });
    res = resp.data;
  } else {
    const resp = await axios.post('/nibox/niusers.jsp', params, {
      responseType: 'json',
    });
    res = resp.data;
  }

  return res;
}