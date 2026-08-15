from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database.database import get_db
from security.auth import get_current_user
from services.chatbot_service import process_chat_message

router = APIRouter(
    prefix="/ai",
    tags=["AI Assistant"]
)


class ChatRequest(BaseModel):
    message: str = Field(..., max_length=1000, description="User prompt or question to the Institute AI Assistant")


@router.post("/chat")
def chat_with_ai(
    data: ChatRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if not data.message or len(data.message.strip()) == 0:
        raise HTTPException(
            status_code=400,
            detail="Message content cannot be empty"
        )

    try:
        response = process_chat_message(
            db=db,
            current_user=current_user,
            message=data.message
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing AI response: {str(e)}"
        )
