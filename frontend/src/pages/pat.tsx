import {
    mdiAccount,
    mdiGithub,
    mdiPlus,
    mdiDelete,
    mdiContentCopy
  } from '@mdi/js';
  import { Formik, Form, Field } from 'formik';
  import Head from 'next/head';
  import type { ReactElement } from 'react';
  import Button from '../components/Button';
  import Buttons from '../components/Buttons';
  import CardBox from '../components/CardBox';
  import CardBoxComponentBody from '../components/CardBox/Component/Body';
  import CardBoxComponentFooter from '../components/CardBox/Component/Footer';
  import FormField from '../components/Form/Field';
  import LayoutAuthenticated from '../layouts/Authenticated';
  import SectionMain from '../components/Section/Main';
  import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton';
  import { getPageTitle } from '../config';
  import { useAppSelector, useAppDispatch } from '../stores/hooks';
  import axios from 'axios';
  import { useEffect, useState } from 'react';
  import Cookies from 'js-cookie';
  import { initializeUser } from '../stores/mainSlice';
  import DatePicker from 'react-datepicker';
  import 'react-datepicker/dist/react-datepicker.css';
  import { useBackendUrl } from '../contexts/BackendUrlContext';
  
  const PatManagementPage = () => {
    const dispatch = useAppDispatch();
    const userId = useAppSelector((state) => state.main.userName);
    const [pats, setPats] = useState([]);
    const [expiryDate, setExpiryDate] = useState<Date | null>(null);
    const [isUnlimited, setIsUnlimited] = useState(false);
    const { backendUrl } = useBackendUrl();
    const [isBackendUrlLoaded, setIsBackendUrlLoaded] = useState(false);
    
    useEffect(() => {
      if (backendUrl) {
        setIsBackendUrlLoaded(true);
      }
    }, [backendUrl]);
    
    useEffect(() => {
      if (isBackendUrlLoaded) {
        dispatch(initializeUser());
        fetchPats();
      }
    }, [dispatch, isBackendUrlLoaded]);
    
    const fetchPats = async () => {
      if (!isBackendUrlLoaded) return;
    
      try {
        const token = Cookies.get('token');
        const response = await axios.get(`${backendUrl}/get-pat`, {
          params: { user_id: userId },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPats(response.data);
      } catch (error) {
        console.error('Error fetching PATs:', error);
      }
    };
    
    const handleGeneratePat = async () => {
      if (!isBackendUrlLoaded) return;
    
      try {
        const token = Cookies.get('token');
        const response = await axios.post(
          `${backendUrl}/generate_pat`,
          {
            user_id: userId,
            expiry_days: isUnlimited ? null : (expiryDate ? Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        alert('PAT generated successfully');
        fetchPats();  // Refresh the PAT list
      } catch (error) {
        console.error('Error generating PAT:', error);
        alert('Failed to generate PAT');
      }
    };
    
    const handleDeletePat = async (pat_id: string) => {
      try {
        const token = Cookies.get('token');
        await axios.post(
          `${backendUrl}/delete_pat`,
          { pat_id },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        alert('PAT deleted successfully');
        fetchPats();  // Refresh the PAT list
      } catch (error) {
        console.error('Error deleting PAT:', error);
        alert('Failed to delete PAT');
      }
    };
  
    const maskToken = (token: string) => {
      return token.slice(0, 4) + '****' + token.slice(-4);
    };
  
    const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text).then(() => {
        alert('Token copied to clipboard');
      }).catch((err) => {
        console.error('Could not copy text: ', err);
      });
    };
  
    const utcToLocal = (utcString: string) => {
      const utcDate = new Date(utcString);
      return utcDate.toLocaleString();
    };
  
    return (
      <>
        <Head>
          <title>{getPageTitle('PAT Management')}</title>
        </Head>
  
        <SectionMain>
          <SectionTitleLineWithButton icon={mdiAccount} title="PAT Management" main>
            <Button
              href="https://github.com/NerdyNot/NerdyOps"
              target="_blank"
              icon={mdiGithub}
              label="Star on GitHub"
              color="contrast"
              roundedFull
              small
            />
          </SectionTitleLineWithButton>
  
          <CardBox className="mb-6">
            <Formik
              initialValues={{ expiryDate: null, isUnlimited: false }}
              onSubmit={handleGeneratePat}
            >
              {({ values, setFieldValue }) => (
                <Form className="flex flex-col flex-1">
                  <CardBoxComponentBody>
                    <FormField
                      label="Expiry Date"
                      help="Select the expiry date. Leave blank for no expiry."
                      labelFor="expiryDate"
                    >
                      <DatePicker
                        selected={expiryDate}
                        onChange={(date: Date | null) => {
                          setExpiryDate(date);
                          setFieldValue('expiryDate', date);
                        }}
                        dateFormat="yyyy/MM/dd"
                        className="form-input"
                        disabled={isUnlimited}
                      />
                    </FormField>
                    <div className="flex items-center mt-4">
                      <Field
                        type="checkbox"
                        name="isUnlimited"
                        id="isUnlimited"
                        checked={isUnlimited}
                        onChange={(e) => {
                          setIsUnlimited(e.target.checked);
                          setFieldValue('isUnlimited', e.target.checked);
                        }}
                        className="form-checkbox"
                      />
                      <label htmlFor="isUnlimited" className="ml-2">
                        No Expiry
                      </label>
                    </div>
                  </CardBoxComponentBody>
                  <CardBoxComponentFooter>
                    <Buttons>
                      <Button color="info" type="submit" label="Generate PAT" icon={mdiPlus} />
                    </Buttons>
                  </CardBoxComponentFooter>
                </Form>
              )}
            </Formik>
          </CardBox>
  
          <CardBox className="overflow-x-auto">
            <table className="table-auto w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2">PAT ID</th>
                  <th className="px-4 py-2">Token</th>
                  <th className="px-4 py-2">Expiry Date</th>
                  <th className="px-4 py-2">Created At</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pats.map((pat) => (
                  <tr key={pat.pat_id}>
                    <td className="border px-4 py-2">{pat.pat_id}</td>
                    <td className="border px-4 py-2">
                      <div className="flex items-center">
                        {maskToken(pat.token)}
                        <Button
                          color="info"
                          size="small"
                          icon={mdiContentCopy}
                          onClick={() => copyToClipboard(pat.token)}
                          className="ml-2"
                        />
                      </div>
                    </td>
                    <td className="border px-4 py-2">{pat.expiry_date ? utcToLocal(pat.expiry_date) : 'No Expiry'}</td>
                    <td className="border px-4 py-2">{utcToLocal(pat.created_at)}</td>
                    <td className="border px-4 py-2">
                      <Button color="danger" label="Delete" icon={mdiDelete} onClick={() => handleDeletePat(pat.pat_id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBox>
        </SectionMain>
      </>
    );
  };
  
  PatManagementPage.getLayout = function getLayout(page: ReactElement) {
    return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
  };
  
  export default PatManagementPage;
  