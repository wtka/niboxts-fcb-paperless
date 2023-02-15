import axios from 'axios';

export class QSD {
  /** 網址 */
  url: string;
  /** 多資料庫參數 */
  multibranchdb: string;
  /** 查詢結果 */
  results: { [_: string]: string }[];

  /** XML */
  xdoc: Document;
  xroot: Element;
  xselect: Element;
  xfrom: Element;

  /** 建構式 */
  constructor(base_url: string) {
    this.url = new URL('/nibox/QSD.jsp', base_url).href;
    this.multibranchdb = '';
    this.results = [];
    this.xdoc = new Document();
    this.xroot = this.xdoc.appendChild(this.xdoc.createElement('root'));
    this.xselect = this.xroot.appendChild(this.xdoc.createElement('selectcol'));
    this.xfrom = this.xroot.appendChild(this.xdoc.createElement('from'));
  }

  /** 欄位 */
  select(column: string) {
    // <selectcol>
    //   <column></column>
    // </selectcol>
    const c = this.xselect.appendChild(this.xdoc.createElement('column'));
    c.textContent = column;
  }

  /** 資料表 */
  from(table: string) {
    // <from></from>
    const text = this.xfrom.textContent ?? '';
    if (text.length > 0) {
      this.xfrom.textContent += ' ';
    }

    this.xfrom.textContent += table;
  }

  /** 過濾條件 */
  where(colname: string, opt: string, edge: string) {
    // </from>
    // <where></where>
    // <nor>AND</nor>
    const exist = this.xroot.querySelector('where') != null;
    const w = this.xroot.insertBefore(this.xdoc.createElement('where'), this.xfrom.nextSibling);
    if (exist) {
      const n = this.xroot.insertBefore(this.xdoc.createElement('nor'), w.nextSibling);
      n.textContent = 'AND';
    }

    // <where>
    //   <colname></colname>
    //   <opt></opt>
    //   <edge></edge>
    // </where>
    const c = w.appendChild(this.xdoc.createElement('colname'));
    const o = w.appendChild(this.xdoc.createElement('opt'));
    const e = w.appendChild(this.xdoc.createElement('edge'));
    c.textContent = colname;
    o.textContent = opt;
    e.textContent = edge;
  }

  /** 過濾條件(OR) */
  whereor(colname1: string, opt1: string, edge1: string, colname2: string, opt2: string, edge2: string) {
    // </from>
    // <where></where>
    // <nor>AND</nor>
    const exist = this.xroot.querySelector('where') != null;
    const w1 = this.xroot.insertBefore(this.xdoc.createElement('where'), this.xfrom.nextSibling);
    if (exist) {
      const n1 = this.xroot.insertBefore(this.xdoc.createElement('nor'), w1.nextSibling);
      n1.textContent = 'AND';
    }

    // <where>
    //   <colname>(</colname>
    //   <opt></opt>
    //   <edge></edge>
    // </where>
    // <nor>OR</nor>
    // <where>
    //   <colname></colname>
    //   <opt></opt>
    //   <edge>###</edge>
    // </where>
    const c1 = w1.appendChild(this.xdoc.createElement('colname'));
    const o1 = w1.appendChild(this.xdoc.createElement('opt'));
    const e1 = w1.appendChild(this.xdoc.createElement('edge'));
    c1.textContent = '(' + colname1;
    o1.textContent = opt1;
    e1.textContent = edge1;

    const n2 = this.xroot.insertBefore(this.xdoc.createElement('nor'), w1.nextSibling);
    n2.textContent = 'OR';
    const w2 = this.xroot.insertBefore(this.xdoc.createElement('where'), n2.nextSibling);
    const c2 = w2.appendChild(this.xdoc.createElement('colname'));
    const o2 = w2.appendChild(this.xdoc.createElement('opt'));
    const e2 = w2.appendChild(this.xdoc.createElement('edge'));
    c2.textContent = colname2;
    o2.textContent = opt2;
    e2.textContent = edge2 + '###';
  }

  

  /** 查詢 */
  async doQuery() {
    // 清空結果
    this.results = [];

    // 設定參數
    const serializer = new XMLSerializer();
    const xmldata = serializer.serializeToString(this.xdoc);
    const params = new URLSearchParams();
    params.append('optype', '4');
    params.append('data', encodeURIComponent(xmldata));
    params.append('MULTIBRANCHDB', this.multibranchdb);

    const resp = await axios({
      method: 'POST',
      url: this.url,
      data: params,
      responseType: 'document',
    });

    const doc = resp.data;
    const basic = doc.querySelector('root > error[name="Basic"]')?.textContent;
    const message = doc.querySelector('root > error[name="Message"]')?.textContent;

    if (basic == null) {
      throw new Error('伺服器回傳錯誤的資料格式');
    } else if (basic == '00000005') {
      return; // 查無資料
    } else if (basic != '00000000') {
      throw new Error(`${basic}: ${message}`);
    }

    // 取得結果
    const alldata = doc.querySelectorAll('root > data');

    alldata.forEach((data : HTMLElement) => {
      const result: { [_: string]: string } = {};

      for (let i = 0; i < data.children.length; i++) {
        const item = data.children.item(i);
        if (item != null) {
          const key = item.tagName;
          const value = item.textContent ?? '';
          result[key] = value;
        }
      }

      this.results.push(result);
    });
  }
}
