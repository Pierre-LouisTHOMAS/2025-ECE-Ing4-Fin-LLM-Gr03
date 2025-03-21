export interface MessageType {
    id: number;
    sender: "user" | "ai";
    text: string;
  }
  
  const STORAGE_KEY = "chat_conversations";
  
  /**
   * Récupère toutes les conversations enregistrées.
   * @returns Liste des conversations.
   */
  export const getConversations = (): { id: string; title: string; messages: MessageType[] }[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  };
  
  /**
   * Sauvegarde une conversation dans `localStorage`.
   * @param conversationId - Identifiant unique de la conversation.
   * @param title - Titre de la conversation.
   * @param messages - Liste des messages.
   */
  export const saveConversation = (conversationId: string, title: string, messages: MessageType[]) => {
    const conversations = getConversations();
    const updatedConversations = conversations.filter((conv) => conv.id !== conversationId);
    updatedConversations.push({ id: conversationId, title, messages });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConversations));
  };
  
  /**
   * Supprime une conversation de `localStorage`.
   * @param conversationId - Identifiant de la conversation à supprimer.
   */
  export const deleteConversation = (conversationId: string) => {
    const conversations = getConversations().filter((conv) => conv.id !== conversationId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  };