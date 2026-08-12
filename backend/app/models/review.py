from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), unique=True, nullable=False)
    
    # 'Accepted', 'Edited', 'Rejected'
    status = Column(String, nullable=False)
    
    # Reason for editing or rejecting
    reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    case = relationship("Case", back_populates="review")
