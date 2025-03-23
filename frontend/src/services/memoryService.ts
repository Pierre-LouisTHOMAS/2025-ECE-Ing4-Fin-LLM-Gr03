import axios from 'axios';

const BASE_URL = "http://localhost:8000";
const MEMORIES_URL = `${BASE_URL}/memories`;

// Types pour la mémoire
export interface Memory {
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface UserInfo {
  name?: string;
  preferences?: {
    [key: string]: string | boolean | number;
  };
  facts?: {
    [key: string]: string;
  };
  context?: string[];
}

/**
 * Récupère toutes les mémoires associées à un utilisateur
 * @returns Liste des mémoires de l'utilisateur
 */
export const getUserMemories = async (): Promise<UserInfo> => {
  try {
    // Utiliser une promesse avec timeout pour éviter les attentes trop longues
    const fetchPromise = axios.get(`${MEMORIES_URL}/user`);
    
    // Promesse qui se résout après un délai (timeout)
    const timeoutPromise = new Promise<{data: UserInfo}>((_, reject) => {
      setTimeout(() => {
        console.warn("Timeout lors de la récupération des mémoires utilisateur");
        reject(new Error("Timeout"));
      }, 3000);
    });
    
    // Utiliser la première promesse qui se résout
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    return response.data as UserInfo;
  } catch (error: any) {
    console.error("Erreur lors de la récupération des mémoires utilisateur:", error?.message || error);
    
    // Retourner un objet par défaut en cas d'erreur
    return {
      name: undefined,
      preferences: {},
      facts: {},
      context: []
    };
  }
};

/**
 * Sauvegarde une information utilisateur en mémoire
 * @param key - Clé de la mémoire (ex: "name", "preferences.theme")
 * @param value - Valeur à stocker
 * @returns Succès de l'opération
 */
export const saveUserMemory = async (key: string, value: any): Promise<boolean> => {
  // Vérifier que la clé est valide
  if (!key) {
    console.error("Clé de mémoire invalide");
    return false;
  }
  
  try {
    // Créer une promesse avec timeout pour éviter les attentes trop longues
    const savePromise = axios.post(`${MEMORIES_URL}/user`, { key, value });
    
    // Promesse de timeout pour abandonner après 3 secondes
    const timeoutPromise = new Promise<any>((_, reject) => {
      setTimeout(() => reject(new Error("Timeout lors de la sauvegarde de la mémoire")), 3000);
    });
    
    // Utiliser la première promesse qui se résout
    await Promise.race([savePromise, timeoutPromise]);
    return true;
  } catch (error: any) {
    console.error(`Erreur lors de la sauvegarde de la mémoire utilisateur (${key}):`, error?.message || error);
    return false;
  }
};

/**
 * Extrait les informations importantes d'une conversation
 * @param conversationId - ID de la conversation
 * @param messages - Messages de la conversation
 * @returns Succès de l'opération
 */
export const extractMemoriesFromConversation = async (
  conversationId: string,
  messages: { sender: string; text: string }[]
): Promise<boolean> => {
  // Vérifier que l'ID de conversation est valide
  if (!conversationId) {
    console.error("Impossible d'extraire les souvenirs: ID de conversation invalide");
    return false;
  }
  
  // Vérifier qu'il y a des messages à traiter
  if (!messages || messages.length === 0) {
    console.error("Impossible d'extraire les souvenirs: Aucun message fourni");
    return false;
  }
  
  try {
    // Créer une promesse avec timeout pour éviter les attentes trop longues
    const extractPromise = axios.post(`${MEMORIES_URL}/extract`, {
      conversation_id: conversationId,
      messages: messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }))
    });
    
    // Promesse de timeout pour abandonner après 5 secondes
    const timeoutPromise = new Promise<any>((_, reject) => {
      setTimeout(() => reject(new Error("Timeout lors de l'extraction des souvenirs")), 5000);
    });
    
    // Utiliser la première promesse qui se résout
    await Promise.race([extractPromise, timeoutPromise]);
    return true;
  } catch (error: any) {
    console.error("Erreur lors de l'extraction des mémoires:", error?.message || error);
    return false;
  }
};

/**
 * Récupère le contexte de mémoire pour une nouvelle conversation
 * @returns Contexte de mémoire formaté pour le modèle
 */
export const getMemoryContext = async (): Promise<string> => {
  try {
    // Utiliser getUserMemories qui a déjà un timeout intégré
    const userInfo = await getUserMemories();

    
    let context = "Informations importantes sur l'utilisateur:\n";
    
    if (userInfo.name) {
      context += `- Nom: ${userInfo.name}\n`;
    }
    
    if (userInfo.preferences && Object.keys(userInfo.preferences).length > 0) {
      context += "- Préférences:\n";
      for (const [key, value] of Object.entries(userInfo.preferences)) {
        context += `  * ${key}: ${value}\n`;
      }
    }
    
    if (userInfo.facts && Object.keys(userInfo.facts).length > 0) {
      context += "- Faits importants:\n";
      for (const [key, value] of Object.entries(userInfo.facts)) {
        context += `  * ${key}: ${value}\n`;
      }
    }
    
    if (userInfo.context && userInfo.context.length > 0) {
      context += "- Contexte supplémentaire:\n";
      for (const item of userInfo.context) {
        context += `  * ${item}\n`;
      }
    }
    
    return context;
  } catch (error) {
    console.error("Erreur lors de la récupération du contexte de mémoire:", error);
    return "";
  }
};
