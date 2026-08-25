from datetime import datetime

from pydantic import BaseModel


class ReviewCreate(BaseModel):
    status: str  # 'Accepted', 'Edited', 'Rejected'
    reason: str | None = None

class ReviewResponse(ReviewCreate):
    id: int
    case_id: int
    created_at: datetime

    model_config = {"from_attributes": True}
