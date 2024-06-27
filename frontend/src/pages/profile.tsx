// pages/profile.tsx
import {
  mdiAccount,
  mdiAsterisk,
  mdiFormTextboxPassword,
  mdiGithub,
  mdiMail,
} from '@mdi/js';
import { Formik, Form, Field } from 'formik';
import Head from 'next/head';
import type { ReactElement } from 'react';
import Button from '../components/Button';
import Buttons from '../components/Buttons';
import Divider from '../components/Divider';
import CardBox from '../components/CardBox';
import CardBoxComponentBody from '../components/CardBox/Component/Body';
import CardBoxComponentFooter from '../components/CardBox/Component/Footer';
import FormField from '../components/Form/Field';
import LayoutAuthenticated from '../layouts/Authenticated';
import SectionMain from '../components/Section/Main';
import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton';
import CardBoxUser from '../components/CardBox/User';
import type { UserForm } from '../interfaces';
import { getPageTitle } from '../config';
import { useAppSelector, useAppDispatch } from '../stores/hooks';
import axios from 'axios';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { initializeUser } from '../stores/mainSlice';
import { useEffect } from 'react';

const ProfilePage = () => {
  const dispatch = useAppDispatch();
  const userName = useAppSelector((state) => state.main.userName);
  const userEmail = useAppSelector((state) => state.main.userEmail);
  const userRole = useAppSelector((state) => state.main.userRole);
  const router = useRouter();

  useEffect(() => {
    dispatch(initializeUser());
  }, [dispatch]);

  const userForm: UserForm = {
    name: userName || '',
    email: userEmail || '',
  };

  const handlePasswordChange = async (values: {
    currentPassword: string;
    newPassword: string;
    newPasswordConfirmation: string;
  }) => {
    if (values.newPassword !== values.newPasswordConfirmation) {
      alert('New passwords do not match');
      return;
    }

    try {
      const token = Cookies.get('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL}/change-password`,
        {
          current_password: values.currentPassword,
          new_password: values.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        alert('Password changed successfully');
        router.push('/');
      } else {
        alert('Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('An error occurred while changing the password');
    }
  };

  return (
    <>
      <Head>
        <title>{getPageTitle('Profile')}</title>
      </Head>

      <SectionMain>
        <SectionTitleLineWithButton icon={mdiAccount} title="Profile" main>
          <Button
            href="https://github.com/justboil/admin-one-react-tailwind"
            target="_blank"
            icon={mdiGithub}
            label="Star on GitHub"
            color="contrast"
            roundedFull
            small
          />
        </SectionTitleLineWithButton>

        <CardBoxUser className="mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <CardBox className="flex-1" hasComponentLayout>
              <Formik
                initialValues={userForm}
                onSubmit={(values: UserForm) => alert('Profile information is read-only')}
                enableReinitialize={true}
              >
                <Form className="flex flex-col flex-1">
                  <CardBoxComponentBody>
                    <FormField
                      label="Name"
                      help="Required. Your name"
                      labelFor="name"
                      icons={[mdiAccount]}
                    >
                      <Field name="name" id="name" placeholder="Name" readOnly />
                    </FormField>
                    <FormField
                      label="E-mail"
                      help="Required. Your e-mail"
                      labelFor="email"
                      icons={[mdiMail]}
                    >
                      <Field name="email" id="email" placeholder="E-mail" readOnly />
                    </FormField>
                    <FormField
                      label="Role"
                      help="Your role"
                      labelFor="role"
                      icons={[mdiAccount]}
                    >
                      <Field name="role" id="role" placeholder="Role" value={userRole || ''} readOnly />
                    </FormField>
                  </CardBoxComponentBody>
                </Form>
              </Formik>
            </CardBox>
          </div>

          <CardBox hasComponentLayout>
            <Formik
              initialValues={{
                currentPassword: '',
                newPassword: '',
                newPasswordConfirmation: '',
              }}
              onSubmit={handlePasswordChange}
            >
              <Form className="flex flex-col flex-1">
                <CardBoxComponentBody>
                  <FormField
                    label="Current password"
                    help="Required. Your current password"
                    labelFor="currentPassword"
                    icons={[mdiAsterisk]}
                  >
                    <Field
                      name="currentPassword"
                      id="currentPassword"
                      type="password"
                      autoComplete="current-password"
                    />
                  </FormField>

                  <Divider />

                  <FormField
                    label="New password"
                    help="Required. New password"
                    labelFor="newPassword"
                    icons={[mdiFormTextboxPassword]}
                  >
                    <Field
                      name="newPassword"
                      id="newPassword"
                      type="password"
                      autoComplete="new-password"
                    />
                  </FormField>

                  <FormField
                    label="Confirm password"
                    help="Required. New password one more time"
                    labelFor="newPasswordConfirmation"
                    icons={[mdiFormTextboxPassword]}
                  >
                    <Field
                      name="newPasswordConfirmation"
                      id="newPasswordConfirmation"
                      type="password"
                      autoComplete="new-password"
                    />
                  </FormField>
                </CardBoxComponentBody>

                <CardBoxComponentFooter>
                  <Buttons>
                    <Button color="info" type="submit" label="Submit" />
                  </Buttons>
                </CardBoxComponentFooter>
              </Form>
            </Formik>
          </CardBox>
        </div>
      </SectionMain>
    </>
  );
};

ProfilePage.getLayout = function getLayout(page: ReactElement) {
  return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
};

export default ProfilePage;
