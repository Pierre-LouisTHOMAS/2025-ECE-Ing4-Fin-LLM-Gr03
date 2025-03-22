from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Schéma pour les requêtes de chat
class ChatRequest(BaseModel):
    message: str

# Schéma pour les messages
class MessageBase(BaseModel):
    message_id: str | int  # Accepte à la fois les chaînes et les nombres
    sender: str
    text: str

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: int
    conversation_id: str

    class Config:
        orm_mode = True

# Schéma pour les conversations
class ConversationBase(BaseModel):
    title: str

class ConversationCreate(ConversationBase):
    id: str
    created_at: str = datetime.now().isoformat()
    messages: List[MessageCreate] = []

class Conversation(ConversationBase):
    id: str
    created_at: str
    messages: List[Message] = []

    class Config:
        orm_mode = True

# Schéma pour la réponse de l'API
class ChatResponse(BaseModel):
    response: str
