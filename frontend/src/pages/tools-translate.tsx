import {
  mdiTranslate,
  mdiTextBox,
  mdiSend,
  mdiFileUpload,
  mdiDownload,
} from '@mdi/js';
import { Formik, Form, Field } from 'formik';
import Head from 'next/head';
import type { ReactElement } from 'react';
import { useEffect, useState, useRef } from 'react';
import Button from '../components/Button';
import CardBox from '../components/CardBox';
import LayoutAuthenticated from '../layouts/Authenticated';
import SectionMain from '../components/Section/Main';
import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton';
import { getPageTitle } from '../config';
import FormField from '../components/Form/Field';
import axios from 'axios';

const TranslatePage = () => {
  const [translationResult, setTranslationResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [translatedFile, setTranslatedFile] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const translationResultRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (translationResultRef.current) {
      translationResultRef.current.style.height = 'auto';
      translationResultRef.current.style.height = `${translationResultRef.current.scrollHeight}px`;
      translationResultRef.current.scrollTop = translationResultRef.current.scrollHeight;
    }
  }, [translationResult]);

  const handleTranslation = async (values: {
    text: string;
    targetLanguage: string;
    purpose: string;
  }) => {
    setTranslationResult('');
    setLoading(true);
    setTranslatedFile(null);

    if (uploadedFile) {
      // Handle file translation
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('targetLanguage', values.targetLanguage);
      formData.append('purpose', values.purpose);

      try {
        const response = await axios.post(`/api/translate-upload`, formData);
        setTranslatedFile(response.data.translated_file);
        setLoading(false);
      } catch (error) {
        console.error('File translation error:', error);
        setLoading(false);
      }
    } else {
      // Handle text translation via WebSocket
      const wsUrl = `/api/ws/translate`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connection opened');
        ws.current?.send(JSON.stringify(values));
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setLoading(false);
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.translated_text) {
          setTranslationResult((prev) => prev + data.translated_text);
        } else if (data.error) {
          console.error('Translation error:', data.error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket connection closed');
        setLoading(false);
      };
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setUploadedFile(event.target.files[0]);
    }
  };

  const handleDownload = () => {
    if (translatedFile) {
      window.open(`/api/translate-download/${translatedFile}`, '_blank');
      setTranslatedFile(null); // Reset to translate state
    }
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };
  
  return (
    <>
      <Head>
        <title>{getPageTitle('Translator')}</title>
      </Head>

      <SectionMain>
        <SectionTitleLineWithButton icon={mdiTranslate} title="Translator" main />
        <div className="grid gap-6">
          <CardBox>
            <Formik
              initialValues={{
                text: '',
                targetLanguage: '',
                purpose: '',
              }}
              onSubmit={handleTranslation}
            >
              <Form className="flex flex-col">
                <div className="p-4">
                  <FormField
                    label="Purpose"
                    help="Enter the purpose of the translation."
                    labelFor="purpose"
                    icons={[mdiTextBox]}
                  >
                    <Field
                      name="purpose"
                      id="purpose"
                      placeholder="Enter purpose..."
                      className="w-full p-2 border rounded"
                    />
                  </FormField>

                  <FormField
                    label="Target Language"
                    help="Select the target language for translation."
                    labelFor="targetLanguage"
                    icons={[mdiTranslate]}
                  >
                    <Field
                      as="select"
                      name="targetLanguage"
                      id="targetLanguage"
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select target language...</option>
                      <option value="en">English</option>
                      <option value="ko">Korean</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="zh-CN">Simplified Chinese</option>
                      <option value="zh-TW">Traditional Chinese</option>
                      <option value="ja">Japanese</option>
                    </Field>
                  </FormField>

                  <FormField
                    label="Upload File"
                    help="Upload a file to translate."
                    labelFor="file"
                    icons={[mdiFileUpload]}
                  >
                    <input
                      type="file"
                      name="file"
                      id="file"
                      onChange={handleFileUpload}
                      className="w-full p-2 border rounded"
                    />
                  </FormField>

                  <FormField
                    label="Original Text (Detected Automatically)"
                    help="Enter the text you want to translate."
                    labelFor="text"
                    icons={[mdiTextBox]}
                  >
                    <Field
                      name="text"
                      id="text"
                      as="textarea"
                      placeholder="Enter text here..."
                      rows={6}
                      className="w-full p-2 border rounded"
                      onInput={autoResize}
                      style={{ maxHeight: '300px', overflow: 'auto' }}
                    />
                  </FormField>
                  <div className="p-4 border-t">
                    <Button 
                      color="info" 
                      type={translatedFile ? "button" : "submit"}
                      label={loading ? "Translating..." : translatedFile ? "Download" : "Translate"} 
                      icon={loading ? "spinner-border spinner-border-sm" : translatedFile ? mdiDownload : mdiSend} 
                      disabled={loading}
                      onClick={translatedFile ? handleDownload : undefined}
                    />
                  </div>
                  <FormField
                    label="Translated Text"
                    help="The translated text will appear here."
                    labelFor="translationResult"
                    icons={[mdiTranslate]}
                  >
                    <textarea
                      id="translationResult"
                      value={translationResult}
                      readOnly
                      rows={6}
                      className="w-full p-2 border rounded bg-gray-100"
                      ref={translationResultRef}
                      style={{ maxHeight: '300px', overflow: 'auto' }}
                    />
                  </FormField>
                </div>
              </Form>
            </Formik>
          </CardBox>
        </div>
      </SectionMain>
    </>
  );
};

TranslatePage.getLayout = function getLayout(page: ReactElement) {
  return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
};

export default TranslatePage;
