from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

# Initialisation de FastAPI
app = FastAPI()

# Ajout du middleware CORS
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Chargement du modèle EXAONE
MODEL_NAME = "LGAI-EXAONE/EXAONE-3.5-2.4B-Instruct"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(MODEL_NAME, trust_remote_code=True)

# Schéma de la requête
class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat(request: ChatRequest):
    try:
        # Prompt d'entrée amélioré avec des instructions claires pour le modèle
        system_prompt = "Tu es un assistant IA français serviable, clair et concis. Réponds en français de manière naturelle et directe, sans instructions ni méta-commentaires. Fournis des réponses utiles et pertinentes."
        
        input_text = f"{system_prompt}\n\nUtilisateur: {request.message}\nAssistant:"
        input_ids = tokenizer.encode(input_text, return_tensors="pt")

        # Génération de la réponse avec des paramètres améliorés
        with torch.no_grad():
            output = model.generate(
                input_ids,
                max_new_tokens=150,  # Augmentation pour des réponses plus complètes
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

        return {"response": response_text}

    except Exception as e:
        return {"response": "Erreur interne du serveur", "error": str(e)}

# Route de test
@app.get("/")
def home():
    return {"message": "API en ligne et prête à fonctionner"}
