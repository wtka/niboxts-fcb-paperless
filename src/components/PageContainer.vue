<script lang="ts" setup>
import { ref, computed, reactive, onMounted, watch } from 'vue';

const props = defineProps({
  queryCount: {
    type: Number,
    default: 0,
  },
  currentIndex: {
    type: Number,
    default: 1,
  },
  totalPage: {
    type: String,
    default: '1',
  },
});

type pages = {
  page: {
    id: number,
    current: boolean
  }[];
};

const currentPage = ref(1);
const currentCount = ref(0);
const pageObj = reactive<pages>({ page: [] });
const emit = defineEmits(['changePageIndex']);

// 初始化分頁
function iniPage() {
  const max = parseInt(props.totalPage);
  const current = props.currentIndex;
  const start = computed(() => current <= 1 ? 1 : current - 1);
  const end = computed(() => current >= max ? max : current + 1);

  for (let i = start.value; i <= end.value; i++) {
    pageObj.page.push({
      id: i,
      current: false,
    });
  }
  activePage(current);
}

// 第一頁
function firstPage() {
  currentPage.value = 1;
}

// 最後一頁
function lastPage() {
  currentPage.value = parseInt(props.totalPage);
}

// 上一頁
function prePage() {
  if (currentPage.value > 1) {
    --currentPage.value;
  }
}

// 下一頁
function nextPage() {
  if (currentPage.value < parseInt(props.totalPage)) {
    ++currentPage.value;
  }
}

// 更改頁面
function changeIndex(value: number) {
  emit('changePageIndex', value);
}

// 啟用指定頁面
function activePage(pageId: number) {
  pageObj.page.forEach((page) => page.id == pageId ? page.current = true : page.current = false);
  currentPage.value = pageId;
}

// 監控當前頁面變更
watch(currentPage, async (newv) => {
  const max = parseInt(props.totalPage);
  const current = newv;
  const start = computed(() => current <= 1 ? 1 : current - 1);
  const end = computed(() => current >= max ? max : current + 1);
  pageObj.page = [];
  for (let i = start.value; i <= end.value; i++) {
    pageObj.page.push({
      id: i,
      current: false,
    });
  }
  changeIndex(current);
  activePage(current);
});

// 初始化頁面
onMounted(() => {
  currentPage.value = props.currentIndex;
  iniPage();
});

// 監控 Props.currentIndex 變更
watch(() => props.currentIndex, (val) => {
  currentPage.value = val;
});

// 監控 Props.queryCount 變更
watch(() => props.queryCount, (val) => {
  currentCount.value = val;
});
</script>

<template>
  <div class="d-flex align-items-center">
    <div class="mx-3">
      <span class="align-middle">共 {{ currentCount }} 筆</span>
    </div>
    <nav class="mt-3">
      <ul class="pagination">
        <li class="page-item">
          <div class="page-link" :class="{ disabled: currentPage == 1 }" aria-label="Previous" @click='firstPage'>
            <span aria-hidden="true">«</span>
          </div>
        </li>
        <li class="page-item">
          <div class="page-link" :class="{ disabled: currentPage == 1 }" aria-label="Previous" @click='prePage'>
            <span aria-hidden="true">‹</span>
          </div>
        </li>
        <li v-for="page, i in pageObj.page" :key="i" class="page-item" :class="{ active: page.current }"
          @click="activePage(page.id)">
          <span class="page-link" href="">{{ page.id }}</span>
        </li>
        <li class="page-item">
          <div class="page-link" :class="{ disabled: currentPage == parseInt(props.totalPage) }" aria-label="Next"
            @click='nextPage'>
            <span aria-hidden="true">›</span>
          </div>
        </li>
        <li class="page-item">
          <div class="page-link" :class="{ disabled: currentPage == parseInt(props.totalPage) }" aria-label="Next"
            @click='lastPage'>
            <span aria-hidden="true">»</span>
          </div>
        </li>
      </ul>
    </nav>
  </div>

</template>