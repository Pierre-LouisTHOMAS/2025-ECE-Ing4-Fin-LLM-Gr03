"""
Service de gestion de la mémoire des conversations pour Qwen Chat.
Ce module permet d'extraire, stocker et récupérer des informations importantes
des conversations pour permettre au modèle de s'en souvenir.
"""

import re
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from . import crud, database, schema

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

def extract_information(text: str) -> Dict[str, str]:
    """
    Extrait les informations personnelles d'un texte.
    
    Args:
        text: Le texte à analyser
        
    Returns:
        Un dictionnaire contenant les informations extraites
    """
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
        matches = re.search(pattern, text)
        if matches:
            extracted_info["name"] = matches.group(1)
            break
    
    # Normaliser le texte (mettre en minuscules) pour les autres patterns
    normalized_text = text.lower()
    
    # Rechercher les informations avec les patrons
    for info_type, patterns in PATTERNS.items():
        # Si on a déjà trouvé le nom avec les patterns spéciaux, on saute
        if info_type == "name" and "name" in extracted_info:
            continue
            
        for pattern in patterns:
            matches = re.search(pattern, normalized_text)
            if matches:
                extracted_info[info_type] = matches.group(1)
                # Pour le nom, on met la première lettre en majuscule
                if info_type == "name":
                    extracted_info[info_type] = extracted_info[info_type].capitalize()
                break
    
    return extracted_info

def process_user_message(db: Session, conversation_id: str, message: str) -> Dict[str, str]:
    """
    Traite un message utilisateur pour en extraire des informations et les stocker.
    
    Args:
        db: Session de base de données
        conversation_id: ID de la conversation
        message: Message de l'utilisateur
        
    Returns:
        Dictionnaire des informations extraites et stockées
    """
    # Extraire les informations du message
    extracted_info = extract_information(message)
    
    # Stocker les informations extraites
    for key, value in extracted_info.items():
        crud.create_or_update_memory(db, conversation_id, key, value)
    
    return extracted_info

def get_conversation_context(db: Session, conversation_id: str) -> str:
    """
    Récupère le contexte de la conversation sous forme de texte formaté.
    
    Args:
        db: Session de base de données
        conversation_id: ID de la conversation
        
    Returns:
        Texte formaté contenant les informations mémorisées
    """
    # Récupérer tous les souvenirs de la conversation
    memories = crud.get_memories_as_dict(db, conversation_id)
    
    if not memories:
        return ""
    
    # Formater les souvenirs en texte pour le modèle
    context_parts = ["### Informations importantes à retenir sur l'utilisateur:"]
    
    # Mapping des clés en français
    key_mapping = {
        "name": "Nom",
        "age": "Âge",
        "job": "Profession",
        "location": "Lieu de résidence",
        "preference": "Préférence",
        "dislike": "Aversion"
    }
    
    # Instructions spéciales pour le modèle
    if "name" in memories:
        context_parts.append(f"- L'utilisateur s'appelle {memories['name']}. Utilise son prénom dans tes réponses pour personnaliser la conversation.")
    
    # Ajouter chaque information au contexte
    for key, value in memories.items():
        if key == "name":
            continue  # Déjà traité spécialement ci-dessus
        elif key in key_mapping:
            context_parts.append(f"- {key_mapping[key]}: {value}")
        else:
            context_parts.append(f"- {key}: {value}")
    
    # Ajouter une instruction finale
    context_parts.append("Tu dois utiliser ces informations pour personnaliser tes réponses, mais sans les répéter explicitement à l'utilisateur.")
    
    return "\n".join(context_parts)

def get_recent_messages(db: Session, conversation_id: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Récupère les messages récents d'une conversation.
    
    Args:
        db: Session de base de données
        conversation_id: ID de la conversation
        limit: Nombre maximum de messages à récupérer
        
    Returns:
        Liste des messages récents
    """
    # Récupérer tous les messages de la conversation
    messages = crud.get_messages(db, conversation_id)
    
    # Trier les messages par ID (ordre chronologique)
    messages.sort(key=lambda x: x.id)
    
    # Prendre les derniers messages
    recent_messages = messages[-limit:] if len(messages) > limit else messages
    
    # Formater les messages
    formatted_messages = []
    for msg in recent_messages:
        formatted_messages.append({
            "role": "user" if msg.sender == "user" else "assistant",
            "content": msg.text
        })
    
    return formatted_messages
