import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    path: '',
    component: () => import('@/views/LoginPage.vue'),
    props: (router) => router.query,
  },
  {
    path: '/AppChangePW',
    component: () => import('@/components/AppChangePW.vue'),
    props: (router) => router.query,
  },
  {
    path: '/menu-ni',
    component: () => import('@/views/EntryPage.vue'),
    children: [
      {
        path: '',
        component: () => import('@/views/HomePage.vue'),
      },
      {
        path: 'PreWork',
        component: () => import('@/views/PreworkSetting.vue'),
      },
      {
        path: 'WhiteList',
        component: () => import('@/views/WhiteList.vue'),
      },
      {
        path: 'RoleGroup',
        component: () => import('@/views/RoleGroup.vue'),
      },
      {
        path: 'UserModify',
        component: () => import('@/views/UserModify.vue'),
      },
      {
        path: 'UserUnlock',
        component: () => import('@/views/UserUnlock.vue'),
      },
      {
        path: 'UserReport',
        component: () => import('@/views/UserReport.vue'),
      },
      {
        path: 'UserLoginReport',
        component: () => import('@/views/UserLoginReport.vue'),
      },
      {
        path: 'ArchivedList',
        component: () => import('@/views/ArchivedList.vue'),
      },
      {
        path: 'InterbankDeposit',
        component: () => import('@/views/InterbankDeposit.vue'),
      },
      {
        path: 'ScanReport',
        component: () => import('@/views/BranchScanReport.vue'),
      },
      {
        path: 'SystemRecord',
        component: () => import('@/views/SystemRecord.vue'),
      },
      {
        path: 'BranchMaintain',
        component: () => import('@/views/BranchMaintain.vue'),
      },
      {
        path: 'FTPMaintain',
        component: () => import('@/views/FTPMaintain.vue'),
      },
      {
        path: 'DBMaintain',
        component: () => import('@/views/DBMaintain.vue'),
      },
      {
        path: 'MainDocMaintain',
        component: () => import('@/views/MainDocMaintain.vue'),
      },
      {
        path: 'MiddleDocMaintain',
        component: () => import('@/views/MiddleDocMaintain.vue'),
      },
      {
        path: 'SubDocMaintain',
        component: () => import('@/views/SubDocMaintain.vue'),
      },
      {
        path: 'CreateFileStatus',
        component: () => import('@/views/CreateFileStatus.vue'),
      },
      {
        path: 'UserPermissionReport',
        component: () => import('@/views/UserPermissionReport.vue'),
      },
      {
        path: 'DataQueryReport',
        component: () => import('@/views/DataQueryReport.vue'),
      },
      {
        path: 'UserTempAuthorize',
        component: () => import('@/views/UserTempAuthorize.vue'),
      },
      {
        path: 'SubDocConfirm',
        component: () => import('@/views/SubDocConfirm.vue'),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
