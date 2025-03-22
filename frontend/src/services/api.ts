import axios from "axios";

// URL de l'API backend - assurez-vous que cette URL correspond à celle de votre serveur backend
const API_URL = "http://0.0.0.0:8000/chat"; // Utilisation de l'adresse IP explicite au lieu de localhost

interface ApiResponse {
  response: string;
}

export const fetchAIResponse = async (message: string): Promise<string> => {
  try {
    console.log("📤 Envoi de la requête au backend :", { message });
    
    // Configuration explicite pour CORS
    const response = await axios.post<ApiResponse>(API_URL, { message }, {
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