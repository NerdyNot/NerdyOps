import {
  mdiCodeTags,
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
import FormField from '../components/Form/Field';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const CodeGenerationPage = () => {
  const [codeResult, setCodeResult] = useState<string>('');
  const [codeExplanation, setCodeExplanation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const ws = useRef<WebSocket | null>(null);
  const codeResultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (codeResultRef.current) {
      codeResultRef.current.style.height = 'auto';
      codeResultRef.current.style.height = `${codeResultRef.current.scrollHeight}px`;
      codeResultRef.current.scrollTop = codeResultRef.current.scrollHeight;
    }
  }, [codeResult, codeExplanation]);

  const handleCodeGeneration = async (values: {
    description: string;
    language: string;
  }) => {
    setCodeResult('');
    setCodeExplanation('');
    setLoading(true);

    const wsUrl = `/api/ws/generate-and-explain`;
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
      if (data.type === "code") {
        setCodeResult((prev) => prev + data.content);
      } else if (data.type === "explanation") {
        setCodeExplanation((prev) => prev + data.content);
      } else if (data.error) {
        console.error('Error:', data.error);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
      setLoading(false);
    };
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
                    help="Enter the description for the code you want to generate."
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
                      style={{ minHeight: '100px', maxHeight: '300px', overflow: 'auto' }}
                    />
                  </FormField>

                  <FormField
                    label="Programming Language"
                    help="Select the programming language for the code generation."
                    labelFor="language"
                    icons={[mdiCodeTags]}
                  >
                    <Field
                      as="select"
                      name="language"
                      id="language"
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select programming language...</option>
                      <option value="bash">Bash</option>
                      <option value="powershell">Powershell</option>
                      <option value="sql">SQL</option>
                      <option value="python">Python</option>
                      <option value="powershell">Terraform</option>
                      <option value="powershell">Helm Template</option>
                      <option value="powershell">Ansible Playbook</option>
                      <option value="powershell">Dockerfile</option>
                      <option value="powershell">docker-compose YAML</option>
                      <option value="powershell">Kubernetes YAML</option>
                      <option value="html">HTML</option>
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="delphi">Delphi</option>
                      <option value="java">Java</option>
                      <option value="csharp">C#</option>
                      <option value="cpp">C++</option>
                      <option value="ruby">Ruby</option>
                      <option value="go">Go</option>
                      <option value="php">PHP</option>
                      <option value="swift">Swift</option>
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
                    <div className="w-full p-2 border rounded bg-gray-100" style={{ minHeight: '150px', maxHeight: '300px', overflow: 'auto' }} ref={codeResultRef}>
                      <ReactMarkdown
                        children={codeResult}
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                              <SyntaxHighlighter
                                children={String(children).replace(/\n$/, '')}
                                style={atomDark}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              />
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            )
                          }
                        }}
                      />
                    </div>
                  </FormField>

                  <FormField
                    label="Code Explanation"
                    help="The explanation for the generated code will appear here."
                    labelFor="codeExplanation"
                    icons={[mdiTextBox]}
                  >
                    <div className="w-full p-2 border rounded bg-gray-100" style={{ minHeight: '150px', maxHeight: '500px', overflow: 'auto' }}>
                      <ReactMarkdown children={codeExplanation} />
                    </div>
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

CodeGenerationPage.getLayout = function getLayout(page: ReactElement) {
  return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
};

export default CodeGenerationPage;
