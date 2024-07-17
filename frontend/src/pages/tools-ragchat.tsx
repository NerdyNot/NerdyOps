import {
    mdiChat,
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
  
  const ChatbotPage = () => {
    const [chatMessages, setChatMessages] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const ws = useRef<WebSocket | null>(null);
    const chatBoxRef = useRef<HTMLDivElement | null>(null);
  
    useEffect(() => {
      return () => {
        if (ws.current) {
          ws.current.close();
        }
      };
    }, []);
  
    useEffect(() => {
      if (chatBoxRef.current) {
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }
    }, [chatMessages]);
  
    const handleSendMessage = async (values: { message: string }) => {
      setLoading(true);
      setChatMessages((prev) => [...prev, `User: ${values.message}`]);
  
      const wsUrl = `/api/ws/chat`;
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
        setChatMessages((prev) => [...prev, `Bot: ${data.response}`]);
        setLoading(false);
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
          <title>{getPageTitle('RAG Chat')}</title>
        </Head>
  
        <SectionMain>
          <SectionTitleLineWithButton icon={mdiChat} title="RAG Chat" main />
          <div className="grid gap-6">
            <CardBox>
              <Formik
                initialValues={{
                  message: '',
                }}
                onSubmit={handleSendMessage}
              >
                <Form className="flex flex-col">
                  <div className="p-4">
                    <FormField
                      label="Message"
                      help="Enter your message to the chatbot."
                      labelFor="message"
                      icons={[mdiTextBox]}
                    >
                      <Field
                        name="message"
                        id="message"
                        placeholder="Enter message..."
                        className="w-full p-2 border rounded"
                        as="textarea"
                        rows={3}
                        onInput={autoResize}
                        style={{ minHeight: '50px', maxHeight: '150px', overflow: 'auto' }}
                      />
                    </FormField>
                    
                    <div className="p-4 border-t">
                      <Button 
                        color="info" 
                        type="submit"
                        label={loading ? "Sending..." : "Send Message"} 
                        icon={loading ? "spinner-border spinner-border-sm" : mdiSend} 
                        disabled={loading}
                      />
                    </div>
  
                    <FormField
                      label="Chat Messages"
                      help="The conversation will appear here."
                      labelFor="chatBox"
                      icons={[mdiChat]}
                    >
                      <div className="w-full p-2 border rounded bg-gray-100" style={{ minHeight: '150px', maxHeight: '300px', overflow: 'auto' }} ref={chatBoxRef}>
                        {chatMessages.map((message, index) => (
                          <ReactMarkdown key={index} children={message} />
                        ))}
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
  
  ChatbotPage.getLayout = function getLayout(page: ReactElement) {
    return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
  };
  
  export default ChatbotPage;
  