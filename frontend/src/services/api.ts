import axios from "axios";

const API_URL = "http://localhost:8000/chat"; // À adapter si besoin

/**
 * Envoie un message au backend et récupère la réponse du modèle IA.
 * @param message - Texte envoyé par l'utilisateur.
 * @returns Réponse du modèle.
 */
export const fetchAIResponse = async (message: string): Promise<string> => {
  try {
    const response = await axios.post(API_URL, { message });
    return response.data.response;
  } catch (error) {
    console.error("Erreur lors de la communication avec l'IA :", error);
    return "Une erreur est survenue, veuillez réessayer.";
  }
};