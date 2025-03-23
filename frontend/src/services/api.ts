import axios from "axios";

// Configuration de base de l'API
const BASE_URL = "http://localhost:8000"; // Utilisation de localhost pour une meilleure compatibilité avec le navigateur
const CHAT_URL = `${BASE_URL}/chat`;
const PDF_CHAT_URL = `${BASE_URL}/chat-pdf`;
const IMAGE_CHAT_URL = `${BASE_URL}/chat-image`;
const CONVERSATIONS_URL = `${BASE_URL}/conversations`;

// Configuration d'axios avec un timeout pour éviter les attentes trop longues
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15 secondes
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Fonction pour vérifier si le serveur backend est accessible
const checkBackendConnection = async (): Promise<boolean> => {
  try {
    await apiClient.get('/conversations', { timeout: 5000 });
    return true;
  } catch (error) {
    console.error('🔄 Tentative de connexion au backend échouée, nouvelle tentative dans 5 secondes...');
    return false;
  }
};

// Fonction pour réessayer une requête avec un délai
const retryWithDelay = async <T>(fn: () => Promise<T>, maxRetries = 3, delay = 2000): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        console.log(`Tentative ${i + 1}/${maxRetries} échouée, nouvelle tentative dans ${delay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
};

// Intercepteur pour gérer les erreurs de manière globale
apiClient.interceptors.response.use(
  response => response,
  async error => {
    // Gérer les erreurs réseau de manière plus robuste
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Délai d\'attente dépassé. Le serveur met trop de temps à répondre.');
    } else if (error.code === 'ERR_NETWORK') {
      console.error('🛑 Erreur de connexion au serveur. Vérifiez que le backend est bien lancé.');
      
      // Vérifier périodiquement si le backend est de nouveau accessible
      setTimeout(async () => {
        const isConnected = await checkBackendConnection();
        if (isConnected) {
          console.log('✅ Connexion au backend rétablie!');
          window.location.reload(); // Recharger l'application une fois la connexion rétablie
        }
      }, 5000);
    }
    return Promise.reject(error);
  }
);

// Types pour l'API
export interface Message {
  message_id: string | number; // Accepte les ID sous forme de string ou number
  sender: "user" | "ai";
  text: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  messages: Message[];
}

interface ApiResponse {
  response: string;
}

// Fonction pour obtenir une réponse de l'IA avec historique des messages
export const fetchAIResponse = async (message: string, conversationId: string, messageHistory: { sender: string, text: string }[] = []): Promise<string> => {
  return retryWithDelay(async () => {
    try {
      console.log("📤 Envoi de la requête au backend avec historique et ID de conversation:", { message, conversationId, historyLength: messageHistory.length });
      
      const response = await apiClient.post<ApiResponse>(CHAT_URL.replace(BASE_URL, ''), { 
        message, 
        conversation_id: conversationId,
        history: messageHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }))
      });
      
      console.log("📥 Réponse reçue du backend :", response.data);
      return response.data.response;
    } catch (error: any) {
      // Affichage détaillé de l'erreur pour faciliter le débogage
      console.error("❌ Erreur lors de la communication avec l'IA :", error);
      
      if (error.response) {
        // La requête a été faite et le serveur a répondu avec un code d'état
        console.error("Détails de l'erreur :", {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        console.error("Aucune réponse reçue :", error.request);
      } else {
        // Une erreur s'est produite lors de la configuration de la requête
        console.error("Erreur de configuration :", error.message);
      }
      
      throw error; // Propager l'erreur pour le mécanisme de nouvelle tentative
    }
  }, 3, 3000).catch(error => {
    console.error("🚫 Toutes les tentatives ont échoué pour fetchAIResponse");
    return "Une erreur est survenue lors de la communication avec le serveur. Veuillez réessayer.";
  });
};

// Fonctions pour la gestion des conversations
export const getConversations = async (): Promise<Conversation[]> => {
  return retryWithDelay(async () => {
    try {
      const response = await apiClient.get<Conversation[]>('/conversations');
      return response.data;
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des conversations :", error);
      throw error; // Propager l'erreur pour le mécanisme de nouvelle tentative
    }
  }, 3, 2000).catch(error => {
    console.error("🚫 Toutes les tentatives ont échoué pour getConversations");
    // En cas d'erreur réseau, retourner un tableau vide mais ne pas bloquer l'application
    return [];
  });
};

export const getConversation = async (id: string): Promise<Conversation | null> => {
  if (!id) {
    console.error("ID de conversation invalide");
    return null;
  }
  
  return retryWithDelay(async () => {
    try {
      const response = await apiClient.get<Conversation>(`/conversations/${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération de la conversation ${id} :`, error);
      throw error; // Propager l'erreur pour le mécanisme de nouvelle tentative
    }
  }, 3, 2000).catch(error => {
    console.error(`🚫 Toutes les tentatives ont échoué pour getConversation ${id}`);
    return null;
  });
};

export const createConversation = async (title: string): Promise<Conversation | null> => {
  return retryWithDelay(async () => {
    try {
      const newConversation = {
        id: Date.now().toString(),
        title,
        created_at: new Date().toISOString(),
        messages: []
      };
      
      const response = await apiClient.post<Conversation>('/conversations', newConversation);
      return response.data;
    } catch (error) {
      console.error("❌ Erreur lors de la création de la conversation :", error);
      throw error; // Propager l'erreur pour le mécanisme de nouvelle tentative
    }
  }, 3, 2000).catch(error => {
    console.error("🚫 Toutes les tentatives ont échoué pour createConversation");
    return null;
  });
};

/**
 * Met à jour le titre d'une conversation existante.
 * @param id - Identifiant de la conversation.
 * @param title - Nouveau titre pour la conversation.
 * @returns La conversation mise à jour ou null en cas d'erreur.
 */
export const updateConversation = async (id: string, title: string): Promise<Conversation | null> => {
  if (!id) {
    console.error("ID de conversation invalide pour la mise à jour");
    return null;
  }
  
  return retryWithDelay(async () => {
    try {
      // D'abord, récupérer la conversation existante
      const existingConversation = await getConversation(id);
      
      if (!existingConversation) {
        console.error(`❌ Conversation ${id} non trouvée pour la mise à jour du titre`);
        return null;
      }
      
      // Mettre à jour le titre
      const updatedConversation = {
        ...existingConversation,
        title
      };
      
      // Envoyer la mise à jour
      const response = await apiClient.put<Conversation>(`/conversations/${id}`, updatedConversation);
      console.log(`✅ Titre de la conversation ${id} mis à jour avec succès`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur lors de la mise à jour de la conversation ${id} :`, error);
      throw error; // Propager l'erreur pour le mécanisme de nouvelle tentative
    }
  }, 3, 2000).catch(error => {
    console.error(`🚫 Toutes les tentatives ont échoué pour updateConversation ${id}`);
    return null;
  });
};

