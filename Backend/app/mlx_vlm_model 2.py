"""
Module pour charger et utiliser le modèle Qwen2.5-VL-3B-Instruct-8bit avec MLX-VLM
Optimisé pour les puces Apple Silicon
"""

import os
import gc
import subprocess
import tempfile
from typing import Dict, Any, Optional, List, Union
from PIL import Image

# Import des modules MLX pour les calculs optimisés
import mlx.core as mx

# Import spécifique pour le modèle Qwen2.5-VL
from mlx_vlm.models.qwen2_5_vl import Model as Qwen25VLModel
from huggingface_hub import snapshot_download

class MLXQwenModel:
    """Classe pour charger et utiliser le modèle Qwen2.5-VL avec MLX-VLM"""
    
    def __init__(self, model_name: str = "mlx-community/Qwen2.5-VL-3B-Instruct-8bit"):
        """Initialisation du modèle MLX-VLM Qwen"""
        self.model_name = model_name
        self.model = None
        
        print(f"Initialisation du modèle MLX-VLM: {model_name}")
        self._load_model()
        
    def _load_model(self):
        """Vérifie que mlx-vlm est installé et disponible"""
        print("Vérification de l'installation de mlx-vlm...")
        
        # Vérification que le module mlx-vlm est installé
        try:
            # Vérification simple avec une commande de base
            result = subprocess.run(
                ["python3", "-c", "import mlx_vlm; print('MLX-VLM disponible')"],
                capture_output=True,
                text=True,
                check=True
            )
            print(result.stdout.strip())
        except subprocess.CalledProcessError as e:
            print(f"Erreur: MLX-VLM n'est pas correctement installé: {e}")
            print(f"Sortie d'erreur: {e.stderr}")
            raise
            
        print(f"Modèle {self.model_name} sera utilisé via mlx_vlm.generate")
        
    def generate(self, prompt: str, image_path: Optional[str] = None, 
                max_tokens: int = 250, temperature: float = 0.7, 
                top_p: float = 0.9) -> Dict[str, Any]:
        """
        Génère une réponse à partir d'un prompt et optionnellement d'une image
        
        Args:
            prompt: Le texte d'entrée
            image_path: Chemin vers une image (optionnel)
            max_tokens: Nombre maximum de tokens à générer
            temperature: Température pour le sampling (plus élevé = plus créatif)
            top_p: Filtrage des tokens les moins probables
            
        Returns:
            Dictionnaire contenant le texte généré
        """
        print(f"Génération de la réponse avec {max_tokens} tokens max...")
        
        # Construction de la commande pour mlx_vlm.generate
        # Note: l'option --top-p n'est pas disponible dans cette version de mlx_vlm.generate
        cmd = [
            "python3", "-m", "mlx_vlm.generate",
            "--model", self.model_name,
            "--max-tokens", str(max_tokens),
            "--temperature", str(temperature)
        ]
        
        # Ajout du prompt directement via l'option --prompt
        cmd.extend(["--prompt", prompt])
        
        # Ajout de l'image si spécifiée
        if image_path and os.path.exists(image_path):
            print(f"Traitement de l'image: {image_path}")
            cmd.extend(["--image", image_path])
        
        # Exécution de la commande
        print("Exécution de la commande mlx_vlm.generate...")
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            raw_response = result.stdout.strip()
            response = self._clean_response(raw_response)
            print("Réponse générée avec succès")
        except subprocess.CalledProcessError as e:
            print(f"Erreur lors de la génération: {e}")
            print(f"Sortie d'erreur: {e.stderr}")
            response = f"Erreur: Impossible de générer une réponse. Détails: {e}"
        finally:
            # Plus besoin de supprimer un fichier temporaire car nous utilisons --prompt directement
            pass
        
        # Nettoyage de la mémoire
        # Note: mx.clear_memory_pool() n'existe pas dans cette version de MLX
        gc.collect()
        
        return {"generated_text": response}
    
    def _clean_response(self, raw_response):
        """
        Nettoie la réponse du modèle pour ne garder que le contenu utile pour l'utilisateur
        
        Args:
            raw_response: La réponse brute du modèle
            
        Returns:
            La réponse nettoyée
        """
        # Supprimer les balises et les informations techniques
        if "<|im_start|>assistant" in raw_response:
            # Extraire la partie entre <|im_start|>assistant et la fin ou le prochain <|im_
            start_marker = "<|im_start|>assistant"
            end_marker = "<|im_end|>"
            
            start_idx = raw_response.find(start_marker) + len(start_marker)
            end_idx = raw_response.find(end_marker, start_idx)
            
            if end_idx == -1:  # Si pas de balise de fin, prendre tout jusqu'à ==========
                end_idx = raw_response.find("==========", start_idx)
                
            if end_idx == -1:  # Si toujours pas trouvé, prendre tout jusqu'à Prompt:
                end_idx = raw_response.find("Prompt:", start_idx)
                
            if end_idx == -1:  # Si toujours pas trouvé, prendre tout le reste
                cleaned = raw_response[start_idx:].strip()
            else:
                cleaned = raw_response[start_idx:end_idx].strip()
        else:
            # Essayer de supprimer les statistiques de génération
            lines = raw_response.split('\n')
            cleaned_lines = []
            for line in lines:
                if not line.startswith("Prompt:") and not line.startswith("Generation:") and not line.startswith("Peak memory:") and not line.startswith("=========="):
                    cleaned_lines.append(line)
            cleaned = '\n'.join(cleaned_lines).strip()
        
        return cleaned
        
    def warmup(self):
        """Préchauffe le modèle avec une requête simple"""
        print("Préchauffage du modèle MLX-VLM...")
        
        # Vérification que le module mlx_vlm.generate fonctionne correctement
        try:
            # Test simple avec une commande de base
            result = subprocess.run(
                ["python3", "-m", "mlx_vlm.generate", "--help"],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                print("Module mlx_vlm.generate vérifié et disponible")
            else:
                print(f"Attention: Problème avec le module mlx_vlm.generate: {result.stderr}")
        except Exception as e:
            print(f"Erreur lors de la vérification de mlx_vlm.generate: {e}")
        
        print("Modèle MLX-VLM prêt à l'emploi!")


# Fonction pour obtenir une instance singleton du modèle
_model_instance = None

def get_model():
    """Retourne l'instance singleton du modèle MLX-VLM Qwen"""
    global _model_instance
    if _model_instance is None:
        _model_instance = MLXQwenModel()
    return _model_instance
