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

# Define the prompt template for translation
translate_template = ChatPromptTemplate.from_messages([
    ("system", """
    You are a highly skilled translation assistant. Your task is to translate the following text into the specified target language.
    The translation should be natural and complete, preserving the context and meaning of the original text. Avoid literal translations.
    Ensure that programming code or special characters in the text are not altered or corrupted.
    Document Purpose: {purpose}
    
    * You Must Respond Only With The Translated Text *
     
    ## Response Example
    ...Translated Text.. 
    """),
    ("user", "Original Text: {text}\nTarget Language: {target_language}")
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

def translate_text_chunked(text: str, target_language: str, purpose: str):
    llm = get_llm()
    if not llm:
        raise ValueError("LLM configuration not set. Please set the configuration using the admin settings page.")

    # Split text into manageable chunks
    chunks = split_text_into_chunks_with_newlines(text)
    translated_chunks = []

    for chunk in chunks:
        prompt = translate_template.invoke({"text": chunk, "target_language": target_language, "purpose": purpose})
        response = llm.invoke(prompt.to_messages())
        logging.info(f"LLM Translation Response: {response}")

        translated_text = parser.invoke(response).strip()
        logging.info(f"Translated Text: {translated_text}")

        # Extract the translated text
        translated_text_start = translated_text.find("Translated Text:") + len("Translated Text:")
        translated_text_end = translated_text.find("...", translated_text_start)
        actual_translated_text = translated_text[translated_text_start:translated_text_end].strip()

        translated_chunks.append(actual_translated_text)

    # Join translated chunks
    full_translated_text = ' '.join(translated_chunks)
    logging.info(f"Full Translated Text: {full_translated_text}")

    return full_translated_text


def translate_text_stream_chunked(text: str, target_language: str, purpose: str):
    llm = get_llm()
    if not llm:
        raise ValueError("LLM configuration not set. Please set the configuration using the admin settings page.")

    chunks = split_text_into_chunks_with_newlines(text)

    for chunk in chunks:
        prompt = translate_template.invoke({"text": chunk, "target_language": target_language, "purpose": purpose})

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
                logging.error(f"Error during translation chunk: {e}")
                retries -= 1
                if retries > 0:
                    sleep_time = random.uniform(1, 3)  # 1~3초 사이 랜덤 지연
                    logging.info(f"Retrying in {sleep_time:.2f} seconds...")
                    time.sleep(sleep_time)
                else:
                    logging.error("Max retries reached. Skipping this chunk.")