export const deleteConversation = async (id: string): Promise<boolean> => {
  if (!id) {
    console.error("ID de conversation invalide pour la suppression");
    return false;
  }
  
  return retryWithDelay(async () => {
    try {
      await apiClient.delete(`/conversations/${id}`);
      return true;
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression de la conversation ${id} :`, error);
      throw error; // Propager l'erreur pour le mécanisme de nouvelle tentative
    }
  }, 3, 2000).catch(error => {
    console.error(`🚫 Toutes les tentatives ont échoué pour deleteConversation ${id}`);
    return false;
  });
};

// Fonction pour envoyer un fichier PDF et obtenir une réponse de l'IA
export const fetchAIResponseWithPDF = async (file: File, conversationId: string, question?: string, messageHistory: { sender: string, text: string }[] = []): Promise<string> => {
  if (!file || !conversationId) {
    console.error("Fichier ou ID de conversation manquant pour fetchAIResponseWithPDF");
    return "Une erreur est survenue : fichier ou ID de conversation manquant.";
  }
  
  return retryWithDelay(async () => {
    try {
      console.log("📜 Envoi du fichier PDF au backend :", { fileName: file.name, fileSize: file.size, conversationId, question, historyLength: messageHistory.length });
      
      // Création d'un FormData pour envoyer le fichier
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversation_id', conversationId);
      
      // Ajouter la question si elle existe
      if (question && question.trim() !== '') {
        formData.append('question', question);
      }
      
      // Ajouter l'historique des messages au format JSON
      if (messageHistory.length > 0) {
        const history = messageHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));
        formData.append('history', JSON.stringify(history));
      }
      
      // Configuration explicite pour CORS avec FormData
      const response = await apiClient.post<ApiResponse>(PDF_CHAT_URL.replace(BASE_URL, ''), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
        timeout: 60000 // 60 secondes pour les fichiers PDF volumineux
      });
      
      console.log("💬 Réponse reçue du backend pour le PDF :", response.data);
      return response.data.response;
    } catch (error: any) {
      // Affichage détaillé de l'erreur pour faciliter le débogage
      console.error("❌ Erreur lors de l'envoi du PDF :", error);
      
      if (error.response) {
        // La requête a été faite et le serveur a répondu avec un code d'état
        console.error("Détails de l'erreur :", {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        console.error("Aucune réponse reçue :", error.request);
      } else {
        // Une erreur s'est produite lors de la configuration de la requête
        console.error("Erreur de configuration :", error.message);
      }
      
      throw error; // Propager l'erreur pour le mécanisme de nouvelle tentative
    }
  }, 2, 5000).catch(error => {
    console.error("🚫 Toutes les tentatives ont échoué pour fetchAIResponseWithPDF");
    return "Une erreur est survenue lors du traitement de votre fichier PDF. Veuillez réessayer.";
  });
};

// Fonction pour envoyer une image et obtenir une réponse de l'IA
export const fetchAIResponseWithImage = async (file: File, conversationId: string, question?: string, messageHistory: { sender: string, text: string }[] = []): Promise<string> => {
  if (!file || !conversationId) {
    console.error("Fichier ou ID de conversation manquant pour fetchAIResponseWithImage");
    return "Une erreur est survenue : fichier ou ID de conversation manquant.";
  }
  
  return retryWithDelay(async () => {
    try {
      console.log("🖼️ Envoi de l'image au backend :", { fileName: file.name, fileSize: file.size, conversationId, question, historyLength: messageHistory.length });
      
      // Création d'un FormData pour envoyer le fichier
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversation_id', conversationId);
      
      // Ajouter la question si elle existe
      if (question && question.trim() !== '') {
        formData.append('question', question);
      }
      
      // Ajouter l'historique des messages au format JSON
      if (messageHistory.length > 0) {
        const history = messageHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));
        formData.append('history', JSON.stringify(history));
      }
      
      // Configuration explicite pour CORS avec FormData
      const response = await apiClient.post<ApiResponse>(IMAGE_CHAT_URL.replace(BASE_URL, ''), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
        timeout: 30000 // 30 secondes pour les images
      });
      
      console.log("💬 Réponse reçue du backend pour l'image :", response.data);
      return response.data.response;
    } catch (error: any) {
      // Affichage détaillé de l'erreur pour faciliter le débogage
      console.error("❌ Erreur lors de l'envoi de l'image :", error);
      
      if (error.response) {
        // La requête a été faite et le serveur a répondu avec un code d'état
        console.error("Détails de l'erreur :", {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        console.error("Aucune réponse reçue :", error.request);
      } else {
        // Une erreur s'est produite lors de la configuration de la requête
        console.error("Erreur de configuration :", error.message);
      }
      
      throw error; // Propager l'erreur pour le mécanisme de nouvelle tentative
    }
  }, 2, 5000).catch(error => {
    console.error("🚫 Toutes les tentatives ont échoué pour fetchAIResponseWithImage");
    return "Une erreur est survenue lors du traitement de votre image. Veuillez réessayer.";
  });
};

export const saveConversationWithMessages = async (
  id: string,
  title: string,
  messages: { message_id: string | number; sender: "user" | "ai"; text: string }[]
): Promise<Conversation | null> => {
  try {
    // Vérifier que l'ID est une chaîne valide
    if (!id) {
      console.error("ID de conversation invalide");
      return null;
    }
    
    // Formater les données selon ce que le backend attend
    const data = {
      id,
      title,
      created_at: new Date().toISOString(),
      messages: messages.map(msg => ({
        message_id: msg.message_id,
        sender: msg.sender,
        text: msg.text
      }))
    };
    
    console.log(`💾 Tentative de sauvegarde de la conversation ${id} avec ${messages.length} messages`);
    
    const response = await axios.post<Conversation>(`${CONVERSATIONS_URL}/${id}/save`, data);
    console.log("💾 Conversation sauvegardée avec succès sur le serveur :", response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Erreur lors de la sauvegarde de la conversation ${id} :`, error);
    return null;
  }
};
