import axios from 'axios';

export async function doPost_nigroup(params: URLSearchParams) {
  // 發送請求並回傳結果
  let res: jsonres_nigroup;
  if (process.env.NODE_ENV == 'development') {
    const resp = await axios.get('test/nigroup.json', {
      responseType: 'json',
    });
    res = resp.data;
  } else {
    const resp = await axios.post('/nibox/nigroup.jsp', params, {
      responseType: 'json',
    });
    res = resp.data;
  }

  return res;
}

export type jsonres_nigroup = {
  error: {
    Code: string;
    Message: string;
    Count?: string;
  }[];
  data?: Nirole_data[];
};

export type Nirole_data = {
  nirole: string; // 群組名稱
  niroletype: string; //角色權限
  nigroup: string; //功能(底線串)
  hiddenflag: string; //?
  nigroup_array: string[]; //功能(以底線切成array) (僅程式用 無API)
};