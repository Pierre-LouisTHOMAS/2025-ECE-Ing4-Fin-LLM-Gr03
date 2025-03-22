import axios from "axios";

// Configuration de base de l'API
const BASE_URL = "http://localhost:8000"; // Utilisation de localhost pour une meilleure compatibilité avec le navigateur
const CHAT_URL = `${BASE_URL}/chat`;
const PDF_CHAT_URL = `${BASE_URL}/chat-pdf`;
const CONVERSATIONS_URL = `${BASE_URL}/conversations`;

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

// Fonction pour obtenir une réponse de l'IA
export const fetchAIResponse = async (message: string): Promise<string> => {
  try {
    console.log("📤 Envoi de la requête au backend :", { message });
    
    // Configuration explicite pour CORS
    const response = await axios.post<ApiResponse>(CHAT_URL, { message }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
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
    
    return "Une erreur est survenue lors de la communication avec le serveur. Veuillez réessayer.";
  }
};

// Fonctions pour la gestion des conversations
export const getConversations = async (): Promise<Conversation[]> => {
  try {
    const response = await axios.get<Conversation[]>(CONVERSATIONS_URL);
    return response.data;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des conversations :", error);
    return [];
  }
};

export const getConversation = async (id: string): Promise<Conversation | null> => {
  try {
    const response = await axios.get<Conversation>(`${CONVERSATIONS_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération de la conversation ${id} :`, error);
    return null;
  }
};

export const createConversation = async (title: string): Promise<Conversation | null> => {
  try {
    const newConversation = {
      id: Date.now().toString(),
      title,
      created_at: new Date().toISOString(),
      messages: []
    };
    
    const response = await axios.post<Conversation>(CONVERSATIONS_URL, newConversation);
    return response.data;
  } catch (error) {
    console.error("❌ Erreur lors de la création de la conversation :", error);
    return null;
  }
};

/**
 * Met à jour le titre d'une conversation existante.
 * @param id - Identifiant de la conversation.
 * @param title - Nouveau titre pour la conversation.
 * @returns La conversation mise à jour ou null en cas d'erreur.
 */
export const updateConversation = async (id: string, title: string): Promise<Conversation | null> => {
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
    const response = await axios.put<Conversation>(`${CONVERSATIONS_URL}/${id}`, updatedConversation);
    console.log(`✅ Titre de la conversation ${id} mis à jour avec succès`);
    return response.data;
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour de la conversation ${id} :`, error);
    return null;
  }
};

export const deleteConversation = async (id: string): Promise<boolean> => {
  try {
    await axios.delete(`${CONVERSATIONS_URL}/${id}`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de la suppression de la conversation ${id} :`, error);
    return false;
  }
};

// Fonction pour envoyer un fichier PDF et obtenir une réponse de l'IA
export const fetchAIResponseWithPDF = async (file: File): Promise<string> => {
  try {
    console.log("📄 Envoi du fichier PDF au backend :", { fileName: file.name, fileSize: file.size });
    
    // Création d'un FormData pour envoyer le fichier
    const formData = new FormData();
    formData.append('file', file);
    
    // Configuration explicite pour CORS avec FormData
    const response = await axios.post<ApiResponse>(PDF_CHAT_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      }
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
    
    throw new Error("Impossible de communiquer avec le serveur. Vérifiez que le backend est bien lancé.");
  }
};

export const saveConversationWithMessages = async (
  id: string,
  title: string,
  messages: { message_id: string | number; sender: "user" | "ai"; text: string }[]
): Promise<Conversation | null> => {
  try {
    const data = {
      id,
      title,
      created_at: new Date().toISOString(),
      messages
    };
    
    const response = await axios.post<Conversation>(`${CONVERSATIONS_URL}/${id}/save`, data);
    console.log("💾 Conversation sauvegardée avec succès sur le serveur :", response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Erreur lors de la sauvegarde de la conversation ${id} :`, error);
    return null;
  }
};
