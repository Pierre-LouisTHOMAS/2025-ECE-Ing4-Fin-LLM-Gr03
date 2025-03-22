"""
Service de gestion des informations utilisateur pour Qwen Chat.
Ce module permet d'extraire et de stocker les informations importantes sur l'utilisateur
pour permettre au modèle de personnaliser ses réponses.
Cette implémentation utilise des fichiers JSON pour stocker les informations.
"""

import re
import json
import os
from typing import Dict, Any, Optional
from pathlib import Path
from datetime import datetime
import logging

# Configuration du logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Création du répertoire pour stocker les fichiers de mémoire
MEMORY_DIR = Path("./data/memories")
MEMORY_DIR.mkdir(parents=True, exist_ok=True)

# Patrons de reconnaissance pour les informations personnelles
PATTERNS = {
    "name": [
        r"(?:je m'appelle|mon nom est|c'est|moi c'est)\s+([A-Z][a-zéèêëàâäôöùûüÿçÉÈÊËÀÂÄÔÖÙÛÜŸÇ]+(?:\s+[A-Z][a-zéèêëàâäôöùûüÿçÉÈÊËÀÂÄÔÖÙÛÜŸÇ]+)?)",
        r"(?:mon prénom est)\s+([A-Z][a-zéèêëàâäôöùûüÿçÉÈÊËÀÂÄÔÖÙÛÜŸÇ]+)"
    ],
    "age": [
        r"(?:j'ai|mon âge est)\s+(\d+)\s+ans"
    ],
    "job": [
        r"(?:je suis|je travaille comme|mon métier est)\s+([a-zéèêëàâäôöùûüÿçÉÈÊËÀÂÄÔÖÙÛÜŸÇ]+(?:\s+[a-zéèêëàâäôöùûüÿçÉÈÊËÀÂÄÔÖÙÛÜŸÇ]+){0,3})"
    ],
    "location": [
        r"(?:j'habite à|je vis à|je suis de)\s+([A-Z][a-zéèêëàâäôöùûüÿçÉÈÊËÀÂÄÔÖÙÛÜŸÇ]+(?:\s+[a-zéèêëàâäôöùûüÿçÉÈÊËÀÂÄÔÖÙÛÜŸÇ]+)?)"
    ],
    "preference": [
        r"(?:j'aime|je préfère)\s+([a-zéèêëàâäôöùûüÿçÉÈÊËÀÂÄÔÖÙÛÜŸÇ]+(?:\s+[a-zéèêëàâäôöùûüÿçÉÈÊËÀÂÄÔÖÙÛÜŸÇ]+){0,5})"
    ],
    "dislike": [
        r"(?:je n'aime pas|je déteste)\s+([a-zéèêëàâäôöùûüÿçÉÈÊËÀÂÄÔÖÙÛÜŸÇ]+(?:\s+[a-zéèêëàâäôöùûüÿçÉÈÊËÀÂÄÔÖÙÛÜŸÇ]+){0,5})"
    ]
}

def get_memory_file_path(conversation_id: str) -> Path:
    """
    Obtient le chemin du fichier de mémoire pour une conversation donnée.
    
    Args:
        conversation_id: ID de la conversation
        
    Returns:
        Chemin du fichier de mémoire
    """
    return MEMORY_DIR / f"{conversation_id}.json"

def load_memory(conversation_id: str) -> Dict[str, Any]:
    """
    Charge la mémoire d'une conversation depuis un fichier JSON.
    
    Args:
        conversation_id: ID de la conversation
        
    Returns:
        Dictionnaire contenant les informations mémorisées
    """
    memory_file = get_memory_file_path(conversation_id)
    
    if not memory_file.exists():
        # Créer un nouveau fichier de mémoire vide
        memory = {
            "conversation_id": conversation_id,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "memories": {}
        }
        save_memory(conversation_id, memory)
        logger.info(f"Nouveau fichier de mémoire créé pour la conversation {conversation_id}")
        return memory
    
    try:
        with open(memory_file, "r", encoding="utf-8") as f:
            memory = json.load(f)
            # Assurer la compatibilité avec l'ancien format
            if "messages" in memory:
                del memory["messages"]
            return memory
    except json.JSONDecodeError as e:
        logger.error(f"Erreur de décodage JSON pour la conversation {conversation_id}: {e}")
        memory = {
            "conversation_id": conversation_id,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "memories": {}
        }
        save_memory(conversation_id, memory)
        return memory
    except Exception as e:
        logger.error(f"Erreur lors du chargement de la mémoire: {e}")
        memory = {
            "conversation_id": conversation_id,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "memories": {}
        }
        save_memory(conversation_id, memory)
        return memory

