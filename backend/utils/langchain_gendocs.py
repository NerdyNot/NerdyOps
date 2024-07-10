import asyncio
import logging
import re
from typing import Union, Callable
from langchain_community.utilities import GoogleSearchAPIWrapper
from langchain_community.document_loaders import AsyncChromiumLoader
from langchain_community.document_transformers import BeautifulSoupTransformer
from langchain.agents import AgentExecutor, AgentOutputParser, LLMSingleActionAgent
from langchain.chains import LLMChain
from langchain.prompts import StringPromptTemplate
from langchain_core.agents import AgentAction, AgentFinish
from utils.langchain_integration import get_llm
from utils.langchain_translator import split_text_into_chunks_with_newlines

logging.basicConfig(level=logging.INFO)

class CustomPromptTemplate(StringPromptTemplate):
    template: str

    def format(self, **kwargs) -> str:
        intermediate_steps = kwargs.pop("intermediate_steps", [])
        thoughts = ""
        for action, observation in intermediate_steps:
            thoughts += action.log
            thoughts += f"\nObservation: {observation}\nThought: "
        kwargs["agent_scratchpad"] = thoughts
        kwargs["tools"] = ""
        kwargs["tool_names"] = ""
        return self.template.format(**kwargs)

class CustomOutputParser(AgentOutputParser):
    def parse(self, llm_output: str) -> Union[AgentAction, AgentFinish]:
        if "Final Answer:" in llm_output:
            return AgentFinish(
                return_values={"output": llm_output.split("Final Answer:")[-1].strip()},
                log=llm_output,
            )
        regex = r"Action\s*\d*\s*:(.*?)\nAction\s*\d*\s*Input\s*\d*\s*:[\s]*(.*)"
        match = re.search(regex, llm_output, re.DOTALL)
        if not match:
            raise ValueError(f"Could not parse LLM output: `{llm_output}`")
        action = match.group(1).strip()
        action_input = match.group(2)
        return AgentAction(
            tool=action, tool_input=action_input.strip(" ").strip('"'), log=llm_output
        )

# Function to search Google and generate markdown guide
def generate_markdown_guide(query):
    # Perform Google search
    search_results = search_google(query)

    # Extract URLs from search results
    urls = [result['link'] for result in search_results]

    # Scrape HTML content from URLs
    html_docs = asyncio.run(scrape_html(urls))

    # Transform HTML content using BeautifulSoup
    bs_transformer = BeautifulSoupTransformer()
    docs_transformed = bs_transformer.transform_documents(html_docs, tags_to_extract=["p", "li", "div", "a"])

    # Combine extracted contents
    combined_text = "\n\n".join([doc.page_content for doc in docs_transformed])

    # Split text into chunks
    chunks = split_text_into_chunks_with_newlines(combined_text)

    # Initialize LLM
    llm = get_llm()
    if llm is None:
        raise ValueError("Failed to initialize LLM")

    # Define prompt template
    template = """Translate the following text into a markdown guide document:

    {tools}

    Use the following format:

    Text: the input text you must translate
    Thought: you should always think about what to do
    Action: the action to take, should be one of [{tool_names}]
    Action Input: the input to the action
    Observation: the result of the action
    ... (this Thought/Action/Action Input/Observation can repeat N times)
    Thought: I now know the final answer
    Final Answer: the final markdown guide

    Begin!

    Text: {input}
    {agent_scratchpad}"""

    prompt = CustomPromptTemplate(
        template=template,
        input_variables=["input", "intermediate_steps"],
    )

    output_parser = CustomOutputParser()
    llm_chain = LLMChain(llm=llm, prompt=prompt)
    agent = LLMSingleActionAgent(
        llm_chain=llm_chain,
        output_parser=output_parser,
        stop=["\nObservation:"],
        allowed_tools=[],
    )
    agent_executor = AgentExecutor.from_agent_and_tools(agent=agent, tools=[], verbose=True)

    # Translate and generate markdown guide
    markdown_guide = ""
    for chunk in chunks:
        response = agent_executor.invoke({"input": chunk})
        final_answer = response["output"]
        markdown_guide += final_answer + "\n\n"

    return markdown_guide

# Function to perform Google search
def search_google(query, num_results=5):
    search = GoogleSearchAPIWrapper(api_key=os.environ["GOOGLE_API_KEY"], cse_id=os.environ["GOOGLE_CSE_ID"])
    return search.results(query, num_results)

# Function to scrape HTML content
async def scrape_html(urls):
    loader = AsyncChromiumLoader(urls)
    html_docs = await loader.load()
    return html_docs
