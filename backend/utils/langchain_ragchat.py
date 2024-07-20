import logging
import json
import os
import random
import time
from typing import List
from langchain_core.prompts import PromptTemplate, ChatPromptTemplate
from langchain_google_community import GoogleSearchResults, GoogleSearchAPIWrapper
from langchain.agents import AgentExecutor, create_react_agent, Tool
from langchain_community.document_loaders import WebBaseLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain.tools.retriever import create_retriever_tool
from langchain.schema import Document
from utils.langchain_llm import get_llm, get_embedding
from utils.db import get_api_key

# Import Redis Chat Message History
from langchain_community.chat_message_histories import RedisChatMessageHistory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from utils.redis_connection import get_redis_url

logging.basicConfig(level=logging.INFO)

# Get Redis URL from utils.redis_connection
REDIS_URL = get_redis_url()

# Function to handle non-RAG chat and stream the response via WebSocket
def handle_non_rag_chat(ws, query: str, session_id: str):

    # Define the prompt template for handling non-RAG chat
    template = ChatPromptTemplate.from_template("""
    You are a highly knowledgeable assistant. Your task is to provide a detailed answer to the user's question.
    Please respond thoroughly and accurately.

    Question: {input}
    """)

    # Function to split text into chunks
    def split_text_into_chunks_with_newlines(text, chunk_size=100):
        chunks = []
        current_chunk = []
        current_length = 0

        lines = text.split('\n')
        for line in lines:
            words = line.split(' ')
            for word in words:
                if current_length + len(word) + 1 <= chunk_size:
                    current_chunk.append(word)
                    current_length += len(word) + 1
                else:
                    chunks.append(' '.join(current_chunk))
                    current_chunk = [word]
                    current_length = len(word) + 1
            current_chunk.append('\n')
            current_length += 1

        if current_chunk:
            chunks.append(' '.join(current_chunk).strip())

        return chunks

    llm = get_llm()
    if not llm:
        raise ValueError("LLM configuration not set. Please set the configuration using the admin settings page.")

    # Set up the prompt with chat history
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "You're an assistant."),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{question}"),
        ]
    )

    chain = prompt | llm

    chain_with_history = RunnableWithMessageHistory(
        chain,
        lambda session_id: RedisChatMessageHistory(
            session_id, url=REDIS_URL
        ),
        input_messages_key="question",
        history_messages_key="history",
    )

    config = {"configurable": {"session_id": session_id}}

    # Split query into manageable chunks
    chunks = split_text_into_chunks_with_newlines(query)

    for chunk in chunks:
        input_data = {"question": chunk}
        
        success = False
        retries = 3
        while not success and retries > 0:
            try:
                # Use the chain to stream the response
                stream = chain_with_history.stream(input_data, config=config)

                for stream_chunk in stream:
                    if hasattr(stream_chunk, 'content'):
                        ws.send(json.dumps({"output": stream_chunk.content}))
                    else:
                        logging.error("Chunk does not have content attribute: {}".format(stream_chunk))
                success = True
            except Exception as e:
                logging.error(f"Error during chat response chunk: {e}")
                retries -= 1
                if retries > 0:
                    sleep_time = random.uniform(1, 3)
                    logging.info(f"Retrying in {sleep_time:.2f} seconds...")
                    time.sleep(sleep_time)
                else:
                    logging.error("Max retries reached. Skipping this chunk.")

# Combined function for agent creation and WebSocket handling
def handle_rag_chat(ws, query, session_id):
    # Function to load webpage content
    def load_webpage(url: str) -> List[str]:
        loader = WebBaseLoader([url])
        loader.requests_kwargs = {'verify': False}
        docs = loader.load()

        # Check if docs is a list of strings or list of document objects
        if all(isinstance(doc, str) for doc in docs):
            cleaned_docs = [doc.replace('\n', ' ').replace('\t', ' ') for doc in docs]
        else:
            cleaned_docs = [doc.page_content.replace('\n', ' ').replace('\t', ' ') for doc in docs]
        
        # Convert to Document objects
        doc_objs = [Document(page_content=doc) for doc in cleaned_docs]
        
        return doc_objs

    # Function to load and retrieve content
    def load_and_retrieve(url: str, query: str):
        docs = load_webpage(url)
        documents = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200).split_documents(docs)
        vector = FAISS.from_documents(documents, get_embedding())
        retriever = vector.as_retriever()
        retriever_tool = create_retriever_tool(retriever, "dynamic_search", "Search within dynamically loaded web content.")
        return retriever_tool.func(query)
    
    # Function to create Google Search API Wrapper
    def create_google_search_wrapper():
        os.environ["GOOGLE_CSE_ID"] = get_api_key('GOOGLE_CSE_ID') or 'default_cse_id'
        os.environ["GOOGLE_API_KEY"] = get_api_key('GOOGLE_SEARCH_KEY') or 'default_search_key'
        return GoogleSearchAPIWrapper()
    
    googlesearch = create_google_search_wrapper()
    search_tool = GoogleSearchResults(api_wrapper=googlesearch, num_results=4)

    # Tool definitions
    web_loader_tool = Tool(name="WebLoader", description="Load webpage content from a URL and use retriever to search within it.", func=lambda url: load_and_retrieve(url, query))

    tools = [search_tool, web_loader_tool]

    # Define the prompt template for the agent
    template = '''
**Instructions:**
- Do your best to answer the following question. You can use the following tools: {tools}
- To optimize token usage, the agent logic is executed in English.
- The final answer must be translated to match the questioner's language. Make sure to translate only the final answer.
- Tasks that do not require searches and can be handled by the LLM itself should not use tools.

Use the following format:

  Question: The input question to be answered
  Thought: Always think about what needs to be done
  Action: The action to be taken, must be one of [{tool_names}]
  Action Input: The input for the action
  Observation: The result of the action
  ... (This thought/action/action input/observation can be repeated 2 times)
  Thought: Now I know the final answer
  Final Answer: Write Only the final answer to the original input question in the same language, including the source links used from the tools.

Tool Usage Guidelines:
- If "from the web," "web search," etc. are mentioned, perform a search.
- If the answer requires the latest data (e.g., today's weather, news), perform a search.
- If a link is directly provided or if the content cannot be summarized solely from search results, use the WebLoader.
- For all other basic responses, provide answers using the LLM itself.
- When referencing the web, include the link in the final answer as **[Reference Link Name](url)**(\n**[Reference Link Name](url)**...\n**[Reference Link Name](url)**).

Get started!

Question: {input}
Thought: {agent_scratchpad}
'''

    prompt = PromptTemplate.from_template(template)

    # Create LLM model
    llm = get_llm()
    search_agent = create_react_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(
        agent=search_agent,
        tools=tools,
        verbose=True,
        return_intermediate_steps=True,
        handle_parsing_errors=True,
        max_iterations=5
    )

    chain_with_history = RunnableWithMessageHistory(
        agent_executor,
        lambda session_id: RedisChatMessageHistory(
            session_id, url=REDIS_URL
        ),
        input_messages_key="input",
        history_messages_key="history",
    )

    config = {"configurable": {"session_id": session_id}}

    # Perform agent execution without streaming
    response = chain_with_history.invoke({"input": query}, config=config)
    logging.info(response["output"])
    if ws:
        ws.send(json.dumps({"output": response["output"]}))
    else:
        return response