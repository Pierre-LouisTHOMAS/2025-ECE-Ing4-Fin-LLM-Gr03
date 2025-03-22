from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os
from pathlib import Path
from datetime import datetime

# Création du répertoire de données s'il n'existe pas
data_dir = Path("./data")
data_dir.mkdir(exist_ok=True)

# Création de la connexion à la base de données
DATABASE_URL = "sqlite:///./data/conversations.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Création de la session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Création du modèle de base
Base = declarative_base()

# Définition des modèles
class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, index=True)
    created_at = Column(String)
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(String, ForeignKey("conversations.id"))
    message_id = Column(String)  # Modifié de Integer à String pour accepter les IDs au format chaîne
    sender = Column(String)
    text = Column(Text)
    
    conversation = relationship("Conversation", back_populates="messages")

# Modèle pour stocker les souvenirs extraits des conversations
class ConversationMemory(Base):
    __tablename__ = "conversation_memories"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(String, ForeignKey("conversations.id"), index=True)
    key = Column(String, index=True)  # Type d'information (nom, préférence, etc.)
    value = Column(Text)  # Valeur de l'information
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relation avec la conversation
    conversation = relationship("Conversation")

# Création des tables
Base.metadata.create_all(bind=engine)

# Fonction pour obtenir une session de base de données
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
