from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Groq configuration
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.1-8b-instant"

    # Supabase configuration
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    class Config:
        env_file = ".env"   # Load from .env file automatically

settings = Settings()