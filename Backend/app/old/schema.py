from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union
from datetime import datetime

# Schéma pour les messages de l'historique
class MessageHistory(BaseModel):
    role: str  # 'user' ou 'assistant'
    content: str

# Schéma pour les requêtes de chat
class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = "default_conversation"
    history: Optional[List[MessageHistory]] = []

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

# Schéma pour les souvenirs de conversation
class ConversationMemoryBase(BaseModel):
    key: str
    value: str

class ConversationMemoryCreate(ConversationMemoryBase):
    pass

class ConversationMemory(ConversationMemoryBase):
    id: int
    conversation_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# Schéma pour la réponse de l'API
class ChatResponse(BaseModel):
    response: str
