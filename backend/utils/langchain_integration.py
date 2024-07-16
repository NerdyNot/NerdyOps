import json
import logging
import re
import os
import uuid
from datetime import datetime
import time
from langchain_openai import ChatOpenAI
from langchain_community.chat_models import AzureChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_google_vertexai import VertexAIModelGarden
from langchain_anthropic import ChatAnthropic
from langchain_community.cache import RedisCache, InMemoryCache
from langchain.globals import set_llm_cache
from utils.db import get_api_key, get_db_connection, DB_TYPE
from utils.redis_connection import get_redis_connection
from redis import Redis

logging.basicConfig(level=logging.INFO)

redis_conn = get_redis_connection()

# Define the prompt templates for different types of scripts
bash_template = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant that converts natural language commands into Bash scripts. Make sure to provide a complete and executable Bash script. The script should only run on the local computer and must not include any remote commands or SSH instructions. Scripts Must Generated in English"),
    ("user", "OS: {os_type}\nCommand: {command}")
])

powershell_template = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant that converts natural language commands into PowerShell scripts. Make sure to provide a complete and executable PowerShell script. The script should only run on the local computer and must not include any remote commands or SSH instructions. Scripts Must Generated in English"),
    ("user", "OS: {os_type}\nCommand: {command}")
])

