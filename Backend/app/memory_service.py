import os
import json
import datetime
from typing import Dict, List, Any, Optional, Union
import re

# Chemin vers le répertoire de stockage des mémoires
MEMORY_DIR = "./Backend/app/data/memories"

# S'assurer que le répertoire existe
os.makedirs(MEMORY_DIR, exist_ok=True)

class MemoryService:
    def __init__(self):
        self.user_memory_file = os.path.join(MEMORY_DIR, "user_memory.json")
        self._initialize_user_memory()

    def _initialize_user_memory(self):
        """Initialise le fichier de mémoire utilisateur s'il n'existe pas"""
        if not os.path.exists(self.user_memory_file):
            default_memory = {
                "name": None,
                "preferences": {},
                "facts": {},
                "context": []
            }
            with open(self.user_memory_file, 'w', encoding='utf-8') as f:
                json.dump(default_memory, f, ensure_ascii=False, indent=2)

    def _load_user_memory(self) -> Dict[str, Any]:
        """Charge la mémoire utilisateur depuis le fichier"""
        try:
            with open(self.user_memory_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            self._initialize_user_memory()
            return {
                "name": None,
                "preferences": {},
                "facts": {},
                "context": []
            }

    def _save_user_memory(self, memory: Dict[str, Any]):
        """Sauvegarde la mémoire utilisateur dans le fichier"""
        with open(self.user_memory_file, 'w', encoding='utf-8') as f:
            json.dump(memory, f, ensure_ascii=False, indent=2)

    def get_user_memory(self) -> Dict[str, Any]:
        """Récupère toutes les mémoires de l'utilisateur"""
        return self._load_user_memory()

    def save_user_memory(self, key: str, value: Any) -> bool:
        """
        Sauvegarde une information dans la mémoire utilisateur
        
        Args:
            key: Clé de la mémoire (ex: "name", "preferences.theme")
            value: Valeur à stocker
            
        Returns:
            bool: Succès de l'opération
        """
        memory = self._load_user_memory()
        
        # Gestion des clés imbriquées (ex: "preferences.theme")
        if "." in key:
            parts = key.split(".")
            current = memory
            for i, part in enumerate(parts):
                if i == len(parts) - 1:
                    current[part] = value
                else:
                    if part not in current or not isinstance(current[part], dict):
                        current[part] = {}
                    current = current[part]
        else:
            memory[key] = value
            
        self._save_user_memory(memory)
        return True

    def extract_memories_from_conversation(self, conversation_id: str, messages: List[Dict[str, str]]) -> bool:
        """
        Extrait des informations importantes d'une conversation
        
        Args:
            conversation_id: ID de la conversation
            messages: Liste des messages de la conversation
            
        Returns:
            bool: Succès de l'opération
        """
        memory = self._load_user_memory()
        
        # Extraction des informations personnelles
        for msg in messages:
            if msg["role"] == "user":
                # Extraction du nom
                name_patterns = [
                    r"Je m'appelle ([A-Z][a-z]+)",
                    r"Mon nom est ([A-Z][a-z]+)",
                    r"([A-Z][a-z]+) est mon prénom"
                ]
                
                for pattern in name_patterns:
                    match = re.search(pattern, msg["content"])
                    if match and match.group(1):
                        memory["name"] = match.group(1)
                
                # Extraction des préférences
                preference_patterns = [
                    r"Je préfère ([^.,]+)",
                    r"J'aime ([^.,]+)",
                    r"Ma préférence est ([^.,]+)"
                ]
                
                for pattern in preference_patterns:
                    matches = re.finditer(pattern, msg["content"])
                    for match in matches:
                        if match.group(1):
                            preference = match.group(1).strip().lower()
                            memory["preferences"][f"preference_{len(memory['preferences']) + 1}"] = preference
                
                # Extraction des faits importants
                if "je suis" in msg["content"].lower():
                    facts = re.findall(r"je suis ([^.,]+)", msg["content"].lower())
                    for fact in facts:
                        fact = fact.strip()
                        if fact:
                            memory["facts"][f"fact_{len(memory['facts']) + 1}"] = fact
        
        # Ajout du contexte de la conversation
        conversation_summary = f"Conversation {conversation_id} du {datetime.datetime.now().strftime('%d/%m/%Y')}"
        if conversation_summary not in memory["context"]:
            memory["context"].append(conversation_summary)
            
        self._save_user_memory(memory)
        return True

    def get_memory_context(self) -> str:
        """
        Génère un contexte formaté pour le modèle basé sur les mémoires
        
        Returns:
            str: Contexte formaté
        """
        memory = self._load_user_memory()
        context = "Informations importantes sur l'utilisateur:\n"
        
        if memory["name"]:
            context += f"- Nom: {memory['name']}\n"
        
        if memory["preferences"]:
            context += "- Préférences:\n"
            for key, value in memory["preferences"].items():
                context += f"  * {value}\n"
        
        if memory["facts"]:
            context += "- Faits importants:\n"
            for key, value in memory["facts"].items():
                context += f"  * {value}\n"
        
        if memory["context"]:
            context += "- Contexte supplémentaire:\n"
            for item in memory["context"]:
                context += f"  * {item}\n"
                
        return context

    def get_all_conversations(self) -> Dict[str, Any]:
        """Récupère toutes les conversations enregistrées"""
        conversations = {}
        
        try:
            # Parcourir tous les fichiers dans le répertoire de mémoire
            for filename in os.listdir(MEMORY_DIR):
                # Ne pas inclure le fichier de mémoire utilisateur
                if filename != "user_memory.json" and filename.endswith(".json"):
                    # Extraire l'ID de conversation du nom de fichier
                    conversation_id = filename.replace(".json", "")
                    
                    # Charger la mémoire de la conversation
                    try:
                        memory = self.load_memory(conversation_id)
                        conversations[conversation_id] = memory
                    except Exception as e:
                        print(f"Erreur lors du chargement de la conversation {conversation_id}: {str(e)}")
            
            return conversations
        except Exception as e:
            print(f"Erreur lors de la récupération des conversations: {str(e)}")
            return {}
