from fastapi import FastAPI, HTTPException, status, File, UploadFile, Form
from typing import List, Optional, Dict, Any
import os
import io
import gc
import threading
import queue
import uuid
import json
from datetime import datetime
from PIL import Image
from PyPDF2 import PdfReader

# Import du module MLX-VLM personnalisé pour le modèle multimodal
from .mlx_vlm_model import get_model

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

# Création du répertoire pour les fichiers temporaires
os.makedirs("./temp", exist_ok=True)

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

# Fonction pour s'assurer que le répertoire de mémoire existe
def ensure_memory_dir():
    os.makedirs(memory_service.MEMORY_DIR, exist_ok=True)

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
@app.post("/chat", response_model=Dict[str, Any])
def chat(request: Dict[str, Any]):
    """Endpoint pour le chat avec l'IA (texte uniquement)"""
    try:
        # Récupérer le message de l'utilisateur
        message = request.get("message", "")
        if not message:
            return {"response": "Veuillez fournir un message."}
        
        # Prompt d'entrée avec contexte personnalisé et instructions claires pour le modèle
        system_prompt = """Tu es Lepl, un modèle d'IA français créé par 3 jeunes pour le cours d'IA. 

Règles importantes:
1. Tu dois être synthétique et clair dans tes réponses
2. Si tu ne connais pas la réponse, dis-le clairement
3. Réponds en français de manière naturelle et directe
4. Évite les instructions ou méta-commentaires dans tes réponses
5. Fournis des réponses utiles et pertinentes
6. Sois concis et précis dans tes réponses
"""
        
        # Construction du prompt simple
        prompt = f"{system_prompt}\n\n"
        
        # Ajout du message actuel
        prompt += f"Utilisateur: {message}\nAssistant:"
        
        # Log pour le débogage
        print(f"Prompt final envoyé au modèle:\n{prompt}")
        
        # Génération de la réponse
        response_text = generate_model_response(prompt)
        
        return {"response": response_text}

    except Exception as e:
        return {"response": f"Erreur interne du serveur: {str(e)}"}

# Endpoint pour le chat avec l'IA (image)
@app.post("/chat-image", response_model=Dict[str, Any])
async def chat_image(
    file: UploadFile = File(...), 
    question: Optional[str] = Form(None), 
    conversation_id: Optional[str] = Form("default_conversation")
):
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
        
        # Prompt d'entrée pour l'analyse d'image avec contexte personnalisé
        system_prompt = """Tu es Lepl, un modèle d'IA français créé par 3 jeunes pour le cours d'IA, avec capacités de vision. 

Règles importantes:
1. Tu dois être synthétique et clair dans tes réponses
2. Si tu ne peux pas analyser correctement l'image, dis-le clairement
3. Analyse l'image fournie avec précision et réponds aux questions à son sujet
4. Réponds en français de manière naturelle et directe
5. Évite les instructions ou méta-commentaires dans tes réponses
6. Sois concis et précis dans tes réponses
"""
        
        # Construction du prompt simple
        prompt = f"{system_prompt}\n\n"
        
        # Ajout de la question ou utilisation d'une question par défaut
        user_question = question if question else "Pourrais-tu décrire cette image et me dire ce que tu y vois?"
        prompt += f"Utilisateur: {user_question}\nAssistant:"
        
        # Log pour le débogage
        print(f"Prompt final envoyé au modèle (image):\n{prompt}")
        
        # Génération de la réponse avec l'image
        response_text = generate_model_response(prompt, temp_image_path)
        
        # Suppression du fichier temporaire après utilisation
        try:
            os.remove(temp_image_path)
        except Exception as e:
            print(f"Erreur lors de la suppression du fichier temporaire: {e}")
        
        return {"response": response_text}
    
    except Exception as e:
        return {"response": f"Erreur lors du traitement de l'image: {str(e)}"}

# Endpoint pour le chat avec l'IA (PDF)
@app.post("/chat-pdf", response_model=Dict[str, Any])
async def chat_pdf(
    file: UploadFile = File(...), 
    question: Optional[str] = Form(None), 
    conversation_id: Optional[str] = Form("default_conversation")
):
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
        
        # Traitement simplifié sans stockage des informations
        print(f"Traitement du PDF: {file.filename} avec la question: {question if question else 'Aucune question spécifiée'}")
        
        # Prompt d'entrée avec contexte personnalisé et contenu du PDF
        system_prompt = """Tu es Lepl, un modèle d'IA français créé par 3 jeunes pour le cours d'IA. 

Règles importantes:
1. Tu dois être synthétique et clair dans tes réponses
2. Si tu ne peux pas analyser correctement le document, dis-le clairement
3. Analyse le document PDF fourni avec précision et réponds aux questions à son sujet
4. Réponds en français de manière naturelle et directe
5. Évite les instructions ou méta-commentaires dans tes réponses
6. Sois concis et précis dans tes réponses
"""
        
        # Construction du prompt simple
        prompt = f"{system_prompt}\n\n"
            
        # Ajouter le contenu du PDF
        prompt += f"Contenu du document PDF:\n{pdf_text}\n\n"
        
        # Ajout de la question ou utilisation d'une question par défaut
        user_question = question if question else "Pourrais-tu me résumer ce document et m'indiquer les points clés?"
        prompt += f"Utilisateur: {user_question}\nAssistant:"
        
        # Log pour le débogage
        print(f"Prompt final envoyé au modèle (PDF):\n{prompt}")
        
        # Génération de la réponse
        response_text = generate_model_response(prompt)
        
        return {"response": response_text}
    
    except Exception as e:
        print(f"Erreur lors du traitement du PDF: {str(e)}")
        return {"response": f"Erreur lors du traitement du PDF: {str(e)}"}

