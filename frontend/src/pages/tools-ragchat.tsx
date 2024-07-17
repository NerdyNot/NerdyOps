import {
  mdiChat,
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
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const ChatbotPage = () => {
  const [chatMessages, setChatMessages] = useState<{ user: boolean; text: string }[]>([]);
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
    setChatMessages((prev) => [...prev, { user: true, text: values.message }]);

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
      setChatMessages((prev) => [...prev, { user: false, text: data.output }]);
      setLoading(false);
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
      setLoading(false);
    };
  };

  return (
    <>
      <Head>
        <title>{getPageTitle('Chatbot')}</title>
      </Head>

      <SectionMain>
        <SectionTitleLineWithButton icon={mdiChat} title="Chatbot" main />
        <div className="flex flex-col h-full">
          <CardBox className="flex-grow flex flex-col h-full">
            <div className="flex-grow overflow-auto p-4" ref={chatBoxRef}>
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 p-2 rounded-md max-w-xs ${
                    message.user ? 'bg-blue-500 text-white self-end' : 'bg-gray-300 self-start'
                  }`}
                >
                  <ReactMarkdown
                    children={message.text}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
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
                        );
                      },
                    }}
                  />
                </div>
              ))}
            </div>
            <Formik
              initialValues={{ message: '' }}
              onSubmit={handleSendMessage}
            >
              <Form className="flex p-4 border-t">
                <Field
                  name="message"
                  id="message"
                  placeholder="Enter message..."
                  className="flex-grow p-2 border rounded mr-2"
                  as="textarea"
                  rows={1}
                />
                <Button
                  color="info"
                  type="submit"
                  label={loading ? 'Sending...' : 'Send'}
                  icon={mdiSend}
                  disabled={loading}
                />
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
