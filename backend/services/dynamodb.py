import json
import logging
from decimal import Decimal
from typing import Optional, List

import boto3
from botocore.exceptions import NoCredentialsError, ClientError

from config import settings
from schemas.consumer import SolarAnalysisResult

logger = logging.getLogger(__name__)

# In-memory fallback for local dev without AWS
_MOCK_DB: dict[str, list[dict]] = {}
_USE_MOCK = False


def _float_to_decimal(obj: dict) -> dict:
    """Convert all float values in a dict to Decimal for DynamoDB compatibility."""
    return json.loads(json.dumps(obj), parse_float=Decimal)


def get_dynamodb_table():
    global _USE_MOCK
    if _USE_MOCK:
        return None
    try:
        dynamodb = boto3.resource('dynamodb', region_name=settings.aws_region)
        table = dynamodb.Table(settings.dynamodb_table_name)
        # Verify table exists by checking its status
        table.table_status
        return table
    except (NoCredentialsError, ClientError, Exception) as e:
        logger.info(f"DynamoDB unavailable, using in-memory store: {e}")
        _USE_MOCK = True
        return None


def save_analysis(user_id: str, result: SolarAnalysisResult) -> None:
    item = result.model_dump()
    item['user_id'] = user_id

    table = get_dynamodb_table()
    if table:
        try:
            dynamo_item = _float_to_decimal(item)
            table.put_item(Item=dynamo_item)
            return
        except (NoCredentialsError, ClientError) as e:
            logger.warning(f"DynamoDB put_item failed, using fallback: {e}")

    # In-memory fallback
    if user_id not in _MOCK_DB:
        _MOCK_DB[user_id] = []
    _MOCK_DB[user_id].append(item)


def get_analysis(user_id: str, analysis_id: str) -> Optional[dict]:
    table = get_dynamodb_table()
    if table:
        try:
            response = table.get_item(Key={'user_id': user_id, 'analysis_id': analysis_id})
            if 'Item' in response:
                return response['Item']
        except (NoCredentialsError, ClientError) as e:
            logger.warning(f"DynamoDB get_item failed: {e}")

    user_records = _MOCK_DB.get(user_id, [])
    for rec in user_records:
        if rec.get('analysis_id') == analysis_id:
            return rec
    return None


def list_user_analyses(user_id: str) -> List[dict]:
    table = get_dynamodb_table()
    if table:
        try:
            response = table.query(
                KeyConditionExpression='user_id = :uid',
                ExpressionAttributeValues={':uid': user_id}
            )
            return response.get('Items', [])
        except (NoCredentialsError, ClientError) as e:
            logger.warning(f"DynamoDB query failed: {e}")

    return _MOCK_DB.get(user_id, [])
