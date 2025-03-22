from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
from transformers import AutoTokenizer, AutoModelForVision2Seq
import torch
import os
import io
from datetime import datetime
from PyPDF2 import PdfReader

# Import des modules locaux
from . import crud, database, schema

# Initialisation de FastAPI
app = FastAPI(title="Qwen Chat API")

# Ajout du middleware CORS
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:59141", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Chargement du modèle Qwen
MODEL_NAME = "Qwen/Qwen2.5-VL-3B-Instruct"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForVision2Seq.from_pretrained(MODEL_NAME, trust_remote_code=True)

# Dépendance pour obtenir la session de base de données
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Fonction commune pour générer une réponse du modèle
def generate_model_response(input_text):
    try:
        input_ids = tokenizer.encode(input_text, return_tensors="pt")

        # Génération de la réponse avec des paramètres améliorés
        with torch.no_grad():
            output = model.generate(
                input_ids,
                max_new_tokens=250,  # Augmentation pour des réponses plus complètes
                pad_token_id=tokenizer.eos_token_id,
                do_sample=True,     # Permet une génération plus naturelle
                temperature=0.7,     # Contrôle la créativité (plus bas = plus déterministe)
                top_p=0.9            # Filtre les tokens les moins probables
            )

        response_text = tokenizer.decode(output[0], skip_special_tokens=True)

        # Nettoyage de la réponse : extraction de la partie après "Assistant:"
        try:
            # Essayer d'extraire uniquement la réponse de l'assistant
            response_text = response_text.split("Assistant:")[-1].strip()
        except:
            # En cas d'échec, utiliser l'ancienne méthode de nettoyage
            response_text = response_text.replace(input_text, "").strip()

        return response_text
    except Exception as e:
        return f"Erreur lors de la génération de la réponse: {str(e)}"

# Endpoint pour le chat avec l'IA (texte)
@app.post("/chat", response_model=schema.ChatResponse)
def chat(request: schema.ChatRequest, db: Session = Depends(get_db)):
    try:
        # Prompt d'entrée amélioré avec des instructions claires pour le modèle
        system_prompt = "Tu es un assistant IA français serviable, clair et concis basé sur le modèle Qwen. Réponds en français de manière naturelle et directe, sans instructions ni méta-commentaires. Fournis des réponses utiles et pertinentes."
        
        input_text = f"{system_prompt}\n\nUtilisateur: {request.message}\nAssistant:"
        response_text = generate_model_response(input_text)

        return {"response": response_text}

    except Exception as e:
        return {"response": f"Erreur interne du serveur: {str(e)}"}

# Endpoint pour le chat avec l'IA (PDF)
@app.post("/chat-pdf", response_model=schema.ChatResponse)
async def chat_pdf(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        # Vérification du type de fichier
        if not file.filename.lower().endswith('.pdf'):
            return {"response": "Erreur: Veuillez télécharger un fichier PDF valide."}
        
        # Lecture du contenu du fichier
        pdf_content = await file.read()
        pdf_file = io.BytesIO(pdf_content)
        
        # Extraction du texte du PDF
        pdf_reader = PdfReader(pdf_file)
        pdf_text = ""
        
        # Extraction du texte de chaque page
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            pdf_text += page.extract_text() + "\n"
        
        # Limiter la taille du texte pour éviter de dépasser les limites du modèle
        max_chars = 4000
        if len(pdf_text) > max_chars:
            pdf_text = pdf_text[:max_chars] + "...\n(Le document a été tronqué car il était trop long)"
        
        # Prompt d'entrée avec le contenu du PDF
        system_prompt = "Tu es un assistant IA français serviable, clair et concis basé sur le modèle Qwen. Tu vas analyser le contenu d'un document PDF et répondre aux questions à son sujet. Réponds en français de manière naturelle et directe."
        
        input_text = f"{system_prompt}\n\nContenu du document PDF:\n{pdf_text}\n\nUtilisateur: Pourrais-tu me résumer ce document et m'indiquer les points clés?\nAssistant:"
        
        # Génération de la réponse
        response_text = generate_model_response(input_text)
        
        return {"response": response_text}
    
    except Exception as e:
        print(f"Erreur lors du traitement du PDF: {str(e)}")
        return {"response": f"Erreur lors du traitement du PDF: {str(e)}"}

# Endpoints pour la gestion des conversations
@app.get("/conversations", response_model=List[schema.Conversation])
def get_conversations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Récupère toutes les conversations"""
    conversations = crud.get_conversations(db, skip=skip, limit=limit)
    return conversations

@app.get("/conversations/{conversation_id}", response_model=schema.Conversation)
def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
    """Récupère une conversation par son ID"""
    db_conversation = crud.get_conversation(db, conversation_id=conversation_id)
    if db_conversation is None:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    return db_conversation

@app.post("/conversations", response_model=schema.Conversation, status_code=status.HTTP_201_CREATED)
def create_conversation(conversation: schema.ConversationCreate, db: Session = Depends(get_db)):
    """Crée une nouvelle conversation"""
    return crud.create_conversation(db=db, conversation=conversation)

@app.put("/conversations/{conversation_id}", response_model=schema.Conversation)
def update_conversation(conversation_id: str, conversation_data: schema.ConversationBase, db: Session = Depends(get_db)):
    """Met à jour le titre d'une conversation"""
    db_conversation = crud.update_conversation(db, conversation_id=conversation_id, title=conversation_data.title)
    if db_conversation is None:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    return db_conversation

@app.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    """Supprime une conversation"""
    success = crud.delete_conversation(db, conversation_id=conversation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    return {"status": "success"}

@app.post("/conversations/{conversation_id}/save", response_model=schema.Conversation)
def save_conversation_with_messages(conversation_id: str, data: schema.ConversationCreate, db: Session = Depends(get_db)):
    """Sauvegarde une conversation complète avec ses messages"""
    return crud.save_conversation_with_messages(db, conversation_id=conversation_id, title=data.title, messages=data.messages)

# Route de test
@app.get("/")
def home():
    return {"message": "Qwen Chat API en ligne et prête à fonctionner"}
