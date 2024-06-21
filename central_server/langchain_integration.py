from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import os
import logging
import re

os.environ["OPENAI_API_KEY"]

# OpenAI 모델 초기화
llm = ChatOpenAI(model="gpt-4o", temperature=0)

# 프롬프트 템플릿 정의
bash_template = ChatPromptTemplate.from_messages([
    ("system", "Convert the following command to a Bash script:"),
    ("user", "{command}")
])

powershell_template = ChatPromptTemplate.from_messages([
    ("system", "Convert the following command to a PowerShell script:"),
    ("user", "{command}")
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

# 출력 파서 정의
parser = StrOutputParser()

def extract_script_from_response(response_text: str, os_type: str) -> str:
    """
    응답 텍스트에서 스크립트 부분만 추출합니다.
    
    Args:
        response_text (str): LLM으로부터 받은 응답 텍스트.
        os_type (str): 'windows' 또는 'linux' 중 하나로, 스크립트 유형을 결정합니다.
    
    Returns:
        str: 스크립트 부분만 추출하여 반환합니다.
    """
    if os_type.lower() == 'windows':
        # PowerShell 스크립트 추출
        match = re.search(r"```powershell\s(.*?)\s```", response_text, re.DOTALL)
    elif os_type.lower() == 'linux':
        # Bash 스크립트 추출
        match = re.search(r"```bash\s(.*?)\s```", response_text, re.DOTALL)
    else:
        raise ValueError("Invalid OS type. Please specify 'windows' or 'linux'.")
    
    if match:
        script = match.group(1).strip()
        logging.info(f"Extracted Script: {script}")
        return script
    
    # 코드 블록을 찾지 못한 경우 응답 전체 반환
    logging.warning("No code block found in the response. Returning the full response.")
    return response_text.strip()

def convert_natural_language_to_script(command_text: str, os_type: str) -> str:
    """
    사용자로부터 받은 자연어 명령을 OS에 맞는 스크립트 (PowerShell 또는 Bash)로 변환합니다.
    
    Args:
        command_text (str): 사용자로부터 받은 자연어 명령.
        os_type (str): 'windows' 또는 'linux' 중 하나로, 스크립트 유형을 결정합니다.
    
    Returns:
        str: 변환된 스크립트의 code 부분.
    """
    if os_type.lower() == 'windows':
        # PowerShell 프롬프트 템플릿 사용
        prompt = powershell_template.invoke({"command": command_text})
    elif os_type.lower() == 'linux':
        # Bash 프롬프트 템플릿 사용
        prompt = bash_template.invoke({"command": command_text})
    else:
        raise ValueError("Invalid OS type. Please specify 'windows' or 'linux'.")

    # 프롬프트와 LLM을 체이닝하여 응답 생성
    response = llm.invoke(prompt.to_messages())
    
    # 응답의 구조를 확인하기 위해 로깅
    logging.info(f"LLM Response: {response}")

    # 응답을 출력 파서로 파싱하여 텍스트를 추출
    script_code = parser.invoke(response)
    logging.info(f"Extracted Script Code: {script_code}")

    # 스크립트 부분만 추출
    clean_script = extract_script_from_response(script_code, os_type)
    
    return clean_script


def interpret_result(command_text: str, output: str, error: str) -> str:
    """
    주어진 output과 error 텍스트를 해석하여 요약하거나 중요한 정보를 추출합니다.
    주어진 질의(command_text)를 참고하고, 명령어의 언어와 동일한 언어로 응답합니다.
    
    Args:
        command_text (str): 사용자로부터 받은 원래 명령.
        output (str): 작업의 출력 결과.
        error (str): 작업 중 발생한 오류 메시지.
    
    Returns:
        str: LLM으로 해석된 결과 요약.
    """
    
    prompt = interpret_template.invoke({"command_text": command_text, "output": output, "error": error})

    response = llm.invoke(prompt.to_messages())
    logging.info(f"LLM Interpretation Response: {response}")
    
    summary = parser.invoke(response).strip()
    logging.info(f"LLM Summary: {summary}")
    
    return summary