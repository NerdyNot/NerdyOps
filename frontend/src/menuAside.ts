import {
  mdiAccountCircle,
  mdiMonitor,
  mdiGithub,
  mdiLock,
  mdiAlertCircle,
  mdiSquareEditOutline,
  mdiTable,
  mdiCheckboxMarkedCircleAutoOutline,
  mdiServer,
  mdiViewList,
  mdiMonitorDashboard,
  mdiTelevisionGuide,
  mdiResponsive,
  mdiPalette,
  mdiVuejs,
} from '@mdi/js'
import { MenuAsideItem } from './interfaces'

const menuAside: MenuAsideItem[] = [
  {
    href: '/',
    icon: mdiMonitor,
    label: 'Home',
  },/*
  {
    href: '/tables',
    label: 'Tables',
    icon: mdiTable,
  },*/
  {
    href: '/agents',
    label: 'Agent List',
    icon: mdiServer,
  },
  {
    href: '/agent-tasks',
    label: 'Agent Tasks',
    icon: mdiCheckboxMarkedCircleAutoOutline,
  },  
  {
    href: '/batch-approve',
    label: 'Batch Approve',
    icon: mdiViewList,
  },
  {
    href: '/batch-results',
    label: 'Batch Results',
    icon: mdiTable,
  },
  {
    href: '/agent-monitoring',
    label: 'Monitoring',
    icon: mdiMonitorDashboard,
  },  /*
  {
    href: '/forms',
    label: 'Forms',
    icon: mdiSquareEditOutline,
  },
  {
    href: '/ui',
    label: 'UI',
    icon: mdiTelevisionGuide,
  },
  {
    href: '/responsive',
    label: 'Responsive',
    icon: mdiResponsive,
  },
  {
    href: '/',
    label: 'Styles',
    icon: mdiPalette,
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: mdiAccountCircle,
  },
  {
    href: '/login',
    label: 'Login',
    icon: mdiLock,
  },
  {
    href: '/error',
    label: 'Error',
    icon: mdiAlertCircle,
  },
  {
    label: 'Dropdown',
    icon: mdiViewList,
    menu: [
      {
        label: 'Item One',
      },
      {
        label: 'Item Two',
      },
    ],
  },*/
]

export default menuAside
