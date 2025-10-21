from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://postgres:wlfrfCfSOCDAKFwzOqRogeixzVOXiyET@turntable.proxy.rlwy.net:39953/railway"
    
    # AI Model
    local_model_url: str = "http://98.85.228.199:8000"  # ✅ NEW EC2 IP!
    use_local_model: bool = True
    openrouter_api_key: str = ""
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
