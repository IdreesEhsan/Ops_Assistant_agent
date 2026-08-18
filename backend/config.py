from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Groq configuration
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    GROQ_TITLE_MODEL: str = "openai/gpt-oss-120b"

    # Supabase configuration
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()