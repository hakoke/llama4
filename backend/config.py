from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://postgres:wlfrfCfSOCDAKFwzOqRogeixzVOXiyET@turntable.proxy.rlwy.net:39953/railway"
    
    # AI Model
    local_model_url: str = "http://100.29.16.164:8000"  # ✅ EC2 vLLM Server
    local_model_name: str = "NousResearch/Nous-Hermes-2-Mistral-7B-DPO"  # Uncensored model with chat template!
    # NOTE: "Instruct" models have safety filters baked in. For truly unrestricted behavior, consider:
    # 1. Using Qwen2.5-14B-AWQ (base, not Instruct) - requires downloading
    # 2. Or disabling safety prompts in vLLM with --enforce-eager and --skip-tokenizer-init
    use_local_model: bool = True
    openrouter_api_key: str = ""
    openrouter_model: str = "mistralai/mistral-7b-instruct:free"  # Uncensored fallback
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    
    # Web Scraping
    serper_api_key: str = "7fcc6bcced0d9c273f6368ed725e6e2753017935"  # ✅ READY!
    rapidapi_key: str = ""  # Optional for Instagram
    
    # App
    secret_key: str = "change-this-secret-key-in-production"
    frontend_url: str = "http://localhost:3000"
    
    # GitHub
    github_repo: str = "https://github.com/hakoke/llama4"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings():
    return Settings()
