import logging
import asyncio
import json
import os
from typing import List
from langchain_core.prompts import PromptTemplate
from langchain_community.tools import GoogleSearchResults
from langchain_community.utilities import GoogleSearchAPIWrapper
from langchain.agents import AgentExecutor, create_react_agent, Tool
from langchain_community.document_loaders import WebBaseLoader
from utils.langchain_llm import get_llm, get_embedding
from utils.db import get_api_key
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import FAISS
from langchain.tools.retriever import create_retriever_tool

logging.basicConfig(level=logging.INFO)

# Define the prompt template for the agent
template = '''**Instructions:**
- Do your best to answer the following question. You can use the following tools: {tools}
- To optimize token usage, the agent logic is executed in English.
- Tasks that do not require searches and can be handled by the LLM itself should not use tools.

Use the following format:

Question: {input}
Thought: {agent_scratchpad}
Action: The action to be taken, must be one of [{tool_names}]
Action Input: The input for the action
Observation: The result of the action
... (This thought/action/action input/observation can be repeated 2 times)
Thought: Now I know the final answer
Final Answer: Write Only the final answer to the original input question in the same language, including the source links used from the tools.

Tool Usage Guidelines:
- Use the Google search tool to find information if the answer is expected to be simple or if you need to gather general information quickly. When using the search tool, refine the search terms to display more specific information.
- Use the WebLoader tool to load content from a provided URL if more detailed or specific information is needed. Respond based on the content. When selecting a URL to apply to the WebLoader tool, choose a URL that includes useful information for the questioner.
- After using the WebLoader tool, extract the key information from the loaded content to provide a summary. If needed, refine the information using dynamic search.

Get started!

Question: {input}
Thought: {agent_scratchpad}
'''

prompt = PromptTemplate.from_template(template)

embedding = get_embedding()

# Function to load webpage content
def load_webpage(url: str) -> List[str]:
    loader = WebBaseLoader([url])
    loader.requests_kwargs = {'verify': False}
    docs = loader.load()
    # Remove \n and \t from the loaded documents
    cleaned_docs = [doc.page_content.replace('\n', ' ').replace('\t', ' ') for doc in docs]
    return cleaned_docs

def load_and_retrieve(url: str, query: str):
    docs = load_webpage(url)
    documents = RecursiveCharacterTextSplitter(
        chunk_size=1000, chunk_overlap=200
    ).split_documents(docs)
    vector = FAISS.from_documents(documents, embedding)
    retriever = vector.as_retriever()
    retriever_tool = create_retriever_tool(
        retriever,
        "dynamic_search",
        "Search within dynamically loaded web content."
    )
    return retriever_tool.func(query)

# Google Search API Wrapper
def create_google_search_wrapper():
    os.environ["GOOGLE_CSE_ID"] = get_api_key('GOOGLE_CSE_ID') or 'default_cse_id'
    os.environ["GOOGLE_API_KEY"] = get_api_key('GOOGLE_SEARCH_KEY') or 'default_search_key'
    return GoogleSearchAPIWrapper()

# Function to create agent executor
def create_agent_executor():
    googlesearch = create_google_search_wrapper()
    search_tool = GoogleSearchResults(api_wrapper=googlesearch, num_results=4)

    # Tool definitions
    search_tool_def = Tool(
        name="Google Search",
        description="Search Google for recent results.",
        func=search_tool,
    )

    web_loader_tool = Tool(
        name="WebLoader",
        description="Load webpage content from a URL and use retriever to search within it.",
        func=load_and_retrieve,
    )


    tools = [search_tool_def, web_loader_tool]

    # Create LLM model using get_llm function
    llm = get_llm()

    # Create the agent
    search_agent = create_react_agent(llm, tools, prompt)
    return AgentExecutor(
        agent=search_agent,
        tools=tools,
        verbose=True,
        return_intermediate_steps=True,
        handle_parsing_errors=True,  # Handle parsing errors to retry
        max_iterations=5  # Limit the number of iterations to 5
    )

# Function to handle chat WebSocket
def handle_chat_websocket(ws, query):
    agent_executor = create_agent_executor()  # Create agent executor when a request is made
    
    # Perform agent execution without streaming
    response = agent_executor({"input": query})
    logging.info(response)    
    # Send the final response
    ws.send(json.dumps({"output": response["output"]}))

