import json
import logging
import os
from langchain_openai import ChatOpenAI
from langchain_community.chat_models import AzureChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_google_vertexai import VertexAIModelGarden
from langchain_anthropic import ChatAnthropic
from utils.db import get_api_key

class LLMManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LLMManager, cls).__new__(cls)
            cls._instance.llm = None
            cls._instance._initialize_llm()
        return cls._instance

    def _initialize_llm(self):
        llm_config = get_api_key('llm')
        if not llm_config:
            logging.warning("LLM 설정을 찾을 수 없습니다. 관리자 설정 페이지에서 설정해 주세요.")
            return
        
        config = json.loads(llm_config)
        provider = config.get('provider')
        api_key = config.get('api_key')
        model = config.get('model', 'gpt-4o')
        temperature = config.get('temperature', 0)

        if provider == 'openai':
            os.environ["OPENAI_API_KEY"] = api_key
            self.llm = ChatOpenAI(model=model, temperature=temperature)
        elif provider == 'azure':
            azure_config = config.get('azure', {})
            endpoint = azure_config.get('endpoint', '')
            api_version = azure_config.get('api_version', '2024-05-01-preview')
            deployment_name = azure_config.get('deployment', 'gpt-4o')
            os.environ["AZURE_OPENAI_API_KEY"] = api_key
            if not endpoint or not deployment_name:
                logging.error("Azure endpoint 또는 배포 이름이 설정되지 않았습니다.")
                return
            logging.warning("Azure OpenAI 설정 - API 버전: %s, 엔드포인트: %s, API 키: %s",
                            api_version, endpoint, os.environ["AZURE_OPENAI_API_KEY"])
            self.llm = AzureChatOpenAI(
                azure_deployment=deployment_name,
                openai_api_version=api_version,
                temperature=temperature,
                azure_endpoint=endpoint
            )
        elif provider == 'gemini':
            os.environ["GOOGLE_API_KEY"] = api_key
            self.llm = ChatGoogleGenerativeAI(model=model, temperature=temperature)
        elif provider == 'vertexai':
            os.environ["GOOGLE_API_KEY"] = api_key
            self.llm = VertexAIModelGarden(model=model, temperature=temperature)
        elif provider == 'anthropic':
            os.environ["ANTHROPIC_API_KEY"] = api_key
            self.llm = ChatAnthropic(model=model, temperature=temperature)
        else:
            logging.warning(f"지원되지 않는 LLM 제공자: {provider}")
            return

    def get_llm(self):
        return self.llm

def get_llm():
    manager = LLMManager()
    return manager.get_llm()
