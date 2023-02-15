<script lang='ts' setup>
import axios from 'axios';
import { Modal } from 'bootstrap';
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLoginStore } from '@/store/login';
import LoadingScreen from '@/components/LoadingScreen.vue';

const route = useRoute();
const router = useRouter();
const login = useLoginStore();
const user_id = computed(() => (login.verifyid?.uid || ''));
const password = ref('');
const newpassword = ref('');
const isQuerying = ref(false);
const emit = defineEmits(['closeChangePW']);
const props = defineProps({
  tempid: {
    type: String,
    default: '',
  },
});

// 更改密碼
async function changePW() {
  // 蒐集網址列參數
  const params = new URLSearchParams();
  if (props.tempid != '') {
    params.append('nii', props.tempid);
  } else {
    params.append('nii', user_id.value);
  }

  params.append('nip', password.value);
  params.append('nipNew', newpassword.value);

  //axios.get('verifyid_seal_db.xml',{params}).then((response) => {
  axios
    .get('/PX1/nibox/changepass_db.aspx', { params })
    .then((response) => {
      isQuerying.value = true;
      var parser = new DOMParser();
      var doc = parser.parseFromString(response.data, 'text/xml');
      const basic = doc.querySelector('error[name="Basic"]')?.textContent;
      const message = doc.querySelector('error[name="Message"]')?.textContent;
      if (basic !== '00000000') {
        throw new Error(`${basic}${message}`);
      }
      alert(`${message}` + '請重新登入');
      doLogout();
    })
    .catch(function (error) {
      alert(error);
    })
    .finally(() => {
      isQuerying.value = false;
      emit('closeChangePW');
    });
}

// 取消變更密碼
function closeChangePW() {
  if (route.query.tempid != undefined) {
    doLogout();
  }
  else {
    emit('closeChangePW');
  }
}

// 登出
async function doLogout() {
  // 清空登入資訊
  login.verifyid = null;
  // 跳轉回首頁
  await router.push({ path: '/' });
}
const myModal = ref();

onMounted(() => {
  const staticBackdrop = document.getElementById('staticBackdrop');
  if (staticBackdrop != null) {
    myModal.value = new Modal(staticBackdrop);
    myModal.value.show();
  }
});
</script>

<template>
  <!-- 處理中請稍候 -->
  <LoadingScreen message='處理中，請稍候...' :visible='isQuerying' />

  <!-- 變更密碼視窗 -->
  <div class="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
    aria-labelledby="staticBackdropLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="staticBackdropLabel">變更密碼</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"
            @click="closeChangePW"></button>
        </div>
        <div class="modal-body">
          <form>
            <div class="mb-3">
              <input class='form-control' type='password' placeholder='舊密碼' v-model='password' />
            </div>
            <div class="mb-3">
              <input class='form-control' type='password' placeholder='新密碼' v-model='newpassword' />
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="closeChangePW">取消</button>
          <button type="button" class="btn btn-primary" data-bs-dismiss="modal" @click='changePW'>確認</button>
        </div>
      </div>
    </div>
  </div>
</template>