def save_memory(conversation_id: str, memory: Dict[str, Any]) -> bool:
    """
    Sauvegarde la mémoire d'une conversation dans un fichier JSON.
    
    Args:
        conversation_id: ID de la conversation
        memory: Dictionnaire contenant les informations à sauvegarder
        
    Returns:
        True si la sauvegarde a réussi, False sinon
    """
    memory_file = get_memory_file_path(conversation_id)
    
    # Mettre à jour la date de modification
    memory["updated_at"] = datetime.now().isoformat()
    
    try:
        # Créer le répertoire parent s'il n'existe pas
        memory_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Écrire dans un fichier temporaire puis renommer pour éviter la corruption
        temp_file = memory_file.with_suffix('.tmp')
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(memory, f, ensure_ascii=False, indent=2)
        
        # Renommer le fichier temporaire
        temp_file.replace(memory_file)
        return True
    except Exception as e:
        logger.error(f"Erreur lors de la sauvegarde de la mémoire pour la conversation {conversation_id}: {e}")
        return False

def delete_memory(conversation_id: str) -> bool:
    """
    Supprime le fichier de mémoire d'une conversation.
    
    Args:
        conversation_id: ID de la conversation
        
    Returns:
        True si le fichier a été supprimé, False sinon
    """
    memory_file = get_memory_file_path(conversation_id)
    
    if not memory_file.exists():
        logger.warning(f"Tentative de suppression d'un fichier de mémoire inexistant: {conversation_id}")
        return False
    
    try:
        os.remove(memory_file)
        logger.info(f"Mémoire supprimée pour la conversation {conversation_id}")
        return True
    except Exception as e:
        logger.error(f"Erreur lors de la suppression de la mémoire pour la conversation {conversation_id}: {e}")
        return False

def extract_information(text: str) -> Dict[str, str]:
    """
    Extrait les informations personnelles d'un texte.
    
    Args:
        text: Le texte à analyser
        
    Returns:
        Un dictionnaire contenant les informations extraites
    """
    if not text or not isinstance(text, str):
        logger.warning(f"Texte invalide pour l'extraction d'informations: {text}")
        return {}
        
    extracted_info = {}
    
    # Cas spécial pour la détection du prénom
    # Recherche directe dans le texte original pour préserver la casse
    name_patterns = [
        r"Je m'appelle ([A-Z][a-zéèêëàâäôöùûüÿçÉÈÊËÀÂÄÔÖÙÛÜŸÇ]+(?:[-\s]+[A-Z][a-zéèêëàâäôöùûüÿçÉÈÊËÀÂÄÔÖÙÛÜŸÇ]+)?)",
        r"Mon nom est ([A-Z][a-zéèêëàâäôöùûüÿçÉÈÊËÀÂÄÔÖÙÛÜŸÇ]+(?:[-\s]+[A-Z][a-zéèêëàâäôöùûüÿçÉÈÊËÀÂÄÔÖÙÛÜŸÇ]+)?)",
        r"Mon prénom est ([A-Z][a-zéèêëàâäôöùûüÿçÉÈÊËÀÂÄÔÖÙÛÜŸÇ]+(?:[-\s]+[A-Z][a-zéèêëàâäôöùûüÿçÉÈÊËÀÂÄÔÖÙÛÜŸÇ]+)?)",
        r"Appelle-moi ([A-Z][a-zéèêëàâäôöùûüÿçÉÈÊËÀÂÄÔÖÙÛÜŸÇ]+(?:[-\s]+[A-Z][a-zéèêëàâäôöùûüÿçÉÈÊËÀÂÄÔÖÙÛÜŸÇ]+)?)"
    ]
    
    for pattern in name_patterns:
        try:
            matches = re.search(pattern, text)
            if matches:
                extracted_info["name"] = matches.group(1)
                break
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction du nom avec le pattern {pattern}: {e}")
    
    # Normaliser le texte (mettre en minuscules) pour les autres patterns
    normalized_text = text.lower()
    
    # Rechercher les informations avec les patrons
    for info_type, patterns in PATTERNS.items():
        # Si on a déjà trouvé le nom avec les patterns spéciaux, on saute
        if info_type == "name" and "name" in extracted_info:
            continue
            
        for pattern in patterns:
            try:
                matches = re.search(pattern, normalized_text)
                if matches:
                    extracted_info[info_type] = matches.group(1)
                    # Pour le nom, on met la première lettre en majuscule
                    if info_type == "name":
                        extracted_info[info_type] = extracted_info[info_type].capitalize()
                    break
            except Exception as e:
                logger.error(f"Erreur lors de l'extraction de {info_type} avec le pattern {pattern}: {e}")
    
    if extracted_info:
        logger.info(f"Informations extraites: {extracted_info}")
    
    return extracted_info

