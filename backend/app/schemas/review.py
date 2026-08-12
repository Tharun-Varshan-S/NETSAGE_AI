from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReviewCreate(BaseModel):
    status: str  # 'Accepted', 'Edited', 'Rejected'
    reason: Optional[str] = None

class ReviewResponse(ReviewCreate):
    id: int
    case_id: int
    created_at: datetime

    model_config = {"from_attributes": True}
