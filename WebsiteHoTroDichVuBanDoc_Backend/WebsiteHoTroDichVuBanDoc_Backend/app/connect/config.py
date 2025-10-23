from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Đọc từ file .env
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str

# Tạo đối tượng settings để sử dụng trong ứng dụng
settings = Settings()