def process_user_message(db=None, conversation_id: str = None, message: str = None) -> Dict[str, str]:
    """
    Traite un message utilisateur pour en extraire des informations et les stocker.
    
    Args:
        db: Paramètre ignoré, conservé pour compatibilité
        conversation_id: ID de la conversation
        message: Message de l'utilisateur
        
    Returns:
        Dictionnaire des informations extraites et stockées
    """
    if not conversation_id or not message:
        logger.warning(f"Paramètres manquants pour process_user_message: conversation_id={conversation_id}, message={message}")
        return {}
        
    # Extraire les informations du message
    extracted_info = extract_information(message)
    
    if not extracted_info:
        return {}
    
    try:
        # Charger la mémoire existante
        memory = load_memory(conversation_id)
        
        # Ajouter ou mettre à jour les informations extraites
        for key, value in extracted_info.items():
            memory["memories"][key] = {
                "value": value,
                "updated_at": datetime.now().isoformat()
            }
        
        # Sauvegarder la mémoire mise à jour
        if save_memory(conversation_id, memory):
            logger.info(f"Informations utilisateur sauvegardées pour la conversation {conversation_id}: {extracted_info}")
        else:
            logger.error(f"Erreur lors de la sauvegarde des informations pour la conversation {conversation_id}")
    except Exception as e:
        logger.error(f"Erreur lors du traitement du message utilisateur: {e}")
    
    return extracted_info

def get_conversation_context(db=None, conversation_id: str = None) -> str:
    """
    Récupère le contexte mémorisé d'une conversation pour l'inclure dans le prompt.
    
    Args:
        db: Paramètre ignoré, conservé pour compatibilité
        conversation_id: ID de la conversation
        
    Returns:
        Texte formaté contenant les informations mémorisées
    """
    if not conversation_id:
        logger.warning("Tentative de récupération du contexte sans ID de conversation")
        return ""
    
    try:
        # Charger la mémoire
        memory = load_memory(conversation_id)
        
        if not memory["memories"]:
            return ""
        
        # Formatter les informations de manière structurée
        context = "### Informations importantes à retenir sur l'utilisateur:\n"
        
        # Traitement spécial pour le nom (à afficher en premier)
        if "name" in memory["memories"]:
            context += f"- L'utilisateur s'appelle {memory['memories']['name']['value']}. Utilise son prénom dans tes réponses pour personnaliser la conversation.\n"
        
        # Ajouter les autres informations
        for key, info in memory["memories"].items():
            if key != "name":  # Nom déjà traité
                # Formater la clé pour l'affichage
                key_display = {
                    "age": "Âge",
                    "job": "Profession",
                    "location": "Lieu de résidence",
                    "preference": "Préférence",
                    "dislike": "N'aime pas"
                }.get(key, key.capitalize())
                
                context += f"- {key_display}: {info['value']}\n"
        
        # Ajouter une instruction finale
        context += "\nTu dois utiliser ces informations pour personnaliser tes réponses, mais sans les répéter explicitement à l'utilisateur."
        
        logger.info(f"Contexte de conversation récupéré pour {conversation_id}")
        return context
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du contexte pour la conversation {conversation_id}: {e}")
        return ""
