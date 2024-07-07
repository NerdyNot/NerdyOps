import {
    mdiMagnify,
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
  
  const SearchPage = () => {
    const [searchResult, setSearchResult] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const ws = useRef<WebSocket | null>(null);
    const searchResultRef = useRef<HTMLTextAreaElement | null>(null);
  
    useEffect(() => {
      return () => {
        if (ws.current) {
          ws.current.close();
        }
      };
    }, []);
  
    useEffect(() => {
      if (searchResultRef.current) {
        searchResultRef.current.style.height = 'auto';
        searchResultRef.current.style.height = `${searchResultRef.current.scrollHeight}px`;
        searchResultRef.current.scrollTop = searchResultRef.current.scrollHeight;
      }
    }, [searchResult]);
  
    const handleSearch = async (values: { query: string }) => {
      setSearchResult('');
      setLoading(true);
  
      // Handle search via WebSocket
      const wsUrl = `/api/ws/search`;
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
        if (data.search_result) {
          setSearchResult((prev) => prev + data.search_result + '\n');
        } else if (data.error) {
          console.error('Search error:', data.error);
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
          <title>{getPageTitle('Search')}</title>
        </Head>
  
        <SectionMain>
          <SectionTitleLineWithButton icon={mdiMagnify} title="Search" main />
          <div className="grid gap-6">
            <CardBox>
              <Formik
                initialValues={{
                  query: '',
                }}
                onSubmit={handleSearch}
              >
                <Form className="flex flex-col">
                  <div className="p-4">
                    <FormField
                      label="Search Query"
                      help="Enter the query you want to search for."
                      labelFor="query"
                      icons={[mdiMagnify]}
                    >
                      <Field
                        name="query"
                        id="query"
                        placeholder="Enter search query..."
                        className="w-full p-2 border rounded"
                      />
                    </FormField>
                    <div className="p-4 border-t">
                      <Button 
                        color="info" 
                        type="submit"
                        label={loading ? "Searching..." : "Search"} 
                        icon={loading ? "spinner-border spinner-border-sm" : mdiSend} 
                        disabled={loading}
                      />
                    </div>
                    <FormField
                      label="Search Results"
                      help="The search results will appear here."
                      labelFor="searchResult"
                      icons={[mdiMagnify]}
                    >
                      <textarea
                        id="searchResult"
                        value={searchResult}
                        readOnly
                        rows={6}
                        className="w-full p-2 border rounded bg-gray-100"
                        ref={searchResultRef}
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
  
  SearchPage.getLayout = function getLayout(page: ReactElement) {
    return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
  };
  
  export default SearchPage;
  