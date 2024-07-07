from typing import Any, Dict, List, Optional
import requests
from pydantic import BaseModel, Extra, root_validator
from utils.db import get_api_key

class StackOverflowAPIWrapper(BaseModel):
    stack_exchange_key: Optional[str] = None
    site: str = "stackoverflow"
    k: int = 10

    class Config:
        extra = Extra.forbid

    @root_validator(pre=True)
    def validate_environment(cls, values: Dict) -> Dict:
        api_key = get_api_key('stackoverflow')
        if not api_key:
            api_key = "default_stackoverflow_api_key"
        values["stack_exchange_key"] = api_key
        return values

    def _stack_overflow_search_results(self, search_term: str, **kwargs: Any) -> List[dict]:
        url = f'https://api.stackexchange.com/2.3/search/advanced'
        params = {
            'order': 'desc',
            'sort': 'relevance',
            'q': search_term,
            'site': self.site,
            'key': self.stack_exchange_key,
            **kwargs
        }
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json().get("items", [])

    def run(self, query: str) -> str:
        snippets = []
        results = self._stack_overflow_search_results(query, pagesize=self.k)
        if len(results) == 0:
            return "No good Stack Overflow Search Result was found"
        for result in results:
            if "title" in result:
                snippets.append(result["title"])
        return " ".join(snippets)

    def results(self, query: str, num_results: int, search_params: Optional[Dict[str, str]] = None) -> List[Dict]:
        metadata_results = []
        results = self._stack_overflow_search_results(query, pagesize=num_results, **(search_params or {}))
        if len(results) == 0:
            return [{"Result": "No good Stack Overflow Search Result was found"}]
        for result in results:
            metadata_result = {
                "title": result["title"],
                "link": result["link"],
                "creation_date": result["creation_date"],
                "is_answered": result["is_answered"]
            }
            metadata_results.append(metadata_result)
        return metadata_results
