from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Groq configuration
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "qwen/qwen3.6-27b"          # faster model
    GROQ_TITLE_MODEL: str = "openai/gpt-oss-20b"    # same for titles

    # Supabase configuration
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()