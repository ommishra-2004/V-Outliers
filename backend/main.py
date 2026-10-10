import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.consumer import router as consumer_router
from routers.auth import router as auth_router
from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SolarPunk India API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(consumer_router)
app.include_router(auth_router)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up SolarPunk India API")
    logger.info(f"AWS Region: {settings.aws_region}")
    logger.info(f"S3 Bucket: {settings.s3_bucket_name}")
    logger.info(f"DynamoDB Table: {settings.dynamodb_table_name}")

@app.get("/")
def health_check():
    return {"status": "ok", "message": "SolarPunk India API is running"}
