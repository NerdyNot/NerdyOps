import React from 'react';
import { MenuAsideItem } from '../../interfaces';
import AsideMenuLayer from './Layer';
import OverlayLayer from '../OverlayLayer';
import { useAppSelector } from '../../stores/hooks';
import { RootState } from '../../stores/store';

type Props = {
  menu: MenuAsideItem[]
  isAsideMobileExpanded: boolean
  isAsideLgActive: boolean
  onAsideLgClose: () => void
}

export default function AsideMenu({
  isAsideMobileExpanded = false,
  isAsideLgActive = false,
  ...props
}: Props) {
  const userRole = useAppSelector((state: RootState) => state.main.userRole);

  const filteredMenu = props.menu.filter((item: MenuAsideItem) => {
    if (item.roles && userRole) {
      return item.roles.includes(userRole);
    }
    return false;
  });

  return (
    <>
      <AsideMenuLayer
        menu={filteredMenu}
        className={`${isAsideMobileExpanded ? 'left-0' : '-left-60 lg:left-0'} ${
          !isAsideLgActive ? 'lg:hidden xl:flex' : ''
        }`}
        onAsideLgCloseClick={props.onAsideLgClose}
      />
      {isAsideLgActive && <OverlayLayer zIndex="z-30" onClick={props.onAsideLgClose} />}
    </>
  );
}
