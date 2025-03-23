import {
  getConversations as fetchConversationsFromAPI,
  getConversation as fetchConversationFromAPI,
  saveConversationWithMessages as saveConversationToAPI,
  deleteConversation as deleteConversationFromAPI,
  createConversation as createConversationOnAPI,
  updateConversation as updateConversationOnAPI,
  Message
} from './api';

export interface MessageType {
  id: string | number; // Accepte les ID sous forme de string ou number
  sender: "user" | "ai";
  text: string;
}

// Clé pour le stockage local (utilisé comme cache)
const STORAGE_KEY = "chat_conversations";

/**
 * Récupère toutes les conversations enregistrées.
 * @returns Liste des conversations.
 */
export const getConversations = async (): Promise<{ id: string; title: string; messages: MessageType[] }[]> => {
  try {
    // Essayer d'abord de récupérer depuis l'API
    const apiConversations = await fetchConversationsFromAPI();
    
    if (apiConversations && apiConversations.length > 0) {
      // Convertir le format de l'API au format local
      const formattedConversations = apiConversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        messages: conv.messages.map(msg => ({
          id: msg.message_id,
          sender: msg.sender,
          text: msg.text
        }))
      }));
      
      // Mettre à jour le cache local
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formattedConversations));
      
      return formattedConversations;
    }
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des conversations depuis l'API :", error);
    console.log("⚠️ Utilisation du cache local à la place");
  }
  
  // Fallback sur le stockage local si l'API échoue
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

/**
 * Récupère une conversation spécifique.
 * @param conversationId - Identifiant de la conversation.
 * @returns La conversation ou null si non trouvée.
 */
