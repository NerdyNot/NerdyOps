import {
  mdiChat,
  mdiSend,
  mdiToggleSwitch,
  mdiToggleSwitchOff,
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
  const [currentMessage, setCurrentMessage] = useState<string>(''); // 현재 진행 중인 메시지 상태 추가
  const [loading, setLoading] = useState<boolean>(false);
  const [isRagEnabled, setIsRagEnabled] = useState<boolean>(false); // RAG 상태 추가
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
  }, [chatMessages, currentMessage]);

  const handleSendMessage = async (values: { message: string }, { resetForm }: any) => {
    setLoading(true);
    setChatMessages((prev) => [...prev, { user: true, text: values.message }]);
    setCurrentMessage(''); // 현재 메시지 초기화

    const wsUrl = `/api/ws/chat`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connection opened');
      ws.current?.send(JSON.stringify({ ...values, isRagEnabled })); // RAG 상태와 함께 메시지 전송
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setLoading(false);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setCurrentMessage((prev) => prev + data.output); // 현재 메시지에 청크 추가

      if (data.isFinal) {
        setChatMessages((prev) => [...prev, { user: false, text: prev + data.output }]); // 최종 메시지로 추가
        setCurrentMessage(''); // 현재 메시지 초기화
        setLoading(false);
        resetForm();
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
      setLoading(false);
    };
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>, handleSubmit: () => void) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <Head>
        <title>{getPageTitle('RAG Chat')}</title>
      </Head>

      <SectionMain>
        <SectionTitleLineWithButton icon={mdiChat} title="RAG Chat" main />
        <div className="flex justify-end mb-4">
          <Button
            icon={isRagEnabled ? mdiToggleSwitch : mdiToggleSwitchOff}
            label={`RAG ${isRagEnabled ? 'Enabled' : 'Disabled'}`}
            color={isRagEnabled ? 'success' : 'secondary'}
            onClick={() => setIsRagEnabled(!isRagEnabled)}
          />
        </div>
        <div className="flex flex-col h-full">
          <CardBox className="flex-grow flex flex-col h-full">
            <div className="flex-grow overflow-auto p-4" ref={chatBoxRef}>
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 p-2 rounded-md ${
                    message.user ? 'bg-blue-500 text-white self-end' : 'bg-gray-300 self-start'
                  }`}
                  style={{ maxWidth: '100%' }}
                >
                  <ReactMarkdown
                    children={message.text}
                    components={{
                      a: ({ ...props }) => <a target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold' }} {...props} />, // 새 창에서 링크 열기
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
              {currentMessage && (
                <div className="mb-4 p-2 rounded-md bg-gray-300 self-start" style={{ maxWidth: '100%' }}>
                  <ReactMarkdown
                    children={currentMessage}
                    components={{
                      a: ({ ...props }) => <a target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold' }} {...props} />, // 새 창에서 링크 열기
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
              )}
            </div>
            <Formik
              initialValues={{ message: '' }}
              onSubmit={handleSendMessage}
            >
              {({ handleSubmit }) => (
                <Form className="flex p-4 border-t">
                  <Field
                    name="message"
                    id="message"
                    placeholder="Enter message..."
                    className="flex-grow p-2 border rounded mr-2"
                    as="textarea"
                    rows={1}
                    onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => handleKeyDown(e, handleSubmit)}
                  />
                  <Button
                    color="info"
                    type="submit"
                    label={loading ? 'Sending...' : 'Send'}
                    icon={mdiSend}
                    disabled={loading}
                  />
                </Form>
              )}
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
