import React from 'react';
import withAuth from '../utils/withAuth';

const AdminPage: React.FC = () => {
  return (
    <div>
      <h1>Admin Page</h1>
      <p>Welcome to the admin page. Only users with the admin role can see this.</p>
    </div>
  );
};

export default withAuth(AdminPage, ['admin']);
