from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class ResumeBase(BaseModel):
    file_name: str
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = []
    education: List[Any] = []
    experience: List[Any] = []

class ResumeResponseData(ResumeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class SingleUploadResponse(BaseModel):
    status: str
    data: ResumeResponseData

class MultiUploadResultItem(BaseModel):
    file_name: str
    status: str
    data: Optional[ResumeResponseData] = None
    error: Optional[str] = None

class MultiUploadResponse(BaseModel):
    status: str
    batch_id: str
    total: int
    successful: int
    failed: int
    results: List[MultiUploadResultItem]