interpret_template = ChatPromptTemplate.from_messages([
    ("system", 
     """
     You are a multilingual assistant. Your task is to summarize and explain the output and error from the command execution.
     First, detect the language of the command text and then respond in the same language as the command. 
     If the command text is in Korean, your response must be in Korean. If it is in another language, respond in that language.
     Provide a simple interpretation of the output and error.
     """),
    ("user", "Command: {command_text}\nOutput: {output}\nError: {error}")
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
    
    llm = None
    if provider == 'openai':
        os.environ["OPENAI_API_KEY"] = api_key
        llm = ChatOpenAI(model=model, temperature=temperature)
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
        llm = AzureChatOpenAI(
            azure_deployment=deployment_name,
            openai_api_version=api_version,
            temperature=temperature,
            azure_endpoint=endpoint
        )
    elif provider == 'gemini':
        os.environ["GOOGLE_API_KEY"] = api_key
        llm = ChatGoogleGenerativeAI(model=model, temperature=temperature)
    elif provider == 'vertexai':
        os.environ["GOOGLE_API_KEY"] = api_key
        llm = VertexAIModelGarden(model=model, temperature=temperature)
    elif provider == 'anthropic':
        os.environ["ANTHROPIC_API_KEY"] = api_key
        llm = ChatAnthropic(model=model, temperature=temperature)
    else:
        logging.warning(f"Unsupported LLM provider: {provider}")
        return None


    class PrefixedRedisCache(RedisCache):
        def __init__(self, redis_, prefix='', ttl=None):
            super().__init__(redis_, ttl)
            self.prefix = prefix

        def _key(self, prompt: str, llm_string: str) -> str:
            base_key = super()._key(prompt, llm_string)
            return f"{self.prefix}:{base_key}"

    cache = PrefixedRedisCache(redis_conn, prefix='llm_cache')

    set_llm_cache(cache)
    logging.info("Redis Cache configured successfully")
    return llm

def extract_script_from_response(response_text: str, os_type: str) -> str:
    if os_type.lower() == 'windows':
        match = re.search(r"```powershell\s(.*?)\s```", response_text, re.DOTALL)
    elif os_type.lower() in ['linux', 'darwin']:
        match = re.search(r"```bash\s(.*?)\s```", response_text, re.DOTALL)
    else:
        raise ValueError("Invalid OS type. Please specify 'windows' or 'linux' or 'darwin'.")
    
    if match:
        script = match.group(1).strip()
        logging.info(f"Extracted Script: {script}")
        return script
    
    logging.warning("No code block found in the response. Returning the full response.")
    return response_text.strip()

def convert_natural_language_to_script(command_text: str, os_type: str) -> str:
    llm = get_llm()
    if not llm:
        raise ValueError("LLM configuration not set. Please set the configuration using the admin settings page.")

    if os_type.lower() == 'windows':
        prompt = powershell_template.invoke({"command": command_text, "os_type": os_type})
    elif os_type.lower() in ['linux', 'darwin']:
        prompt = bash_template.invoke({"command": command_text, "os_type": os_type})
    else:
        raise ValueError("Invalid OS type. Please specify 'windows' or 'linux' or 'darwin'.")

    response = llm.invoke(prompt.to_messages())
    logging.info(f"LLM Response: {response}")

    script_code = parser.invoke(response)
    logging.info(f"Extracted Script Code: {script_code}")

    clean_script = extract_script_from_response(script_code, os_type)
    
    return clean_script

def interpret_result(command_text: str, output: str, error: str) -> str:
    llm = get_llm()
    if not llm:
        raise ValueError("LLM configuration not set. Please set the configuration using the admin settings page.")
    
    prompt = interpret_template.invoke({"command_text": command_text, "output": output, "error": error})

    response = llm.invoke(prompt.to_messages())
    logging.info(f"LLM Interpretation Response: {response}")
    
    summary = parser.invoke(response).strip()
    logging.info(f"LLM Summary: {summary}")
    
    return summary

# Tool to find agent_id from message
def find_agent_id(message: str) -> str:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        query = """
        SELECT agent_id FROM agents WHERE computer_name LIKE %s OR private_ip LIKE %s
        """ if DB_TYPE == 'mysql' else """
        SELECT agent_id FROM agents WHERE computer_name LIKE ? OR private_ip LIKE ?
        """
        cursor.execute(query, (f"%{message}%", f"%{message}%"))
        row = cursor.fetchone()
    finally:
        conn.close()

    if row:
        return row['agent_id']
    else:
        logging.warning("No matching agent found for the message.")
        return "No matching agent found"

# Tool to generate verification script
def generate_verification_script_tool(message: str) -> str:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        query = """
        SELECT os_type FROM agents WHERE agent_id = %s
        """ if DB_TYPE == 'mysql' else """
        SELECT os_type FROM agents WHERE agent_id = ?
        """
        cursor.execute(query, (message,))
        row = cursor.fetchone()
    finally:
        conn.close()

    if not row:
        return "Agent not found in the database."

    os_type = row['os_type']
    verification_command = f"Alert Message: {message}. Please generate a script to verify this message on the local computer."
    return convert_natural_language_to_script(verification_command, os_type)

def execute_script_and_get_result(agent_id: str, script: str) -> str:
    task_id = str(uuid.uuid4())
    task_data = {
        "task_id": task_id,
        "input": script,
        "script_code": script,
        "agent_id": agent_id,
        "timestamp": datetime.now().isoformat(),
        "status": "approved",
        "approved_at": datetime.now().isoformat(),
    }

    # Add the task to the agent's task queue in Redis
    redis_conn.set(f'task:{task_id}', json.dumps(task_data))
    redis_conn.lpush(f'task_queue:{agent_id}', json.dumps(task_data))

    # Wait for the agent to execute the task and return the result
    result_key = f"result:{task_id}"
    for _ in range(10):  # Retry 10 times with a delay
        result = redis_conn.hgetall(result_key)
        if result:
            output = result.get(b'output', b'').decode()
            error = result.get(b'error', b'').decode()
            interpretation = result.get(b'interpretation', b'').decode()
            return {
                "output": output,
                "error": error,
                "interpretation": interpretation,
            }
        time.sleep(5)  # Wait for 5 seconds before retrying

    return "No response from agent"

def interpret_result(command_text: str, output: str, error: str) -> str:
    llm = get_llm()
    if not llm:
        raise ValueError("LLM configuration not set. Please set the configuration using the admin settings page.")
    
    prompt = interpret_template.invoke({"command_text": command_text, "output": output, "error": error})

    response = llm.invoke(prompt.to_messages())
    logging.info(f"LLM Interpretation Response: {response}")
    
    summary = parser.invoke(response).strip()
    logging.info(f"LLM Summary: {summary}")
    
    return summary