# Endpoint simple pour tester que l'API fonctionne
@app.get("/conversations", response_model=List[Dict[str, Any]])
def get_conversations():
    """Renvoie une liste de conversations factices pour compatibilité avec le frontend"""
    return [
        {
            "id": "default_conversation",
            "title": "Nouvelle conversation",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
    ]

@app.post("/conversations", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def create_conversation(conversation: Dict[str, Any]):
    """Crée une nouvelle conversation factice"""
    conversation_id = conversation.get("id", str(uuid.uuid4()))
    title = conversation.get("title", f"Conversation {conversation_id}")
    
    return {
        "id": conversation_id,
        "title": title,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }

# Endpoints pour la gestion des souvenirs de conversation
@app.get("/conversations/{conversation_id}/memories", response_model=Dict[str, Any])
def get_conversation_memories(conversation_id: str):
    """Récupère tous les souvenirs d'une conversation"""
    try:
        # Charger la mémoire de la conversation
        memory = memory_service.load_memory(conversation_id)
        # Vérifier si le fichier existe
        memory_file = memory_service.get_memory_file_path(conversation_id)
        if not memory_file.exists():
            raise HTTPException(status_code=404, detail="Conversation non trouvée")
        
        # Retourner les souvenirs
        return {"memories": memory.get("memories", {})}
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Conversation non trouvée: {str(e)}")

@app.post("/conversations/{conversation_id}/memories", response_model=Dict[str, Any])
def create_memory(conversation_id: str, memory_data: Dict[str, Any]):
    """Crée ou met à jour un souvenir dans une conversation"""
    try:
        # Charger la mémoire de la conversation
        memory = memory_service.load_memory(conversation_id)
        # Vérifier si le fichier existe
        memory_file = memory_service.get_memory_file_path(conversation_id)
        if not memory_file.exists():
            raise HTTPException(status_code=404, detail="Conversation non trouvée")
            
        # Ajouter ou mettre à jour le souvenir
        key = memory_data.get("key")
        value = memory_data.get("value")
        
        if not key or not value:
            raise HTTPException(status_code=400, detail="La clé et la valeur sont requises")
            
        # Mettre à jour la mémoire
        memory["memories"][key] = {
            "value": value,
            "updated_at": datetime.now().isoformat()
        }
        
        # Sauvegarder la mémoire
        memory_service.save_memory(conversation_id, memory)
        
        return {
            "key": key,
            "value": value,
            "conversation_id": conversation_id,
            "updated_at": memory["memories"][key]["updated_at"]
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création du souvenir: {str(e)}")

@app.delete("/conversations/{conversation_id}/memories/{key}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory(conversation_id: str, key: str):
    """Supprime un souvenir spécifique"""
    try:
        # Charger la mémoire de la conversation
        memory = memory_service.load_memory(conversation_id)
        # Vérifier si le fichier existe
        memory_file = memory_service.get_memory_file_path(conversation_id)
        if not memory_file.exists():
            raise HTTPException(status_code=404, detail="Conversation non trouvée")
        
        # Vérifier si le souvenir existe
        if key not in memory.get("memories", {}):
            raise HTTPException(status_code=404, detail="Souvenir non trouvé")
        
        # Supprimer le souvenir
        del memory["memories"][key]
        
        # Sauvegarder la mémoire
        memory_service.save_memory(conversation_id, memory)
        
        return {"status": "success"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression du souvenir: {str(e)}")

@app.post("/conversations/{conversation_id}/save", response_model=Dict[str, Any])
def update_conversation_title(conversation_id: str, title: str):
    """Met à jour le titre d'une conversation"""
    try:
        # Charger la mémoire de la conversation
        memory = memory_service.load_memory(conversation_id)
        
        # Mettre à jour le titre
        memory["title"] = title
        
        # Sauvegarder la mémoire
        if memory_service.save_memory(conversation_id, memory):
            return {
                "id": conversation_id,
                "title": title,
                "created_at": memory.get("created_at"),
                "updated_at": memory.get("updated_at")
            }
        else:
            raise HTTPException(status_code=500, detail="Erreur lors de la sauvegarde du titre de la conversation")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la mise à jour du titre de la conversation: {str(e)}")

# Endpoint pour sauvegarder une conversation
@app.post("/conversations/{conversation_id}/save")
def save_conversation(conversation_id: str, conversation_data: Dict[str, Any]):
    try:
        # Ici nous acceptons simplement la requête et retournons un succès
        # Nous ne stockons pas réellement les données puisque nous avons supprimé le service de mémoire
        return {
            "id": conversation_id,
            "title": conversation_data.get("title", f"Conversation {conversation_id}"),
            "created_at": conversation_data.get("created_at", datetime.now().isoformat()),
            "messages": conversation_data.get("messages", [])
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la sauvegarde de la conversation: {str(e)}"
        )

# Route de test
@app.get("/")
def home():
    return {"message": "Qwen Chat API en ligne et prête à fonctionner"}
