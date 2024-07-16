import json
import logging
import os
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.chat_models import AzureChatOpenAI
from langchain_community.embeddings import AzureOpenAIEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_google_vertexai import VertexAIModelGarden
from langchain_google_vertexai.embeddings import VertexAIEmbeddings
from langchain_anthropic import ChatAnthropic
from langchain_community.cache import RedisCache, RedisSemanticCache
from langchain.globals import set_llm_cache
from utils.db import get_api_key
from utils.redis_connection import get_redis_connection, get_redis_url

class LLMManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LLMManager, cls).__new__(cls)
            cls._instance.llm = None
            cls._instance.embedding = None
            cls._instance._initialize_llm()
            cls._instance._initialize_embedding()
            cls._instance._initialize_cache()
        return cls._instance

    def _initialize_llm(self):
        llm_config = get_api_key('llm')
        if not llm_config:
            logging.warning("LLM configuration not found. Please set the configuration using the admin settings page.")
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
                logging.error("Azure endpoint or deployment name is not set")
                return
            logging.warning("Azure OpenAI configuration - API Version: %s, Endpoint: %s, API Key: %s",
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
            logging.warning(f"Unsupported LLM provider: {provider}")
            return

    def _initialize_embedding(self):
        embedding_config = get_api_key('embedding')
        if not embedding_config:
            logging.warning("Embedding configuration not found. Please set the configuration using the admin settings page.")
            return

        config = json.loads(embedding_config)
        provider = config.get('provider')
        api_key = config.get('api_key')
        model = config.get('model', 'text-embedding-ada-002')

    def _initialize_embedding(self):
        embedding_config = get_api_key('embedding')
        if not embedding_config:
            logging.warning("Embedding configuration not found. Please set the configuration using the admin settings page.")
            return
    
        config = json.loads(embedding_config)
        provider = config.get('provider')
        api_key = config.get('api_key')
        model = config.get('model', 'text-embedding-ada-002')
    
        if provider == 'openai':
            os.environ["OPENAI_API_KEY"] = api_key
            self.embedding = OpenAIEmbeddings(model=model)
        elif provider == 'azure':
            azure_config = config.get('azure', {})
            endpoint = azure_config.get('endpoint', '')
            api_version = azure_config.get('api_version', '2024-05-01-preview')
            deployment_name = azure_config.get('deployment', 'embedding-ada-002')
            os.environ["AZURE_OPENAI_API_KEY"] = api_key
            if not endpoint or not deployment_name:
                logging.error("Azure endpoint or deployment name is not set")
                return
            logging.warning("Azure OpenAI configuration - API Version: %s, Endpoint: %s, API Key: %s",
                            api_version, endpoint, os.environ["AZURE_OPENAI_API_KEY"])
            self.embedding = AzureOpenAIEmbeddings(
                azure_deployment=deployment_name,
                openai_api_version=api_version,
                azure_endpoint=endpoint
            )
        elif provider == 'gemini':
            os.environ["GOOGLE_API_KEY"] = api_key
            self.embedding = GoogleGenerativeAIEmbeddings(model=model)
        elif provider == 'vertexai':
            os.environ["GOOGLE_API_KEY"] = api_key
            self.embedding = VertexAIEmbeddings(model=model)
        else:
            logging.warning(f"Unsupported embedding provider: {provider}")
            return

    def _initialize_cache(self):
        redis_conn = get_redis_connection()
        redis_url = get_redis_url()
        if self.embedding:
            set_llm_cache(RedisSemanticCache(redis_url=redis_url, embedding=self.embedding))
            logging.info("Semantic Redis Cache configured successfully")
        else:
            set_llm_cache(RedisCache(redis_=redis_conn))
            logging.info("Standard Redis Cache configured successfully")

    def get_llm(self):
        return self.llm
    
    def get_embedding(self):
        return self.embedding

def get_llm():
    manager = LLMManager()
    return manager.get_llm()

def get_embedding():
    manager = LLMManager()
    return manager.get_embedding()
