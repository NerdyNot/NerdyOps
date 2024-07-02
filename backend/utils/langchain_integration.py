import json
import logging
import re
import os
from langchain_openai import ChatOpenAI, AzureOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_google_vertexai import VertexAIModelGarden
from utils.db import get_api_key

# Set up logging
logging.basicConfig(level=logging.INFO)

# Define the prompt templates for different types of scripts
bash_template = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant that converts natural language commands into Bash scripts. Make sure to provide a complete and executable Bash script. Scripts Must Generated in English"),
    ("user", "OS: {os_type}\nCommand: {command}")
])

powershell_template = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant that converts natural language commands into PowerShell scripts. Make sure to provide a complete and executable PowerShell script. Scripts Must Generated in English"),
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
    
    if provider == 'openai':
        os.environ["OPENAI_API_KEY"] = api_key
        return ChatOpenAI(model=model, temperature=temperature)
    elif provider == 'azure':
        azure_config = config.get('azure', {})
        os.environ["OPENAI_API_VERSION"] = azure_config.get('api_version', '2023-12-01-preview')
        os.environ["AZURE_OPENAI_ENDPOINT"] = azure_config.get('endpoint', '')
        os.environ["AZURE_OPENAI_API_KEY"] = azure_config.get('api_key', '')
        return AzureOpenAI(model=model, temperature=temperature)
    elif provider == 'gemini':
        os.environ["GOOGLE_API_KEY"] = api_key
        return ChatGoogleGenerativeAI(model=model, temperature=temperature)
    elif provider == 'vertexai':
        os.environ["GOOGLE_API_KEY"] = api_key
        return VertexAIModelGarden(model=model, temperature=temperature)
    else:
        logging.warning(f"Unsupported LLM provider: {provider}")
        return None

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

