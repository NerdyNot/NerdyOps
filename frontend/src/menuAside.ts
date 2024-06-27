import {
  mdiAccountCircle,
  mdiMonitor,
  mdiLock,
  mdiAlertCircle,
  mdiSquareEditOutline,
  mdiViewListOutline,
  mdiCheckboxMarkedCircleAutoOutline,
  mdiServer,
  mdiViewList,
  mdiMonitorDashboard,
  mdiAccountCog,
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
    href: '/agents',
    label: 'Agent List',
    icon: mdiServer,
    roles: ['user', 'admin'], // 모든 사용자 접근 가능
  },
  {
    href: '/agent-tasks',
    label: 'Agent Tasks',
    icon: mdiCheckboxMarkedCircleAutoOutline,
    roles: ['user', 'admin'], // 모든 사용자 접근 가능
  },
  {
    href: '/batch-approve',
    label: 'Batch Approve',
    icon: mdiViewList,
    roles: ['user', 'admin'], // 관리자만 접근 가능
  },
  {
    href: '/batch-results',
    label: 'Batch Results',
    icon: mdiViewListOutline,
    roles: ['user', 'admin'], // 관리자만 접근 가능
  },
  {
    href: '/agent-monitoring',
    label: 'Monitoring',
    icon: mdiMonitorDashboard,
    roles: ['user', 'admin'], // 모든 사용자 접근 가능
  },
  {
    href: '/admin',
    label: 'Admin',
    icon: mdiAccountCog,
    roles: ['admin'], // 관리자만 접근 가능
  },
];

export default menuAside;
