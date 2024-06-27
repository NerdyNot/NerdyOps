import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAppSelector } from '../stores/hooks';
import { RootState } from '../stores/store';

const withAuth = (Component: React.FC, allowedRoles: string[]) => {
  const AuthComponent: React.FC = (props) => {
    const userRole = useAppSelector((state: RootState) => state.main.userRole);
    const router = useRouter();

    useEffect(() => {
      if (userRole && !allowedRoles.includes(userRole)) {
        router.push('/index'); // 권한이 없으면 로그인 페이지로 리디렉션
      }
    }, [userRole]);

    if (!userRole || !allowedRoles.includes(userRole)) {
      return <p>Loading...</p>; // 로딩 중이거나 권한이 없는 경우 로딩 메시지 표시
    }

    return <Component {...props} />;
  };

  return AuthComponent;
};

export default withAuth;
