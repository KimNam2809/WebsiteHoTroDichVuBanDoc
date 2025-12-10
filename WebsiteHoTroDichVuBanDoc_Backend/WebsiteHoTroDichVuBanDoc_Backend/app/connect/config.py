from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Đọc từ file .env
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_DB_STR: str

    LOCAL_DB_NAME: str
    LOCAL_DB_USER: str
    LOCAL_DB_PASS: str
    LOCAL_DB_HOST: str
    LOCAL_DB_PORT: str
    LOCAL_DB_STR_CMD: str

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str
    SENDGRID_API_KEY: str

# Tạo đối tượng settings để sử dụng trong ứng dụng
settings = Settings()