import React, { useEffect, useState } from 'react';
import { ListGroup, Button, Container, Row, Col, Modal, Alert, Dropdown, Offcanvas } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getConversations, startConversation, deleteChat } from '../../services/api';
import { Conversation, MessageType, User, ApiError } from '../../types';
import NewConversation from './NewConversation';
import WebSocketService from '../../services/websocket';
import UserSearch from '../users/UserSearch';
import { getAvatarColor, getInitials } from '../../utils/avatarUtils';
import { List, Bookmark, BellFill, ShieldLock, Palette } from 'react-bootstrap-icons';
import './ConversationList.css';

interface MessageProps {
  message: MessageType;
  isCurrentUser: boolean;
  searchTerm?: string;
  onClearChat?: () => void;
}

const ConversationList: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    conversationId: number | null;
  }>({
    show: false,
    x: 0,
    y: 0,
    conversationId: null
  });
  const [pinnedChats, setPinnedChats] = useState<number[]>(() => {
    const saved = localStorage.getItem('pinnedChats');
    return saved ? JSON.parse(saved) : [];
  });
  const [showSettings, setShowSettings] = useState(false);
  const [savedMessagesEnabled, setSavedMessagesEnabled] = useState(() => {
    return localStorage.getItem('savedMessagesEnabled') === 'true';
  });
  const navigate = useNavigate();
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }

    const currentUser = JSON.parse(userStr);
    if (!currentUser?.id) {
      console.error('No user ID found');
      navigate('/login');
      return;
    }
    let globalWs: WebSocket | null = null;
    
    const setupWebSocket = () => {
      try {
        globalWs = new WebSocket(`ws://localhost:8000/ws/notifications/${currentUser.id}/`);
        
        globalWs.onopen = () => {
          console.log('Global WebSocket connection established');
        };
        
        globalWs.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'new_conversation') {
            fetchConversations();
          }
        };
        
        globalWs.onclose = () => {
          console.log('Global WebSocket connection closed');
        };
        
        globalWs.onerror = (error) => {
          console.error('Global WebSocket error:', error);
        };
      } catch (error) {
        console.error('Error setting up WebSocket:', error);
      }
    };
    fetchConversations();
    setupWebSocket();

    return () => {
      if (globalWs) {
        globalWs.close();
      }
    };
  }, [navigate]); 
  useEffect(() => {
    localStorage.setItem('pinnedChats', JSON.stringify(pinnedChats));
  }, [pinnedChats]);

  useEffect(() => {
    const handleChatNameUpdate = (event: CustomEvent) => {
      const { chatId, newName } = event.detail;
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === chatId 
            ? { ...conv, customName: newName }
            : conv
        )
      );
    };

    window.addEventListener('chatNameUpdated', handleChatNameUpdate as EventListener);

    return () => {
      window.removeEventListener('chatNameUpdated', handleChatNameUpdate as EventListener);
    };
  }, []);

  const fetchConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations');
      
      if (axios.isAxiosError(error)) {
        const apiError = error as ApiError;
        if (apiError.response?.status === 401) {
          navigate('/login');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = (newConversation: Conversation) => {
    setConversations([newConversation, ...conversations]);
    setShowNewConversation(false);
    navigate(`/conversations/${newConversation.id}`);
  };

  const handleContextMenu = (e: React.MouseEvent, conversationId: number) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.pageX,
      y: e.pageY,
      conversationId
    });
  };

  const handleDeleteChat = async (conversationId: number) => {
    try {
      await deleteChat(conversationId);
      setConversations(conversations.filter(conv => conv.id !== conversationId));
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
    setContextMenu({ show: false, x: 0, y: 0, conversationId: null });
  };

  const handlePinChat = (conversationId: number) => {
    setPinnedChats(prev => {
      if (prev.includes(conversationId)) {
        return prev.filter(id => id !== conversationId);
      }
      return [...prev, conversationId];
    });
    setContextMenu({ show: false, x: 0, y: 0, conversationId: null });
  };
  const sortedConversations = [...conversations].sort((a, b) => {
    const isPinnedA = pinnedChats.includes(a.id);
    const isPinnedB = pinnedChats.includes(b.id);
    if (isPinnedA && !isPinnedB) return -1;
    if (!isPinnedA && isPinnedB) return 1;
    return 0;
  });
  useEffect(() => {
    const handleClick = () => {
      setContextMenu({ show: false, x: 0, y: 0, conversationId: null });
    };
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  const handleSavedMessagesToggle = () => {
    const newValue = !savedMessagesEnabled;
    setSavedMessagesEnabled(newValue);
    localStorage.setItem('savedMessagesEnabled', String(newValue));
  };

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-danger">{error}</div>;
  }

  return (
    <div className="h-100 d-flex flex-column">
      <div className="p-3 border-bottom">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center">
            <List 
              size={28} 
              className="burger-menu me-3"
              onClick={() => setShowSettings(true)}
            />
            <h4 className="mb-0">Chats</h4>
          </div>
          <Button variant="primary" onClick={() => setShowNewConversation(true)}>
            New Chat
          </Button>
        </div>
      </div>

      {}
      <Offcanvas show={showSettings} onHide={() => setShowSettings(false)}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Налаштування</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <div className="settings-menu">
            <Link 
              to="/settings/profile" 
              className="settings-item"
              onClick={() => setShowSettings(false)}
            >
              <i className="bi bi-person-circle me-2"></i>
              Мій профіль
            </Link>
            <div className="settings-item">
              <div className="d-flex justify-content-between align-items-center w-100">
                <div className="d-flex align-items-center">
                  <Bookmark className="me-2" />
                  <span>Збережені повідомлення</span>
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={savedMessagesEnabled}
                    onChange={handleSavedMessagesToggle}
                  />
                </div>
              </div>
            </div>
            <div className="settings-item">
              <i className="bi bi-bell me-2"></i>
              Сповіщення
            </div>
            <div className="settings-item">
              <i className="bi bi-shield-lock me-2"></i>
              Конфіденційність
            </div>
            <Link 
              to="/settings/theme" 
              className="settings-item"
              onClick={() => setShowSettings(false)}
            >
              <i className="bi bi-palette me-2"></i>
              Тема
            </Link>
            <div 
              className="settings-item text-danger"
              onClick={() => {
                setShowSettings(false);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}
            >
              <i className="bi bi-box-arrow-right me-2"></i>
              Вийти
            </div>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      <div className="flex-grow-1 overflow-auto">
        <ListGroup variant="flush">
          {}
          {savedMessagesEnabled && (
            <ListGroup.Item 
              action 
              as={Link}
              to="/saved-messages"
              className="d-flex align-items-center saved-messages-item"
            >
              <div className="saved-messages-avatar">
                <Bookmark size={24} />
              </div>
              <div className="conversation-info">
                <div className="fw-bold">Збережені повідомлення</div>
                <div className="text-muted small">Збережіть важливі повідомлення</div>
              </div>
            </ListGroup.Item>
          )}
          
          {sortedConversations.map(conversation => {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const otherUser = conversation.participants.find(p => p.id !== currentUser.id);
            const isPinned = pinnedChats.includes(conversation.id);
          
            const chatName = localStorage.getItem(`chat_name_${conversation.id}`) || 
                            otherUser?.username || '';

            return (
              <ListGroup.Item
                key={conversation.id}
                action
                as={Link}
                to={`/conversations/${conversation.id}`}
                className={`border-bottom conversation-item ${isPinned ? 'pinned' : ''}`}
                onContextMenu={(e) => handleContextMenu(e, conversation.id)}
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <div 
                      className="message-avatar me-3"
                      style={{ 
                        backgroundColor: getAvatarColor(otherUser?.username || '')
                      }}
                    >
                      {getInitials(otherUser?.username || '')}
                    </div>
                    <div className="conversation-info">
                      <div className="fw-bold">
                        {chatName}
                      </div>
                      {conversation.last_message && (
                        <div className="text-muted small">
                          {conversation.last_message.content}
                        </div>
                      )}
                    </div>
                  </div>
                  {isPinned && (
                    <div className="pin-icon-container">
                      <i className="bi bi-pin-angle-fill pin-icon" />
                    </div>
                  )}
                </div>
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      </div>

      {showNewConversation && (
        <NewConversation
          onConversationCreated={handleNewConversation}
          onCancel={() => setShowNewConversation(false)}
        />
      )}

      {}
      {contextMenu.show && (
        <div 
          className="context-menu"
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1000
          }}
        >
          <div 
            className="context-menu-item"
            onClick={() => contextMenu.conversationId && handlePinChat(contextMenu.conversationId)}
          >
            {pinnedChats.includes(contextMenu.conversationId || 0) ? 'Unpin Chat' : 'Pin Chat'}
          </div>
          <div 
            className="context-menu-item delete"
            onClick={() => contextMenu.conversationId && handleDeleteChat(contextMenu.conversationId)}
          >
            Delete Chat
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationList;