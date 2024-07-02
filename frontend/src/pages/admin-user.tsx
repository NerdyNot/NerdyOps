import React, { useEffect, useState } from 'react';
import axios from 'axios';
import withAuth from '../utils/withAuth';
import LayoutAuthenticated from '../layouts/Authenticated';
import SectionMain from '../components/Section/Main';
import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton';
import { useBackendUrl } from '../contexts/BackendUrlContext';
import { getPageTitle } from '../config';
import { mdiAccountCog, mdiPlus } from '@mdi/js';
import Head from 'next/head';
import Button from '../components/Button';
import Cookies from 'js-cookie';

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'user' });
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const token = Cookies.get('token');
  const { backendUrl } = useBackendUrl();
  const [isBackendUrlLoaded, setIsBackendUrlLoaded] = useState(false);

  useEffect(() => {
    if (backendUrl) {
      setIsBackendUrlLoaded(true);
    }
  }, [backendUrl]);

  useEffect(() => {
    if (isBackendUrlLoaded) {
      fetchUsers();
    }
  }, [isBackendUrlLoaded]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${backendUrl}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error('Unauthorized access - maybe token is invalid or expired.');
      } else {
        console.error('Error fetching users:', error);
      }
    }
  };

  const handleRegister = async () => {
    try {
      await axios.post(`${backendUrl}/register`, newUser, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert('User registered successfully');
      fetchUsers();
      setShowRegisterForm(false);
    } catch (error) {
      console.error('Error registering user:', error);
    }
  };

  const handleRoleUpdate = async () => {
    try {
      await axios.post(`${backendUrl}/update-role`, { user_id: selectedUserId, new_role: newRole }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert('User role updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const handlePasswordChange = async () => {
    try {
      await axios.post(`${backendUrl}/change-password-admin`, { user_id: selectedUserId, new_password: newPassword }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert('Password updated successfully');
      setShowPasswordForm(false);
      setNewPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
    }
  };

  return (
    <>
      <Head>
        <title>{getPageTitle('User Management')}</title>
      </Head>
      <SectionMain>
        <SectionTitleLineWithButton icon={mdiAccountCog} title="User Management" main>
          <Button
            icon={mdiPlus}
            label="Register New User"
            onClick={() => setShowRegisterForm(!showRegisterForm)}
            color="primary"
          />
        </SectionTitleLineWithButton>

        {showRegisterForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-semibold mb-4">Register New User</h2>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                className="border p-2 w-full rounded-md"
              />
            </div>
            <div className="mb-4">
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="border p-2 w-full rounded-md"
              />
            </div>
            <div className="mb-4">
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="border p-2 w-full rounded-md"
              />
            </div>
            <div className="mb-4">
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="border p-2 w-full rounded-md">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Button
              label="Register"
              onClick={handleRegister}
              color="primary"
            />
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">User List</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="py-2 px-4">Username</th>
                  <th className="py-2 px-4">Email</th>
                  <th className="py-2 px-4">Role</th>
                  <th className="py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {users.map((user: any) => (
                  <tr key={user.user_id}>
                    <td className="py-2 px-4 border">{user.username}</td>
                    <td className="py-2 px-4 border">{user.email}</td>
                    <td className="py-2 px-4 border">
                      <select value={selectedUserId === user.user_id ? newRole : user.role} onChange={(e) => { setSelectedUserId(user.user_id); setNewRole(e.target.value); }}>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-2 px-4 border">
                      <Button
                        label="Update Role"
                        onClick={handleRoleUpdate}
                        color="success"
                      />
                      <Button
                        label="Change Password"
                        onClick={() => { setSelectedUserId(user.user_id); setShowPasswordForm(true); }}
                        color="warning"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showPasswordForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-semibold mb-4">Change User Password</h2>
            <div className="mb-4">
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="border p-2 w-full rounded-md"
              />
            </div>
            <Button
              label="Change Password"
              onClick={handlePasswordChange}
              color="primary"
            />
          </div>
        )}
      </SectionMain>
    </>
  );
};

UserManagementPage.getLayout = function getLayout(page: ReactElement) {
  return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
};

export default withAuth(UserManagementPage, ['admin']);
