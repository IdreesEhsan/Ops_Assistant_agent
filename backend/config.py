import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Groq
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    GROQ_TITLE_MODEL: str = "openai/gpt-oss-120b"

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # System SMTP
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM_NAME: str = "OpsAssistant"
    EMAIL_FROM_ADDRESS: str = ""

    # LangSmith (using LANGSMITH_* variable names for readability)
    LANGSMITH_TRACING: bool = True
    LANGSMITH_API_KEY: str = ""
    LANGSMITH_PROJECT: str = "OpsAssistant"
    LANGSMITH_ENDPOINT: str = "https://api.smith.langchain.com"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Map LANGSMITH_* to official LANGCHAIN_* environment variables
os.environ["LANGSMITH_TRACING_V2"] = str(settings.LANGSMITH_TRACING).lower()
os.environ["LANGSMITH_API_KEY"] = settings.LANGSMITH_API_KEY
os.environ["LANGSMITH_PROJECT"] = settings.LANGSMITH_PROJECT
if settings.LANGSMITH_ENDPOINT:
    os.environ["LANGSMITH_ENDPOINT"] = settings.LANGSMITH_ENDPOINT