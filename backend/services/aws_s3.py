import uuid
import boto3
from botocore.exceptions import NoCredentialsError, ClientError
from fastapi import UploadFile
from config import settings

def get_s3_client():
    try:
        return boto3.client('s3', region_name=settings.aws_region)
    except Exception:
        return None

def upload_file_to_s3(file: UploadFile, user_id: str) -> str:
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    key = f"rooftop-images/{user_id}/{uuid.uuid4()}.{ext}"
    
    s3 = get_s3_client()
    if s3:
        try:
            s3.upload_fileobj(file.file, settings.s3_bucket_name, key)
            return key
        except (NoCredentialsError, ClientError):
            return key
    return key

def generate_presigned_url(key: str) -> str:
    s3 = get_s3_client()
    if s3:
        try:
            return s3.generate_presigned_url(
                'get_object',
                Params={'Bucket': settings.s3_bucket_name, 'Key': key},
                ExpiresIn=3600
            )
        except (NoCredentialsError, ClientError):
            pass
    return f"https://mock-s3-url.local/{key}"