export const getConversation = async (conversationId: string): Promise<{ id: string; title: string; messages: MessageType[] } | null> => {
  try {
    // Essayer d'abord de récupérer depuis l'API
    const apiConversation = await fetchConversationFromAPI(conversationId);
    
    if (apiConversation) {
      // Convertir le format de l'API au format local
      const formattedConversation = {
        id: apiConversation.id,
        title: apiConversation.title,
        messages: apiConversation.messages.map(msg => ({
          id: msg.message_id,
          sender: msg.sender,
          text: msg.text
        }))
      };
      
      return formattedConversation;
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération de la conversation ${conversationId} depuis l'API :`, error);
    console.log("⚠️ Recherche dans le cache local à la place");
  }
  
  // Fallback sur le stockage local si l'API échoue
  const conversations = getLocalConversations();
  return conversations.find(conv => conv.id === conversationId) || null;
};

/**
 * Récupère uniquement les messages d'une conversation spécifique.
 * @param conversationId - Identifiant de la conversation.
 * @returns Liste des messages ou tableau vide si la conversation n'est pas trouvée.
 */
export const getConversationMessages = async (conversationId: string): Promise<MessageType[]> => {
  try {
    const conversation = await getConversation(conversationId);
    if (conversation && conversation.messages) {
      return conversation.messages;
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des messages de la conversation ${conversationId} :`, error);
  }
  
  return [];
};

/**
 * Sauvegarde une conversation dans l'API et dans le cache local.
 * @param conversationId - Identifiant unique de la conversation.
 * @param title - Titre de la conversation.
 * @param messages - Liste des messages.
 */
export const saveConversation = async (conversationId: string, title: string, messages: MessageType[]) => {
  // Vérifier que l'ID est valide
  if (!conversationId) {
    console.error("ID de conversation invalide, utilisation d'un ID par défaut");
    conversationId = Date.now().toString();
  }
  
  // Sauvegarder dans le cache local d'abord (pour une réponse rapide)
  saveToLocalStorage(conversationId, title, messages);
  
  try {
    // Convertir les messages au format de l'API
    const apiMessages = messages.map(msg => ({
      message_id: msg.id || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      sender: msg.sender,
      text: msg.text
    }));
    
    // Sauvegarder dans l'API avec un timeout plus court pour éviter les attentes
    const savePromise = saveConversationToAPI(conversationId, title, apiMessages);
    
    // Utiliser un timeout pour éviter de bloquer trop longtemps
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Timeout lors de la sauvegarde")), 5000);
    });
    
    await Promise.race([savePromise, timeoutPromise]);
    console.log("✅ Conversation sauvegardée avec succès dans l'API");
  } catch (error) {
    console.error("❌ Erreur lors de la sauvegarde de la conversation dans l'API :", error);
    console.log("⚠️ La conversation est uniquement sauvegardée localement");
  }
};

/**
 * Supprime une conversation de l'API et du cache local.
 * @param conversationId - Identifiant de la conversation à supprimer.
 */
export const deleteConversation = async (conversationId: string) => {
  // Supprimer du cache local d'abord (pour une réponse rapide)
  deleteFromLocalStorage(conversationId);
  
  try {
    // Supprimer de l'API
    await deleteConversationFromAPI(conversationId);
    console.log("✅ Conversation supprimée avec succès de l'API");
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de la conversation de l'API :", error);
  }
};

/**
 * Renomme une conversation dans l'API et dans le cache local.
 * @param conversationId - Identifiant de la conversation à renommer.
 * @param newTitle - Nouveau titre de la conversation.
 * @returns La conversation mise à jour ou null en cas d'erreur.
 */
export const renameConversation = async (conversationId: string, newTitle: string): Promise<{ id: string; title: string; messages: MessageType[] } | null> => {
  try {
    // Mettre à jour le titre dans l'API
    await updateConversationOnAPI(conversationId, newTitle);
    console.log(`✅ Titre de la conversation ${conversationId} mis à jour dans l'API`);
    
    // Récupérer la conversation mise à jour
    const conversation = await getConversation(conversationId);
    
    if (conversation) {
      // Mettre à jour le cache local
      const conversations = getLocalConversations();
      const updatedConversations = conversations.map(conv => {
        if (conv.id === conversationId) {
          return { ...conv, title: newTitle };
        }
        return conv;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConversations));
      
      return { ...conversation, title: newTitle };
    }
    return null;
  } catch (error) {
    console.error(`❌ Erreur lors du renommage de la conversation ${conversationId} :`, error);
    
    // Essayer de mettre à jour uniquement le cache local
    try {
      const conversations = getLocalConversations();
      const conversation = conversations.find(conv => conv.id === conversationId);
      
      if (conversation) {
        const updatedConversations = conversations.map(conv => {
          if (conv.id === conversationId) {
            return { ...conv, title: newTitle };
          }
          return conv;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConversations));
        
        return { ...conversation, title: newTitle };
      }
    } catch (localError) {
      console.error(`❌ Erreur lors de la mise à jour du cache local :`, localError);
    }
    
    return null;
  }
};

/**
 * Crée une nouvelle conversation vide.
 * @param title - Titre de la conversation.
 * @returns La nouvelle conversation créée.
 */
export const createNewConversation = async (title: string): Promise<{ id: string; title: string; messages: MessageType[] } | null> => {
  try {
    // Créer dans l'API
    const apiConversation = await createConversationOnAPI(title);
    
    if (apiConversation) {
      // Convertir au format local
      const formattedConversation = {
        id: apiConversation.id,
        title: apiConversation.title,
        messages: []
      };
      
      // Mettre à jour le cache local
      saveToLocalStorage(formattedConversation.id, formattedConversation.title, formattedConversation.messages);
      
      return formattedConversation;
    }
  } catch (error) {
    console.error("❌ Erreur lors de la création de la conversation dans l'API :", error);
  }
  
  // Fallback : créer localement si l'API échoue
  const id = Date.now().toString();
  const newConversation = { id, title, messages: [] };
  saveToLocalStorage(id, title, []);
  return newConversation;
};

// Fonctions utilitaires pour le stockage local (utilisées comme cache)
const getLocalConversations = (): { id: string; title: string; messages: MessageType[] }[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveToLocalStorage = (conversationId: string, title: string, messages: MessageType[]) => {
  const conversations = getLocalConversations().filter((conv) => conv.id !== conversationId);
  const updatedConversations = [...conversations, { id: conversationId, title, messages }];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConversations));
  console.log("📌 Conversation sauvegardée dans le cache local :", { id: conversationId, title });
};

const deleteFromLocalStorage = (conversationId: string) => {
  const conversations = getLocalConversations().filter((conv) => conv.id !== conversationId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  console.log("🗑️ Conversation supprimée du cache local :", conversationId);
};