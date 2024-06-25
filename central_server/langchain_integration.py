from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import os
import logging
import re

# Set the OpenAI API key from the environment
os.environ["OPENAI_API_KEY"]

# Initialize the OpenAI model
llm = ChatOpenAI(model="gpt-4o", temperature=0)

# Define the prompt template for Bash scripts
bash_template = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant that converts natural language commands into Bash scripts. Make sure to provide a complete and executable Bash script."),
    ("user", "OS: {os_type}\nCommand: {command}")
])

# Define the prompt template for PowerShell scripts
powershell_template = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant that converts natural language commands into PowerShell scripts. Make sure to provide a complete and executable PowerShell script."),
    ("user", "OS: {os_type}\nCommand: {command}")
])

# Define the prompt template for interpreting results
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

# Extract the script part from the response text based on the OS type
def extract_script_from_response(response_text: str, os_type: str) -> str:
    """
    Extract the script part from the response text.
    
    Args:
        response_text (str): Response text from the LLM.
        os_type (str): OS type ('windows' or 'linux' or 'darwin') to determine the script type.
    
    Returns:
        str: Extracted script part from the response.
    """
    if os_type.lower() == 'windows':
        # Extract PowerShell script
        match = re.search(r"```powershell\s(.*?)\s```", response_text, re.DOTALL)
    elif os_type.lower() in ['linux', 'darwin']:
        # Extract Bash script
        match = re.search(r"```bash\s(.*?)\s```", response_text, re.DOTALL)
    else:
        raise ValueError("Invalid OS type. Please specify 'windows' or 'linux' or 'darwin'.")
    
    if match:
        script = match.group(1).strip()
        logging.info(f"Extracted Script: {script}")
        return script
    
    # Return the full response if no code block is found
    logging.warning("No code block found in the response. Returning the full response.")
    return response_text.strip()

# Convert a natural language command into a script suitable for the specified OS
def convert_natural_language_to_script(command_text: str, os_type: str) -> str:
    """
    Convert a natural language command to a script (PowerShell or Bash) based on the OS.
    
    Args:
        command_text (str): Natural language command from the user.
        os_type (str): OS type ('windows' or 'linux' or 'darwin') to determine the script type.
    
    Returns:
        str: Code part of the converted script.
    """
    if os_type.lower() == 'windows':
        # Use PowerShell prompt template
        prompt = powershell_template.invoke({"command": command_text, "os_type": os_type})
    elif os_type.lower() in ['linux', 'darwin']:
        # Use Bash prompt template
        prompt = bash_template.invoke({"command": command_text, "os_type": os_type})
    else:
        raise ValueError("Invalid OS type. Please specify 'windows' or 'linux' or 'darwin'.")

    # Generate response by chaining prompt and LLM
    response = llm.invoke(prompt.to_messages())
    
    # Log the structure of the response
    logging.info(f"LLM Response: {response}")

    # Parse the response to extract the script code
    script_code = parser.invoke(response)
    logging.info(f"Extracted Script Code: {script_code}")

    # Extract the script part from the response
    clean_script = extract_script_from_response(script_code, os_type)
    
    return clean_script

# Interpret the given output and error text to summarize or extract key information
def interpret_result(command_text: str, output: str, error: str) -> str:
    """
    Interpret the given output and error text to summarize or extract key information.
    Respond in the same language as the command.
    
    Args:
        command_text (str): The original command received from the user.
        output (str): The output result of the command execution.
        error (str): The error message from the command execution.
    
    Returns:
        str: Summary of the result interpreted by the LLM.
    """
    
    prompt = interpret_template.invoke({"command_text": command_text, "output": output, "error": error})

    response = llm.invoke(prompt.to_messages())
    logging.info(f"LLM Interpretation Response: {response}")
    
    summary = parser.invoke(response).strip()
    logging.info(f"LLM Summary: {summary}")
    
    return summary
