import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    aws_region: str = "ap-south-1"
    cognito_user_pool_id: str = ""
    cognito_client_id: str = ""
    s3_bucket_name: str = "solarpunk-india-images"
    dynamodb_table_name: str = "solarpunk-analyses"
    bedrock_model_id: str = "anthropic.claude-3-haiku-20240307-v1:0"
    cors_origins: Union[str, List[str]] = ["*"]
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.cors_origins, str):
            return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        return self.cors_origins

settings = Settings()
