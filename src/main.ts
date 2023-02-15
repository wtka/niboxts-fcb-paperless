import 'bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from '@/router';
import App from '@/App.vue';

const vm = createApp(App);
vm.use(createPinia());
vm.use(router);
vm.mount('#app');

