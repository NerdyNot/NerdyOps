import {
  mdiTranslate,
  mdiTextBox,
  mdiSend,
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
import { useBackendUrl } from '../contexts/BackendUrlContext';
import FormField from '../components/Form/Field';

const TranslatePage = () => {
  const { backendUrl } = useBackendUrl();
  const [translationResult, setTranslationResult] = useState<string>('');
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (ws.current) {
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.translated_text) {
          setTranslationResult((prev) => prev + data.translated_text);
        }
      };
    }

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const handleTranslation = async (values: {
    text: string;
    targetLanguage: string;
    purpose: string;
  }) => {
    setTranslationResult('');
    ws.current = new WebSocket(`${backendUrl.replace(/^http/, 'ws')}/ws/translate`);
    
    ws.current.onopen = () => {
      ws.current?.send(JSON.stringify(values));
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  return (
    <>
      <Head>
        <title>{getPageTitle('Translate')}</title>
      </Head>

      <SectionMain>
        <SectionTitleLineWithButton icon={mdiTranslate} title="Translate" main />
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
                    />
                  </FormField>

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
                    />
                  </FormField>
                </div>

                <div className="p-4 border-t">
                  <Button color="info" type="submit" label="Translate" icon={mdiSend} />
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
