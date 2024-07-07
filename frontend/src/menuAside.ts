import {
  mdiToolbox,
  mdiMonitor,
  mdiDownload,
  mdiBellOutline,
  mdiCogOutline,
  mdiDatabaseCogOutline,
  mdiViewListOutline,
  mdiCheckboxMarkedCircleAutoOutline,
  mdiServer,
  mdiViewList,
  mdiMonitorDashboard,
  mdiAccountCog,
  mdiTools,
  mdiTranslate,
  mdiSearchWeb,
} from '@mdi/js';
import { MenuAsideItem } from './interfaces';

const menuAside: MenuAsideItem[] = [
  {
    href: '/',
    icon: mdiMonitor,
    label: 'Home',
    roles: ['user', 'admin'], // 모든 사용자 접근 가능
  },
  {
    label: 'Agent Job',
    icon: mdiViewList,
    menu: [
      {
        href: '/agents',
        label: 'Agent List',
        icon: mdiServer,
        roles: ['user','admin']
      },
      {
        href: '/agent-tasks',
        label: 'Task List',
        icon: mdiCheckboxMarkedCircleAutoOutline,
        roles: ['user', 'admin'], // 모든 사용자 접근 가능
      },
      {
        href: '/batch-approve',
        label: 'Batch Approve',
        icon: mdiViewList,
        roles: ['user', 'admin'], // 모든 사용자 접근 가능
      },
      {
        href: '/batch-results',
        label: 'Batch Results',
        icon: mdiViewListOutline,
        roles: ['user', 'admin'], // 모든 사용자 접근 가능
      },
    ],
    roles: ['user', 'admin'], // 모든 사용자 접근 가능
  },
  {
    label: 'Utils',
    icon: mdiToolbox,
    menu: [
      {
        href: '/agent-monitoring',
        label: 'Agent Monitoring',
        icon: mdiMonitorDashboard,
        roles: ['user', 'admin'], // 모든 사용자 접근 가능
      },
      {
        href: '/agent-download',
        label: 'Agent Download',
        icon: mdiDownload,
        roles: ['user', 'admin'], // 모든 사용자 접근 가능
      },
    ],
    roles: ['user', 'admin'], // 모든 사용자 접근 가능
  },
  {
    label: 'Tools',
    icon: mdiTools,
    menu: [
      {
        href: '/tools-translate',
        label: 'Translator',
        icon: mdiTranslate,
        roles: ['user', 'admin'], // 모든 사용자 접근 가능
      },
      {
        href: '/tools-search',
        label: 'Search',
        icon: mdiSearchWeb,
        roles: ['user', 'admin'], // 모든 사용자 접근 가능
      },
    ],
    roles: ['user', 'admin'], // 모든 사용자 접근 가능
  },
  {
    label: 'Admin',
    icon: mdiCogOutline,
    menu: [
      {
        href: '/admin-user',
        label: 'User Management',
        icon: mdiAccountCog,
        roles: ['admin'],
      },
      {
        href: '/admin-model',
        label: 'Model Management',
        icon: mdiDatabaseCogOutline,
        roles: ['admin'],
      },
      {
        href: '/admin-noti',
        label: 'Notification Management',
        icon: mdiBellOutline,
        roles: ['admin'],
      },
    ],
    roles: ['admin'], // 관리자 전용
  },
];

export default menuAside;
