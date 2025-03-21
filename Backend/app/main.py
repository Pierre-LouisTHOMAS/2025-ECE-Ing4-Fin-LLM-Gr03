from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

# Initialisation de FastAPI
app = FastAPI()

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
        input_text = request.message
        input_ids = tokenizer.encode(input_text, return_tensors="pt")

        # Génération de la réponse
        with torch.no_grad():
            output = model.generate(input_ids, max_new_tokens=150)

        response_text = tokenizer.decode(output[0], skip_special_tokens=True)
        return {"response": response_text}

    except Exception as e:
        return {"response": "Erreur interne du serveur", "error": str(e)}

# Route de test
@app.get("/")
def home():
    return {"message": "API en ligne et prête à fonctionner"}