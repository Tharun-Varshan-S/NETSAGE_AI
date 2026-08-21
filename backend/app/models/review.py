from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), unique=True, nullable=False)
    
    # 'Accepted', 'Edited', 'Rejected'
    status = Column(String, nullable=False)
    
    # Reason for editing or rejecting
    reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    # RBAC field
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True) # nullable for backwards compat

    case = relationship("Case", back_populates="review")
    reviewer = relationship("User", back_populates="reviews")
