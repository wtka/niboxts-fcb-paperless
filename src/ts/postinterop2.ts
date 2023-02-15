type Dictionary = { [_: string]: unknown };
type Callback = (json: Dictionary) => void;
type Queue = { [_: number]: Callback };
type Dispatch = { [_: string]: Callback };

export class PostInteropError2 extends Error {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }

  override toString() {
    return `${this.code}: ${this.message}`;
  }
}

export class PostInterop2 {
  application?: string;

  #uri: string;
  #ws: null | WebSocket;
  #queue: Queue;
  #lastid: number;
  #disp: Dispatch;

  constructor(uri: string) {
    this.#uri = uri;
    this.#ws = null;
    this.#queue = {};
    this.#lastid = 0;
    this.#disp = {};
  }

  async connect() {
    return new Promise<void>((resolve, reject) => {
      // 已經建立連線
      if (this.#ws != null) {
        reject(new Error('已經建立連線'));
        return;
      }

      // 建立連線
      this.#ws = new WebSocket(this.#uri);

      // 成功
      this.#ws.onopen = () => {
        console.info('[pi2] connected');
        resolve();
      };
      // 失敗
      this.#ws.onerror = () => {
        console.info('[pi2] error');
        reject(new Error('請開啟 websocket'));
      };
      // 中斷連線
      this.#ws.onclose = () => {
        console.info('[pi2] disconnected');
      };
      // 接收訊息
      this.#ws.onmessage = (e) => {
        console.debug('[pi2] response=' + e.data);
        const json = JSON.parse(e.data);
        this.#onMessage(json);
      };
    });
  }

  disconnect() {
    this.#ws?.close();
    this.#ws = null;
  }

  #onMessage(json: Dictionary) {
    const id = json['Serial'] as number;

    if (id > 0) {
      // 從佇列裡取出回呼函數
      const callback = this.#queue[id];
      delete this.#queue[id];

      if (callback != null) {
        callback(json);
      }
    } else if (id < 0) {
      // 事件
      const name = json['Event'] as string;
      const callback = this.#disp[name];

      if (callback != null) {
        callback(json);
      }
    }
  }

  #nextId() {
    let id = this.#lastid;

    // 產生下一個序號
    do {
      id = Math.max(id + 1, 1);
    } while (id in this.#queue);

    this.#lastid = id;
    return id;
  }

  async send(action: string, data: unknown) {
    return new Promise<Dictionary>((resolve, reject) => {
      if (this.#ws == null) {
        reject(new Error('尚未建立連線'));
        return;
      }

      // 產生序號
      const id = this.#nextId();

      // 設定回呼函數
      this.#queue[id] = (json) => {
        const code = json['Code']; // 錯誤代碼
        const message = json['Message']; // 錯誤訊息
        const data = json['Data']; // 附加資料
        resolve({ code, message, data });
      };

      // 傳送訊息
      const req = JSON.stringify({
        'Serial': id, // 序號
        'Application': this.application, // 應用程式
        'Action': action, // 動作
        'Data': data, // 附加資料
      });

      console.debug('[pi2] request=' + req);
      this.#ws.send(req);
    });
  }

  async sendRecv(request: number, data: unknown) {
    return new Promise<Dictionary>((resolve, reject) => {
      if (this.#ws == null) {
        reject(new Error('尚未建立連線'));
        return;
      }

      // 產生序號
      const id = this.#nextId();

      // 設定回呼函數
      this.#queue[id] = (json) => {
        const code = json['Code']; // 錯誤代碼
        const response = json['Response']; // 回應訊息
        resolve({ code, response });
      };

      // 傳送訊息
      const req = JSON.stringify({
        'Serial': id, // 序號
        'Application': this.application, // 應用程式
        'Action': 'SendRecv', // 動作
        'Request': request, // 請求代號
        'Data': data, // 附加資料
      });

      console.debug('[pi2] request=' + req);
      this.#ws.send(req);
    });
  }

  async sendPlain(request: string) {
    return new Promise<Dictionary>((resolve, reject) => {
      if (this.#ws == null) {
        reject(new Error('尚未建立連線'));
        return;
      }

      // 產生序號
      const id = this.#nextId();

      // 設定回呼函數
      this.#queue[id] = (json) => {
        const code = json['Code']; // 錯誤代碼
        const response = json['Response']; // 回應訊息
        resolve({ code, response });
      };

      // 傳送訊息
      const req = JSON.stringify({
        'Serial': id, // 序號
        'Application': this.application, // 應用程式
        'Action': 'SendPlain', // 動作
        'Request': request, // 請求字串
      });

      console.debug('[pi2] request=' + req);
      this.#ws.send(req);
    });
  }

  setEvent(name: string, callback: Callback) {
    // 設定回呼函數
    this.#disp[name] = (json) => {
      const event = json['Event']; // 事件名稱
      const data = json['Data']; // 附加資料
      callback({ event, data });
    };
  }

  async waitEvent(name: string) {
    // 異步等待事件
    return new Promise<Dictionary>((resolve, reject) => {
      this.setEvent(name, (json) => {
        const data = json.data as Dictionary;
        resolve(data);
      });
    });
  }

  async promiseAll(values: unknown[]) {
    // 提供不支援此方法的瀏覽器使用，等待所有異步動作
    return Promise.all(values);
  }

  async open(args: unknown, opts?: { doClose?: boolean }) {
    const json = await this.send('Open', { 'Arguments': args, 'DoClose': opts?.doClose });
    const code = json.code as number;
    const message = json.message as string;
    const data = json.data;

    if (code != 0) {
      throw new PostInteropError2(code, message);
    }

    return data;
  }

  async close() {
    const json = await this.send('Close', {});
    const code = json.code as number;
    const message = json.message as string;
    const data = json.data;

    if (code != 0) {
      throw new PostInteropError2(code, message);
    }

    return data;
  }

  async listFiles(subDir: string, recursive: boolean) {
    const json = await this.send('ListFiles', { 'SubDir': subDir, 'Recursive': recursive });
    const code = json.code as number;
    const message = json.message as string;
    const data = json.data;

    if (code != 0) {
      throw new PostInteropError2(code, message);
    }

    return data;
  }

  async readFile(file: string, toBase64: boolean) {
    const json = await this.send('ReadFile', { 'File': file, 'ToBase64': toBase64 });
    const code = json.code as number;
    const message = json.message as string;
    const data = json.data;

    if (code != 0) {
      throw new PostInteropError2(code, message);
    }

    return data;
  }

  async writeFile(file: string, content: string, fromBase64: boolean) {
    const json = await this.send('WriteFile', { 'File': file, 'Content': content, 'FromBase64': fromBase64 });
    const code = json.code as number;
    const message = json.message as string;
    const data = json.data;

    if (code != 0) {
      throw new PostInteropError2(code, message);
    }

    return data;
  }

  async deleteFile(file: string, toBase64: boolean) {
    const json = await this.send('DeleteFile', { 'File': file });
    const code = json.code as number;
    const message = json.message as string;
    const data = json.data;

    if (code != 0) {
      throw new PostInteropError2(code, message);
    }

    return data;
  }
}
