import json
import logging
import os
import time
import random
from langchain_openai import ChatOpenAI
from langchain_community.chat_models import AzureChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_google_vertexai import VertexAIModelGarden
from langchain_anthropic import ChatAnthropic
from utils.db import get_api_key

# Set up logging
logging.basicConfig(level=logging.INFO)

# Define the prompt template for code generation
code_template = ChatPromptTemplate.from_messages([
    ("system", """
    You are a highly skilled software developer. Your task is to generate code based on the provided description and language.
    The generated code should be complete, efficient, and follow best practices for the specified programming language.
    Avoid including any unnecessary comments or explanations.
    
    * You Must Respond Only With The Generated Code *
     
    ## Response Example
    ...Generated Code.. 
    """),
    ("user", "Description: {description}\nLanguage: {language}")
])

# Define the output parser
parser = StrOutputParser()

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
        return ChatOpenAI(model=model, temperature=temperature, max_tokens=4096)
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
        )
    elif provider == 'gemini':
        os.environ["GOOGLE_API_KEY"] = api_key
        return ChatGoogleGenerativeAI(model=model, temperature=temperature, max_output_tokens=4096)
    elif provider == 'vertexai':
        os.environ["GOOGLE_API_KEY"] = api_key
        return VertexAIModelGarden(model=model, temperature=temperature)
    elif provider == 'anthropic':
        os.environ["ANTHROPIC_API_KEY"] = api_key
        return ChatAnthropic(model=model, temperature=temperature)
    else:
        logging.warning(f"Unsupported LLM provider: {provider}")
        return None

def split_text_into_chunks_with_newlines(text, chunk_size=500):
    """
    Split the input text into chunks of a specified size, preserving newlines and avoiding word splits.

    :param text: The input text to split.
    :param chunk_size: The maximum size of each chunk.
    :return: A list of text chunks.
    """
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

def generate_code_stream_chunked(description: str, language: str):
    llm = get_llm()
    if not llm:
        raise ValueError("LLM configuration not set. Please set the configuration using the admin settings page.")

    # Split description into manageable chunks
    chunks = split_text_into_chunks_with_newlines(description)
    
    for chunk in chunks:
        prompt = code_template.invoke({"description": chunk, "language": language})

        success = False
        retries = 3
        while not success and retries > 0:
            try:
                stream = llm.stream(prompt.to_messages())

                for stream_chunk in stream:
                    if hasattr(stream_chunk, 'content'):
                        yield stream_chunk.content
                    else:
                        logging.error("Chunk does not have content attribute: {}".format(stream_chunk))
                success = True
            except Exception as e:
                logging.error(f"Error during code generation chunk: {e}")
                retries -= 1
                if retries > 0:
                    sleep_time = random.uniform(1, 3)  # Random delay between 1 to 3 seconds
                    logging.info(f"Retrying in {sleep_time:.2f} seconds...")
                    time.sleep(sleep_time)
                else:
                    logging.error("Max retries reached. Skipping this chunk.")
