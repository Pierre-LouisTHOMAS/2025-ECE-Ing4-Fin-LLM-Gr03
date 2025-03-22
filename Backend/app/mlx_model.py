"""
Module pour charger et utiliser le modèle Qwen2.5-VL-3B-Instruct-8bit avec MLX
Optimisé pour les puces Apple Silicon
"""

import mlx.core as mx
from huggingface_hub import snapshot_download
from transformers import AutoTokenizer
import json
import os
from typing import Dict, Any
import gc

class MLXQwenModel:
    """Classe pour charger et utiliser le modèle Qwen2.5-VL avec MLX"""
    
    def __init__(self, model_name: str = "mlx-community/Qwen2.5-VL-3B-Instruct-8bit"):
        """Initialisation du modèle MLX Qwen"""
        self.model_name = model_name
        self.model = None
        self.tokenizer = None
        self.config = None
        
        print(f"Initialisation du modèle MLX: {model_name}")
        self._load_model()
        
    def _load_model(self):
        """Charge le modèle et le tokenizer depuis Hugging Face"""
        # Téléchargement du modèle depuis Hugging Face
        print("Téléchargement du modèle depuis Hugging Face...")
        model_path = snapshot_download(self.model_name)
        
        # Chargement du tokenizer
        print("Chargement du tokenizer...")
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        
        # Chargement de la configuration du modèle
        print("Chargement de la configuration...")
        with open(os.path.join(model_path, "config.json"), "r") as f:
            self.config = json.load(f)
        
        # Chargement des poids du modèle avec MLX
        print("Chargement des poids du modèle avec MLX...")
        import mlx.core as mx
        from mlx_lm.utils import load_model
        
        # Chargement des poids MLX
        # Utilisons la fonction load_model de mlx_lm qui est plus fiable
        model_path_config = {
            "model_path": model_path,
            "tokenizer_path": model_path
        }
        
        # Utilisons directement les fonctions de mlx_lm pour charger le modèle
        from mlx_lm import load, generate
        
        # Chargement du modèle et du tokenizer
        print("Chargement du modèle avec mlx_lm.load...")
        self.model, self.tokenizer = load(model_path)
        
        print("Modèle MLX chargé avec succès!")
        
    def generate(self, prompt: str, max_tokens: int = 250, temperature: float = 0.7, 
                top_p: float = 0.9, repetition_penalty: float = 1.1) -> Dict[str, Any]:
        """
        Génère une réponse à partir d'un prompt
        
        Args:
            prompt: Le texte d'entrée
            max_tokens: Nombre maximum de tokens à générer
            temperature: Température pour le sampling (plus élevé = plus créatif)
            top_p: Filtrage des tokens les moins probables
            repetition_penalty: Pénalité pour éviter les répétitions
            
        Returns:
            Dictionnaire contenant le texte généré
        """
        # Utilisation de la fonction generate de mlx_lm
        from mlx_lm import generate
        
        print(f"Génération de la réponse avec {max_tokens} tokens max...")
        
        # Paramètres de génération
        generation_args = {
            "max_tokens": max_tokens,
            "temperature": temperature,
            "top_p": top_p,
        }
        
        # Génération avec mlx_lm
        response = generate(
            model=self.model,
            tokenizer=self.tokenizer,
            prompt=prompt,
            **generation_args
        )
        
        # Extraction du texte généré
        generated_text = response["generated_text"]
        
        # Nettoyage de la mémoire
        mx.clear_memory_pool()
        gc.collect()
        
        return {"generated_text": generated_text}
    
    def warmup(self):
        """Préchauffe le modèle avec une requête simple"""
        print("Préchauffage du modèle MLX...")
        from mlx_lm import generate
        
        # Génération d'une réponse simple pour préchauffer le modèle
        generate(
            model=self.model,
            tokenizer=self.tokenizer,
            prompt="Bonjour, comment ça va?",
            max_tokens=10
        )
        print("Modèle MLX préchauffé et prêt à l'emploi!")


# Fonction pour obtenir une instance singleton du modèle
_model_instance = None

def get_model():
    """Retourne l'instance singleton du modèle MLX Qwen"""
    global _model_instance
    if _model_instance is None:
        _model_instance = MLXQwenModel()
    return _model_instance
