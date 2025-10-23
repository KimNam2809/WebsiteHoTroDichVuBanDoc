import datetime
import json
from decimal import Decimal

def custom_json_encoder(obj):
    if isinstance(obj, (datetime.date, datetime.datetime)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable")

def to_json_safe(data):
    """
    Chuyển đổi mọi dữ liệu có datetime/decimal sang JSON-safe.
    """
    json_str = json.dumps(data, default=custom_json_encoder)
    return json.loads(json_str)  # Trả về dict an toàn
