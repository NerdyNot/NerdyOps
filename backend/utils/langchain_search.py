import json
import logging
import os
import asyncio
from typing import List, Optional
from langchain_core.messages import HumanMessage
from langchain.agents import Tool, initialize_agent
from langchain_openai import ChatOpenAI
from langchain_community.chat_models import AzureChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_google_vertexai import VertexAIModelGarden
from langchain_anthropic import ChatAnthropic
from utils.apiwrapper.github import GitHubAPIWrapper 
from utils.apiwrapper.stackoverflow import StackOverflowAPIWrapper
from utils.db import get_api_key

logging.basicConfig(level=logging.INFO)

def get_llm():
    llm_config = get_api_key('llm')
    if not llm_config:
        logging.warning("LLM configuration not found. Please set the configuration using the admin settings page.")
        return None
    
    config = json.loads(llm_config)
    provider = config.get('provider')
    api_key = config.get('api_key')
    model = config.get('model', 'gpt-4o')
    temperature = config.get('temperature', 0)
    
    if provider == 'openai':
        os.environ["OPENAI_API_KEY"] = api_key
        return ChatOpenAI(model=model, temperature=temperature, max_tokens=4096, stream=True)
    elif provider == 'azure':
        azure_config = config.get('azure', {})
        endpoint = azure_config.get('endpoint', '')
        api_version = azure_config.get('api_version', '2024-05-01-preview')
        deployment_name = azure_config.get('deployment', 'gpt-4o')
        os.environ["AZURE_OPENAI_API_KEY"] = api_key
        if not endpoint or not deployment_name:
            logging.error("Azure endpoint or deployment name is not set")
            return None
        logging.warning("Azure OpenAI configuration - API Version: %s, Endpoint: %s, API Key: %s",
                        api_version, endpoint, os.environ["AZURE_OPENAI_API_KEY"])
        return AzureChatOpenAI(
            azure_deployment=deployment_name,
            openai_api_version=api_version,
            temperature=temperature,
            azure_endpoint=endpoint,
            stream=True
        )
    elif provider == 'gemini':
        os.environ["GOOGLE_API_KEY"] = api_key
        return ChatGoogleGenerativeAI(model=model, temperature=temperature, max_output_tokens=4096, stream=True)
    elif provider == 'vertexai':
        os.environ["GOOGLE_API_KEY"] = api_key
        return VertexAIModelGarden(model=model, temperature=temperature, stream=True)
    elif provider == 'anthropic':
        os.environ["ANTHROPIC_API_KEY"] = api_key
        return ChatAnthropic(model=model, temperature=temperature, stream=True)
    else:
        logging.warning(f"Unsupported LLM provider: {provider}")
        return None

# Create Instance GitHub, Stack Overflow API Wrapper
github_search = GitHubAPIWrapper()
stackoverflow_search = StackOverflowAPIWrapper()

# Set Tools
tools = [
    Tool(
        name="github_search",
        func=github_search.run,
        description="Use this tool to search GitHub repositories."
    ),
    Tool(
        name="stackoverflow_search",
        func=stackoverflow_search.run,
        description="Use this tool to search Stack Overflow questions."
    ),
]

# Set LLM
llm = get_llm()

# Set Agent
agent = initialize_agent(
    tools=tools,
    llm=llm,
    agent_type="chat-zero-shot-react-description"
)

# Execute Agent
def run_agent(prompt: str):
    response = agent(HumanMessage(content=prompt))
    return response["output"]

# Stream Agent
def run_agent_stream(prompt: str):
    async def async_run_agent_stream(prompt: str):
        async for chunk in agent.astream(HumanMessage(content=prompt)):
            # Agent Action
            if "actions" in chunk:
                for action in chunk["actions"]:
                    yield f"Calling Tool: `{action.tool}` with input `{action.tool_input}`"
            # Observation
            elif "steps" in chunk:
                for step in chunk["steps"]:
                    yield f"Tool Result: `{step.observation}`"
            # Final result
            elif "output" in chunk:
                yield f'Final Output: {chunk["output"]}'
            else:
                raise ValueError()
            yield "---"

    return asyncio.run(async_run_agent_stream(prompt))