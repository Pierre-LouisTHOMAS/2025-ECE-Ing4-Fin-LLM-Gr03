import React, { useState } from "react";
import { Menu, Item, useContextMenu } from 'react-contexify';
import 'react-contexify/ReactContexify.css';
import './Sidebar.css'; // Import des styles spécifiques pour la barre latérale

// Icônes pour la barre latérale
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ChatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Icône de suppression standard
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Icône de suppression rouge pour le survol
const RedTrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6H5H21" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Icône d'édition standard
const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icône d'édition verte pour le survol
const GreenEditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LoadingIcon = () => (
  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4.93 4.93L7.76 7.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16.24 16.24L19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4.93 19.07L7.76 16.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface SidebarProps {
  conversations: { id: string; title: string }[];
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation?: (id: string, newTitle: string) => void;
  currentConversationId: string | null;
  isLoading: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  conversations, 
  onSelectConversation, 
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  currentConversationId,
  isLoading
}) => {
  // États pour gérer le survol des boutons
  const [hoveredEditButton, setHoveredEditButton] = useState<string | null>(null);
  const [hoveredDeleteButton, setHoveredDeleteButton] = useState<string | null>(null);
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");

  // ID du menu contextuel
  const MENU_ID = 'conversation-context-menu';
  
  // Utilisation du hook useContextMenu
  const { show } = useContextMenu({
    id: MENU_ID,
  });
  
  // Afficher le menu contextuel
  const handleContextMenu = (e: React.MouseEvent, conversationId: string, title: string) => {
    e.preventDefault();
    show({ event: e, props: { conversationId, title } });
  };
  
  // Gérer le clic sur "Renommer"
  const handleRename = (args: any) => {
    if (onRenameConversation && args.props) {
      setEditingConversationId(args.props.conversationId);
      setEditingTitle(args.props.title);
    }
  };
  
  // Gérer le clic sur "Supprimer"
  const handleDelete = (args: any) => {
    if (args.props) {
      onDeleteConversation(args.props.conversationId);
    }
  };
  
  // Confirmer le renommage
  const confirmRename = (id: string) => {
    if (onRenameConversation && editingTitle.trim()) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingConversationId(null);
  };
  
  // Gérer la touche Entrée lors du renommage
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === 'Enter') {
      confirmRename(id);
    } else if (e.key === 'Escape') {
      setEditingConversationId(null);
    }
  };
  return (
    <div className="sidebar">
      <div className="sidebar-content">
        {/* Bouton Nouvelle Conversation */}
        <button
          onClick={onNewConversation}
          className="new-chat-button"
          disabled={isLoading}
        >
          {isLoading ? <LoadingIcon /> : <PlusIcon />} Nouvelle conversation
        </button>

        {/* Liste des conversations */}
        <div className="conversations-list">
          {isLoading ? (
            <div className="flex justify-center items-center p-4">
              <LoadingIcon />
              <span className="ml-2 text-gray-400">Chargement...</span>
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-gray-400 text-sm p-3">Aucune conversation</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`conversation-item ${currentConversationId === conv.id ? 'active' : ''} group`}
                onContextMenu={(e) => handleContextMenu(e, conv.id, conv.title)}
                onClick={() => onSelectConversation(conv.id)}
                style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '10px 12px' }}
              >
                <div className="conversation-title-container flex items-center cursor-pointer">
                  <ChatIcon />
                  {editingConversationId === conv.id ? (
                    <input
                      type="text"
                      className="ml-2 bg-gray-700 text-white border border-gray-500 rounded px-2 py-1 w-full"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => confirmRename(conv.id)}
                      onKeyDown={(e) => handleKeyDown(e, conv.id)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    <span className="ml-2 truncate">{conv.title}</span>
                  )}
                </div>
                <div className="conversation-actions">
                  {onRenameConversation && (
                    <button 
                      className="edit-button p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingConversationId(conv.id);
                        setEditingTitle(conv.title);
                      }}
                      title="Renommer la conversation"
                      style={{ opacity: '1', visibility: 'visible' }}
                      onMouseEnter={() => setHoveredEditButton(conv.id)}
                      onMouseLeave={() => setHoveredEditButton(null)}
                    >
                      {hoveredEditButton === conv.id ? <GreenEditIcon /> : <EditIcon />}
                    </button>
                  )}
                  <button 
                    className="delete-button p-1 ml-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv.id);
                    }}
                    title="Supprimer la conversation"
                    style={{ opacity: '1', visibility: 'visible' }}
                    onMouseEnter={() => setHoveredDeleteButton(conv.id)}
                    onMouseLeave={() => setHoveredDeleteButton(null)}
                  >
                    {hoveredDeleteButton === conv.id ? <RedTrashIcon /> : <TrashIcon />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Pied de page de la barre latérale */}
      <div className="sidebar-footer">
        <p>Qwen Chat v1.0</p>
      </div>
      
      {/* Menu contextuel */}
      <Menu id={MENU_ID}>
        {onRenameConversation && (
          <Item onClick={handleRename}>
            <EditIcon /> <span className="ml-2">Renommer</span>
          </Item>
        )}
        <Item onClick={handleDelete}>
          <TrashIcon /> <span className="ml-2">Supprimer</span>
        </Item>
      </Menu>
    </div>
  );
};

export default Sidebar;