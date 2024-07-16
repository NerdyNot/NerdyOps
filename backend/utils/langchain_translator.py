import logging
import time
import random
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from utils.langchain_integration import get_llm

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
        messages = translate_template.format_messages(text=chunk, target_language=target_language, purpose=purpose)
        # Create chain using | operator
        chain = translate_template | llm | parser
        # Execute chain
        response = chain.invoke({"text": chunk, "target_language": target_language, "purpose": purpose})
        logging.info(f"LLM Translation Response: {response}")

        translated_chunks.append(response)

    # Join translated chunks
    full_translated_text = ' '.join(translated_chunks)
    logging.info(f"Full Translated Text: {full_translated_text}")

    return full_translated_text

async def translate_text_stream_chunked(text: str, target_language: str, purpose: str):
    llm = get_llm()
    if not llm:
        raise ValueError("LLM configuration not set. Please set the configuration using the admin settings page.")

    chunks = split_text_into_chunks_with_newlines(text)

    for chunk in chunks:
        messages = translate_template.format_messages(text=chunk, target_language=target_language, purpose=purpose)
        # Create chain using | operator
        chain = translate_template | llm | parser

        success = False
        retries = 3
        while not success and retries > 0:
            try:
                # Use the chain to stream the response
                async for stream_chunk in chain.astream({"text": chunk, "target_language": target_language, "purpose": purpose}):
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
                    await asyncio.sleep(sleep_time)
                else:
                    logging.error("Max retries reached. Skipping this chunk.")