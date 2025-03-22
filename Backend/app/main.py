from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import io
import gc
import threading
import queue
import uuid
from datetime import datetime
from PIL import Image
from PyPDF2 import PdfReader

# Import du module MLX-VLM personnalisé pour le modèle multimodal
from .mlx_vlm_model import get_model

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

# Chargement du modèle Qwen2.5-VL-3B-Instruct-8bit optimisé pour Apple Silicon
print("Chargement du modèle Qwen2.5-VL-3B-Instruct-8bit optimisé pour Apple Silicon...")

# Obtention de l'instance singleton du modèle MLX
mlx_model = get_model()

# File d'attente pour les requêtes au modèle (évite les problèmes de concurrence)
model_queue = queue.Queue()

# Fonction pour préchauffer le modèle
def warm_up_model():
    mlx_model.warmup()
    print("Modèle MLX préchauffé et prêt à l'emploi")

# Exécution du warm-up en arrière-plan
threading.Thread(target=warm_up_model).start()

# Dépendance pour obtenir la session de base de données
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Fonction commune pour générer une réponse du modèle
def generate_model_response(input_text, image_path=None):
    try:
        # Génération de la réponse avec MLX (optimisé pour Apple Silicon)
        if image_path:
            response = mlx_model.generate(
                prompt=input_text,
                image_path=image_path,
                max_tokens=250,           # Nombre maximum de tokens à générer
                temperature=0.7,          # Contrôle de la créativité
                top_p=0.9                 # Filtrage des tokens les moins probables
            )
        else:
            response = mlx_model.generate(
                prompt=input_text,
                max_tokens=250,           # Nombre maximum de tokens à générer
                temperature=0.7,          # Contrôle de la créativité
                top_p=0.9                 # Filtrage des tokens les moins probables
            )
        
        # Extraction du texte généré
        response_text = response['generated_text']

        # Nettoyage de la réponse : extraction de la partie après "Assistant:"
        try:
            # Essayer d'extraire uniquement la réponse de l'assistant
            if "Assistant:" in response_text:
                response_text = response_text.split("Assistant:")[-1].strip()
            # Si la sortie brute de mlx_vlm contient des balises de formatage
            elif "<answer>" in response_text and "</answer>" in response_text:
                response_text = response_text.split("<answer>")[-1].split("</answer>")[0].strip()
            else:
                # En cas d'échec, utiliser l'ancienne méthode de nettoyage
                response_text = response_text.replace(input_text, "").strip()
        except Exception as e:
            print(f"Erreur lors du nettoyage de la réponse: {e}")
            # Utiliser la réponse brute en dernier recours
            pass

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

# Endpoint pour le chat avec l'IA (image)
@app.post("/chat-image", response_model=schema.ChatResponse)
async def chat_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        # Vérification du type de fichier
        if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            return {"response": "Erreur: Veuillez télécharger une image valide (PNG, JPG, JPEG ou WEBP)."}
        
        # Création du dossier temporaire s'il n'existe pas
        temp_dir = "temp_images"
        os.makedirs(temp_dir, exist_ok=True)
        
        # Génération d'un nom de fichier unique
        file_extension = os.path.splitext(file.filename)[1]
        temp_image_path = os.path.join(temp_dir, f"{uuid.uuid4()}{file_extension}")
        
        # Lecture et sauvegarde de l'image
        image_content = await file.read()
        with open(temp_image_path, "wb") as f:
            f.write(image_content)
        
        # Vérification que l'image est valide
        try:
            img = Image.open(temp_image_path)
            img.verify()  # Vérifie que l'image est valide
        except Exception as e:
            os.remove(temp_image_path)  # Suppression du fichier temporaire
            return {"response": f"Erreur: L'image n'est pas valide. Détails: {str(e)}"}
        
        # Prompt d'entrée pour l'analyse d'image
        system_prompt = "Tu es un assistant IA français serviable, clair et concis basé sur le modèle Qwen. Tu vas analyser cette image et décrire ce que tu vois. Réponds en français de manière naturelle et directe."
        
        input_text = f"{system_prompt}\n\nUtilisateur: Pourrais-tu décrire cette image et me dire ce que tu y vois?\nAssistant:"
        
        # Génération de la réponse avec l'image
        response_text = generate_model_response(input_text, temp_image_path)
        
        # Suppression du fichier temporaire après utilisation
        try:
            os.remove(temp_image_path)
        except Exception as e:
            print(f"Erreur lors de la suppression du fichier temporaire: {e}")
        
        return {"response": response_text}
    
    except Exception as e:
        return {"response": f"Erreur lors du traitement de l'image: {str(e)}"}

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
        # Augmenté pour profiter des 48 Go de RAM disponibles
        max_chars = 6000
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
