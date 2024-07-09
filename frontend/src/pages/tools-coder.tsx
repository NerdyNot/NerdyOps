import {
    mdiCodeTags,
    mdiTextBox,
    mdiSend,
    mdiUpload,
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
  import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
  import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
  import axios from 'axios';
  
  const CodeGeneratorPage = () => {
    const [codeResult, setCodeResult] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const ws = useRef<WebSocket | null>(null);
    const codeResultRef = useRef<HTMLPreElement | null>(null);
    const [replitApiKey, setReplitApiKey] = useState<string>('');
    const [replitUrl, setReplitUrl] = useState<string>('');
  
    useEffect(() => {
      return () => {
        if (ws.current) {
          ws.current.close();
        }
      };
    }, []);
  
    useEffect(() => {
      if (codeResultRef.current) {
        hljs.highlightElement(codeResultRef.current);
      }
    }, [codeResult]);
  
    const handleCodeGeneration = async (values: {
      description: string;
      language: string;
    }) => {
      setCodeResult('');
      setLoading(true);
  
      const wsUrl = `/api/ws/generate-code`;
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
        if (data.code_chunk) {
          setCodeResult((prev) => prev + data.code_chunk);
        } else if (data.error) {
          console.error('Code generation error:', data.error);
        }
      };
  
      ws.current.onclose = () => {
        console.log('WebSocket connection closed');
        setLoading(false);
      };
    };
  
    const handleReplitExport = async () => {
      if (!replitApiKey) {
        alert("Replit API Key is required.");
        return;
      }
  
      setLoading(true);
  
      try {
        const response = await axios.post('https://replit.com/api/v0/create_repl', {
          title: 'Generated Code',
          language: 'python',  // Replit requires a language; adjust as necessary
          files: {
            'main.py': codeResult,
          }
        }, {
          headers: {
            'Authorization': `Bearer ${replitApiKey}`,
          }
        });
  
        setReplitUrl(response.data.url);
      } catch (error) {
        console.error('Error exporting to Replit:', error);
      } finally {
        setLoading(false);
      }
    };
  
    const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    };
  
    return (
      <>
        <Head>
          <title>{getPageTitle('Code Generator')}</title>
        </Head>
  
        <SectionMain>
          <SectionTitleLineWithButton icon={mdiCodeTags} title="Code Generator" main />
          <div className="grid gap-6">
            <CardBox>
              <Formik
                initialValues={{
                  description: '',
                  language: '',
                }}
                onSubmit={handleCodeGeneration}
              >
                <Form className="flex flex-col">
                  <div className="p-4">
                    <FormField
                      label="Description"
                      help="Enter the description of the code you want to generate."
                      labelFor="description"
                      icons={[mdiTextBox]}
                    >
                      <Field
                        name="description"
                        id="description"
                        placeholder="Enter description..."
                        className="w-full p-2 border rounded"
                        as="textarea"
                        rows={6}
                        onInput={autoResize}
                        style={{ maxHeight: '300px', overflow: 'auto' }}
                      />
                    </FormField>
  
                    <FormField
                      label="Language"
                      help="Select the programming language for code generation."
                      labelFor="language"
                      icons={[mdiCodeTags]}
                    >
                      <Field
                        as="select"
                        name="language"
                        id="language"
                        className="w-full p-2 border rounded"
                      >
                        <option value="">Select language...</option>
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="csharp">C#</option>
                        <option value="cpp">C++</option>
                        <option value="go">Go</option>
                        <option value="ruby">Ruby</option>
                        <option value="php">PHP</option>
                        <option value="typescript">TypeScript</option>
                      </Field>
                    </FormField>
  
                    <div className="p-4 border-t">
                      <Button 
                        color="info" 
                        type="submit"
                        label={loading ? "Generating..." : "Generate Code"} 
                        icon={loading ? "spinner-border spinner-border-sm" : mdiSend} 
                        disabled={loading}
                      />
                    </div>
  
                    <FormField
                      label="Generated Code"
                      help="The generated code will appear here."
                      labelFor="codeResult"
                      icons={[mdiCodeTags]}
                    >
                      <div className="w-full p-2 border rounded bg-gray-100" style={{ maxHeight: '300px', overflow: 'auto' }}>
                        <SyntaxHighlighter language="javascript" style={atomDark}>
                          {codeResult}
                        </SyntaxHighlighter>
                      </div>
                    </FormField>
  
                    <FormField
                      label="Replit API Key"
                      help="Enter your Replit API key to export the generated code."
                      labelFor="replitApiKey"
                      icons={[mdiTextBox]}
                    >
                      <input
                        type="text"
                        name="replitApiKey"
                        id="replitApiKey"
                        value={replitApiKey}
                        onChange={(e) => setReplitApiKey(e.target.value)}
                        placeholder="Enter Replit API key..."
                        className="w-full p-2 border rounded"
                      />
                    </FormField>
  
                    <div className="p-4 border-t">
                      <Button 
                        color="info" 
                        type="button"
                        label={loading ? "Exporting..." : "Export to Replit"} 
                        icon={loading ? "spinner-border spinner-border-sm" : mdiUpload} 
                        disabled={loading || !codeResult}
                        onClick={handleReplitExport}
                      />
                    </div>
  
                    {replitUrl && (
                      <div className="p-4 border-t">
                        <a href={replitUrl} target="_blank" className="text-blue-500 underline">
                          Open Generated Code in Replit
                        </a>
                      </div>
                    )}
                  </div>
                </Form>
              </Formik>
            </CardBox>
          </div>
        </SectionMain>
      </>
    );
  };
  
  CodeGeneratorPage.getLayout = function getLayout(page: ReactElement) {
    return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
  };
  
  export default CodeGeneratorPage;
  