from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Groq configuration
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    GROQ_TITLE_MODEL: str = "openai/gpt-oss-120b"

    # Supabase configuration
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # System SMTP (single sender for all emails)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""          # system sender email
    SMTP_PASSWORD: str = ""          # app password for that email
    EMAIL_FROM_NAME: str = "OpsAssistant"
    EMAIL_FROM_ADDRESS: str = ""     # usually same as SMTP_USERNAME

    class Config:
        env_file = ".env"

settings = Settings()