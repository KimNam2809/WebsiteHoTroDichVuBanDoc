from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
import json
import os
from typing import Dict, Any

router = APIRouter()

CONFIG_FILE_PATH = "data/settings.json"

# Default Settings
DEFAULT_CONFIG = {
    "general": {
        "libraryName": "Smart Lib ĐN",
        "emailContact": "contact@thuvien.danang.gov.vn",
        "workingHours": "7:30 - 20:00"
    },
    "loans": {
        "maxBooksPerUser": 5,
        "loanDurationDays": 14,
        "allowRenewal": True,
        "renewalDays": 7
    },
    "fines": {
        "overdueFinePerDay": 5000,
        "lostBookMultiplier": 2.0
    }
}

class ConfigModel(BaseModel):
    general: Dict[str, Any]
    loans: Dict[str, Any]
    fines: Dict[str, Any]

def load_config():
    if not os.path.exists("data"):
        os.makedirs("data")
    
    if not os.path.exists(CONFIG_FILE_PATH):
        with open(CONFIG_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(DEFAULT_CONFIG, f, indent=4, ensure_ascii=False)
        return DEFAULT_CONFIG
        
    try:
        with open(CONFIG_FILE_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return DEFAULT_CONFIG

@router.get("/", response_model=Dict[str, Any])
def get_system_config():
    return load_config()

@router.put("/", response_model=Dict[str, Any])
def update_system_config(config: ConfigModel):
    try:
        data = config.model_dump()
        with open(CONFIG_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
