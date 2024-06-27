import React from 'react';
import type { ReactElement } from 'react';
import Head from 'next/head';
import Button from '../components/Button';
import CardBox from '../components/CardBox';
import SectionFullScreen from '../components/Section/FullScreen';
import LayoutGuest from '../layouts/Guest';
import { Field, Form, Formik } from 'formik';
import FormField from '../components/Form/Field';
import FormCheckRadio from '../components/Form/CheckRadio';
import Divider from '../components/Divider';
import Buttons from '../components/Buttons';
import { getPageTitle } from '../config';
import axios from 'axios';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { useDispatch } from 'react-redux';
import { setUser } from '../stores/mainSlice';

type LoginForm = {
  login: string;
  password: string;
  remember: boolean;
};

const LoginPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const handleSubmit = async (formValues: LoginForm) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL}/login`, {
        username: formValues.login,
        password: formValues.password,
      });

      const { token, user_id, username, email, role } = response.data;

      // Save the token in cookies
      Cookies.set('token', token, { expires: formValues.remember ? 7 : 1 });

      // Save the user info in Redux store
      dispatch(setUser({ name: username, email, role }));

      // Redirect to the index page
      router.push('/');
    } catch (err) {
      console.error('Login failed:', err);
      alert('Login failed. Please check your credentials and try again.');
    }
  };

  const initialValues: LoginForm = {
    login: '',
    password: '',
    remember: false,
  };

  return (
    <>
      <Head>
        <title>{getPageTitle('Login')}</title>
      </Head>

      <SectionFullScreen bg="purplePink">
        <CardBox className="w-11/12 md:w-7/12 lg:w-6/12 xl:w-4/12 shadow-2xl">
          <Formik initialValues={initialValues} onSubmit={handleSubmit}>
            <Form>
              <FormField label="Login" help="Please enter your login">
                <Field name="login" />
              </FormField>

              <FormField label="Password" help="Please enter your password">
                <Field name="password" type="password" />
              </FormField>

              <FormCheckRadio type="checkbox" label="Remember">
                <Field type="checkbox" name="remember" />
              </FormCheckRadio>

              <Divider />

              <Buttons>
                <Button type="submit" label="Login" color="info" />
                <Button href="/" label="Home" color="info" outline />
              </Buttons>
            </Form>
          </Formik>
        </CardBox>
      </SectionFullScreen>
    </>
  );
};

LoginPage.getLayout = function getLayout(page: ReactElement) {
  return <LayoutGuest>{page}</LayoutGuest>;
};

export default LoginPage;
