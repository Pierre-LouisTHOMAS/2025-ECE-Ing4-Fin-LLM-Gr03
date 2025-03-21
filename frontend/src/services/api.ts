import axios from "axios";

const API_URL = "http://localhost:8000/chat"; // Vérifie que le backend est bien lancé

interface ApiResponse {
  response: string;
}

export const fetchAIResponse = async (message: string): Promise<string> => {
  try {
    const response = await axios.post<ApiResponse>(API_URL, { message });
    return response.data.response;
  } catch (error) {
    console.error("Erreur lors de la communication avec l'IA :", error);
    return "Une erreur est survenue, veuillez réessayer.";
  }
};