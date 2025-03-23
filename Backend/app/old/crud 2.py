from sqlalchemy.orm import Session
from . import database, schema
from datetime import datetime
from typing import List, Optional, Dict, Any

# Opérations pour les conversations
def get_conversation(db: Session, conversation_id: str):
    """Récupère une conversation par son ID"""
    return db.query(database.Conversation).filter(database.Conversation.id == conversation_id).first()

def get_conversations(db: Session, skip: int = 0, limit: int = 100):
    """Récupère toutes les conversations"""
    return db.query(database.Conversation).offset(skip).limit(limit).all()

def create_conversation(db: Session, conversation: schema.ConversationCreate):
    """Crée une nouvelle conversation"""
    db_conversation = database.Conversation(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at
    )
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    
    # Ajouter les messages s'il y en a
    for msg in conversation.messages:
        db_message = database.Message(
            conversation_id=db_conversation.id,
            message_id=msg.message_id,
            sender=msg.sender,
            text=msg.text
        )
        db.add(db_message)
    
    db.commit()
    return db_conversation

def update_conversation(db: Session, conversation_id: str, title: str):
    """Met à jour le titre d'une conversation"""
    db_conversation = get_conversation(db, conversation_id)
    if db_conversation:
        db_conversation.title = title
        db.commit()
        db.refresh(db_conversation)
    return db_conversation

def delete_conversation(db: Session, conversation_id: str):
    """Supprime une conversation"""
    db_conversation = get_conversation(db, conversation_id)
    if db_conversation:
        db.delete(db_conversation)
        db.commit()
        return True
    return False

# Opérations pour les messages
def get_messages(db: Session, conversation_id: str):
    """Récupère tous les messages d'une conversation"""
    return db.query(database.Message).filter(database.Message.conversation_id == conversation_id).all()

def add_message(db: Session, conversation_id: str, message: schema.MessageCreate):
    """Ajoute un message à une conversation"""
    db_message = database.Message(
        conversation_id=conversation_id,
        message_id=message.message_id,
        sender=message.sender,
        text=message.text
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def save_conversation_with_messages(db: Session, conversation_id: str, title: str, messages: List[schema.MessageCreate]):
    """Sauvegarde une conversation complète avec ses messages"""
    # Vérifier si la conversation existe déjà
    db_conversation = get_conversation(db, conversation_id)
    
    if db_conversation:
        # Mettre à jour le titre
        db_conversation.title = title
        
        # Supprimer tous les messages existants
        db.query(database.Message).filter(database.Message.conversation_id == conversation_id).delete()
    else:
        # Créer une nouvelle conversation
        db_conversation = database.Conversation(
            id=conversation_id,
            title=title,
            created_at=datetime.now().isoformat()
        )
        db.add(db_conversation)
    
    db.commit()
    
    # Ajouter les nouveaux messages
    for msg in messages:
        db_message = database.Message(
            conversation_id=conversation_id,
            message_id=msg.message_id,
            sender=msg.sender,
            text=msg.text
        )
        db.add(db_message)
    
    db.commit()
    db.refresh(db_conversation)
    return db_conversation

# Opérations pour les souvenirs de conversation
def get_conversation_memories(db: Session, conversation_id: str):
    """Récupère tous les souvenirs d'une conversation"""
    return db.query(database.ConversationMemory).filter(
        database.ConversationMemory.conversation_id == conversation_id
    ).all()

def get_memory_by_key(db: Session, conversation_id: str, key: str):
    """Récupère un souvenir spécifique par sa clé"""
    return db.query(database.ConversationMemory).filter(
        database.ConversationMemory.conversation_id == conversation_id,
        database.ConversationMemory.key == key
    ).first()

def create_or_update_memory(db: Session, conversation_id: str, key: str, value: str):
    """Crée ou met à jour un souvenir dans une conversation"""
    # Vérifier si le souvenir existe déjà
    memory = get_memory_by_key(db, conversation_id, key)
    
    if memory:
        # Mettre à jour la valeur
        memory.value = value
        memory.updated_at = datetime.now()
    else:
        # Créer un nouveau souvenir
        memory = database.ConversationMemory(
            conversation_id=conversation_id,
            key=key,
            value=value
        )
        db.add(memory)
    
    db.commit()
    db.refresh(memory)
    return memory

def delete_memory(db: Session, conversation_id: str, key: str):
    """Supprime un souvenir spécifique"""
    memory = get_memory_by_key(db, conversation_id, key)
    if memory:
        db.delete(memory)
        db.commit()
        return True
    return False

def get_memories_as_dict(db: Session, conversation_id: str) -> Dict[str, str]:
    """Récupère tous les souvenirs d'une conversation sous forme de dictionnaire"""
    memories = get_conversation_memories(db, conversation_id)
    return {memory.key: memory.value for memory in memories}
