from typing import Any, Dict, List, Optional
import requests
from pydantic import BaseModel, Extra, root_validator
from utils.db import get_api_key

class GitHubAPIWrapper(BaseModel):
    github_api_key: Optional[str] = None
    k: int = 10

    class Config:
        extra = Extra.forbid

    @root_validator(pre=True)
    def validate_environment(cls, values: Dict) -> Dict:
        api_key = get_api_key('github')
        if not api_key:
            api_key = "default_github_api_key"
        values["github_api_key"] = api_key
        return values

    def _github_search_results(self, search_term: str, **kwargs: Any) -> List[dict]:
        headers = {'Authorization': f'token {self.github_api_key}'} if self.github_api_key else {}
        url = f'https://api.github.com/search/repositories?q={search_term}'
        response = requests.get(url, headers=headers, params=kwargs)
        response.raise_for_status()
        return response.json().get("items", [])

    def run(self, query: str) -> str:
        snippets = []
        results = self._github_search_results(query, per_page=self.k)
        if len(results) == 0:
            return "No good GitHub Search Result was found"
        for result in results:
            if "description" in result:
                snippets.append(result["description"])
        return " ".join(snippets)

    def results(self, query: str, num_results: int, search_params: Optional[Dict[str, str]] = None) -> List[Dict]:
        metadata_results = []
        results = self._github_search_results(query, per_page=num_results, **(search_params or {}))
        if len(results) == 0:
            return [{"Result": "No good GitHub Search Result was found"}]
        for result in results:
            metadata_result = {
                "name": result["name"],
                "html_url": result["html_url"],
            }
            if "description" in result:
                metadata_result["description"] = result["description"]
            metadata_results.append(metadata_result)
        return metadata_results
