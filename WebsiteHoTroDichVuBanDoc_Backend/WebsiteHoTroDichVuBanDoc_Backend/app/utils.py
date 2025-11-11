import datetime
import json
from decimal import Decimal
from pytz import timezone

VIETNAM_TZ = timezone("Asia/Ho_Chi_Minh")

def custom_json_encoder(obj):
    # Xử lý datetime có timezone
    if isinstance(obj, datetime.datetime):
        if obj.tzinfo is None or obj.tzinfo.utcoffset(obj) is None:
            obj = VIETNAM_TZ.localize(obj)
        return obj.isoformat()
    # Xử lý date thông thường
    if isinstance(obj, datetime.date):
        return obj.isoformat()
    # Xử lý Decimal
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable")

def to_json_safe(data):
    """
    Chuyển đổi mọi dữ liệu có datetime/decimal sang JSON-safe.
    """
    json_str = json.dumps(data, default=custom_json_encoder)
    return json.loads(json_str)  # Trả về dict an toàn
