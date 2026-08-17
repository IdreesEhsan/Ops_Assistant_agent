from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Main LLM for agent responses
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"

    # Dedicated smaller model for title generation
    GROQ_TITLE_MODEL: str = "openai/gpt-oss-120b"

    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()