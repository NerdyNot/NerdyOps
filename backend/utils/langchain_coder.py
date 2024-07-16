import json
import logging
import time
import random
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from utils.langchain_llm import get_llm

logging.basicConfig(level=logging.INFO)

# Define the prompt template for code generation
code_template = PromptTemplate.from_template("""
You are a highly skilled software developer. Your task is to generate code based on the provided description and language.
The generated code should be complete, efficient, and follow best practices for the specified programming language.
Avoid including any unnecessary comments or explanations.

* You Must Respond Only With The Generated Code & Comments*

## Response Example
...Generated Code..
Description: {description}
Language: {language}
""")

# Define the prompt template for code explanation
explanation_template = PromptTemplate.from_template("""
You are a highly skilled software developer. Your task is to explain the following code in detail.
The explanation should include the purpose of the code, how it works, and any important details or best practices followed.
Please respond in the same language as the description provided below.

* You Must Respond Only With The Explanation *

## Response Example
...Explanation..
Description: {description}
Generated Code: {code}
""")

# Define the output parser
parser = StrOutputParser()

def split_text_into_chunks_with_newlines(text, chunk_size=100):
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
        input_data = {"description": chunk, "language": language}
        chain = code_template | llm

        success = False
        retries = 3
        while not success and retries > 0:
            try:
                stream = chain.invoke(input_data)

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

def generate_code_explanation_stream_chunked(description: str, code: str):
    llm = get_llm()
    if not llm:
        raise ValueError("LLM configuration not set. Please set the configuration using the admin settings page.")

    # Create prompt for code explanation
    input_data = {"description": description, "code": code}
    chain = explanation_template | llm

    success = False
    retries = 3
    while not success and retries > 0:
        try:
            stream = chain.invoke(input_data)

            for stream_chunk in stream:
                if hasattr(stream_chunk, 'content'):
                    yield stream_chunk.content
                else:
                    logging.error("Chunk does not have content attribute: {}".format(stream_chunk))
            success = True
        except Exception as e:
            logging.error(f"Error during code explanation chunk: {e}")
            retries -= 1
            if retries > 0:
                sleep_time = random.uniform(1, 3)  # Random delay between 1 to 3 seconds
                logging.info(f"Retrying in {sleep_time:.2f} seconds...")
                time.sleep(sleep_time)
            else:
                logging.error("Max retries reached. Skipping this chunk.")
