import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Container, Row, Col, Modal } from 'react-bootstrap';
import { getConversation, getMessages, sendMessage, clearChat, deleteChat } from '../../services/api';
import WebSocketService from '../../services/websocket';
import { Message as MessageType, Reaction, MessageStatus, User } from '../../types';  // Додаємо імпорт User
import Message from '../messages/Message';
import { toast } from 'react-toastify';
// Remove this duplicate import
// import { clearChat } from '../../services/api';
import { ThreeDotsVertical } from 'react-bootstrap-icons';
import { getAvatarColor, getInitials } from '../../utils/avatarUtils';
import './ConversationDetail.css';
import ProfileModal from '../profile/ProfileModal';


const ConversationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  console.log('Current user from localStorage:', currentUser);
  // Add this with your other state variables
  const [showOptions, setShowOptions] = useState(false);
  
  // Додаємо стани для пошуку
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMessages, setFilteredMessages] = useState<MessageType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [chatName, setChatName] = useState('');
  const otherUser = conversation?.participants.find((p: User) => p.id !== currentUser.id);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Додаємо useEffect для фільтрації повідомлень
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMessages(messages);
    } else {
      const filtered = messages.filter(message => 
        message.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMessages(filtered);
    }
  }, [searchTerm, messages]);

  // Додаємо функцію для очищення пошуку
  const clearSearch = () => {
    setSearchTerm('');
    setIsSearching(false);
  };

  // Додаємо функцію для відкриття пошуку
  const toggleSearch = () => {
    setIsSearching(!isSearching);
    setShowOptions(false);
  };

  // Scroll to bottom of messages only if user is at the bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      // Only auto-scroll if user is at the bottom of the container
      const container = messagesContainerRef.current;
      const isAtBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 100;
      
      if (isAtBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }

    const user = JSON.parse(userStr);
    if (!user?.id) {
      console.error('No user ID found');
      navigate('/login');
      return;
    }

    const fetchConversationData = async () => {
      if (!id) return;
      
      try {
        const [conversationData, messagesData] = await Promise.all([
          getConversation(parseInt(id)),
          getMessages(parseInt(id))
        ]);
        
        setConversation(conversationData);
        setMessages(messagesData);
      } catch (error) {
        console.error('Error fetching conversation data:', error);
        navigate('/conversations');
      } finally {
        setLoading(false);
      }
    };

    fetchConversationData();

    // Connect to WebSocket
    if (id && user.id) {
      try {
        WebSocketService.connect(parseInt(id), user.id);
        
        const unsubscribe = WebSocketService.onMessage((data) => {
          // Only add the message if it's not from the current user
          if (data.user_id !== user.id) {
            const sender = conversation?.participants.find((p: any) => p.id === data.user_id);
            if (sender) {
              const newMsg = {
                id: Math.random(), // Temporary ID until refresh
                sender,
                content: data.message,
                timestamp: new Date().toISOString(),
                is_read: false,
                status: MessageStatus.SENT, // Add this line
                reactions: []
              };
              setMessages(prev => [...prev, newMsg]);
            }
          }
        });
        
        return () => {
          unsubscribe();
          WebSocketService.disconnect();
        };
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
      }
    }
  }, [id, navigate, currentUser.id, conversation]);

  // Додаємо логування для перевірки
  useEffect(() => {
    console.log('Current user:', currentUser);
  }, [currentUser]);

  // Оновлюємо ім'я чату при завантаженні розмови
  useEffect(() => {
    if (conversation) {
      // Спочатку перевіряємо, чи є збережене ім'я для цього чату
      const savedName = localStorage.getItem(`chat_name_${conversation.id}`);
      if (savedName) {
        setChatName(savedName);
      } else if (otherUser?.username) {
        setChatName(otherUser.username);
      }
    }
  }, [conversation, otherUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDropdown]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id || sending) return;
    
    setSending(true);
    try {
      // Try to send via WebSocket first
      if (WebSocketService.isConnected()) {
        WebSocketService.sendMessage(newMessage, currentUser.id);
      }
      
      // Always send via API to ensure message is saved
      const sentMessage = await sendMessage(parseInt(id), newMessage);
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Add this function to your ConversationDetail component
  const handleReactionUpdate = (messageId: number, updatedReactions: Reaction[]) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === messageId 
          ? { ...msg, reactions: updatedReactions } 
          : msg
      )
    );
  };

  // Add this function to your component
  // Update the handleClearChat function to use conversation.id instead of conversationId
  const handleClearChat = async () => {
    if (window.confirm('Are you sure you want to clear all messages in this chat?')) {
      try {
        await clearChat(conversation.id); // Use conversation.id instead of conversationId
        // Clear messages in the state
        setMessages([]);
        // Show success message
        toast.success('Chat cleared successfully');
      } catch (error) {
        console.error('Error clearing chat:', error);
        toast.error('Failed to clear chat. Please try again.');
      }
    }
  };

  // Add this function to your component
  const handleDeleteChat = async () => {
    if (window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      try {
        await deleteChat(conversation.id);
        // Show success message
        toast.success('Chat deleted successfully');
        // Navigate back to conversations list
        navigate('/conversations');
      } catch (error) {
        console.error('Error deleting chat:', error);
        toast.error('Failed to delete chat. Please try again.');
      }
    }
  };

  const handleEditContact = () => {
    setShowUserInfo(false);
    setEditedName(chatName);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (conversation && editedName.trim()) {
        // Зберігаємо нове ім'я в localStorage
        localStorage.setItem(`chat_name_${conversation.id}`, editedName);
        
        // Оновлюємо стан
        setChatName(editedName);
        
        // Оновлюємо назву в списку чатів через подію
        const event = new CustomEvent('chatNameUpdated', {
          detail: { chatId: conversation.id, newName: editedName }
        });
        window.dispatchEvent(event);
        
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Error updating chat name:', error);
    }
  };

  const handleOptionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  if (loading) {
    return <div className="text-center mt-5">Loading conversation...</div>;
  }

  if (!conversation) {
    return <div className="text-center mt-5">Conversation not found</div>;
  }

  const otherParticipants = conversation.participants.filter((p: any) => p.id !== currentUser.id);

  return (
    <Container fluid className="h-100 d-flex flex-column p-0">
      {/* Хедер чату */}
      <div className="chat-header p-3 border-bottom">
        <div className="d-flex align-items-center justify-content-between">
          <div 
            className="d-flex align-items-center cursor-pointer"
            onClick={() => setShowUserInfo(true)}
          >
            <div 
              className="message-avatar me-3"
              style={{ 
                backgroundColor: getAvatarColor(otherUser?.username || '')
              }}
            >
              {getInitials(otherUser?.username || '')}
            </div>
            <div>
              <h5 className="mb-0">{chatName}</h5>
            </div>
          </div>
          <div className="chat-options position-relative">
            <ThreeDotsVertical 
              size={32}
              className="cursor-pointer p-2" 
              onClick={handleOptionsClick}
              style={{ display: 'block' }}
            />
            {showDropdown && (
              <div className="dropdown-menu show position-absolute end-0 mt-1">
                <div className="dropdown-item" onClick={() => {
                  setShowUserInfo(true);
                  setShowDropdown(false);
                }}>
                  <i className="bi bi-person me-2"></i>
                  Інформація про користувача
                </div>
                <div className="dropdown-item" onClick={toggleSearch}>
                  <i className="bi bi-search me-2"></i>
                  Пошук повідомлень
                </div>
                <div className="dropdown-item" onClick={handleClearChat}>
                  <i className="bi bi-trash me-2"></i>
                  Очистити чат
                </div>
                <div className="dropdown-item text-danger" onClick={handleDeleteChat}>
                  <i className="bi bi-trash-fill me-2"></i>
                  Видалити чат
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Поле пошуку */}
        {isSearching && (
          <div className="mt-2">
            <Form.Group className="d-flex align-items-center">
              <Form.Control
                type="text"
                placeholder="Пошук повідомлень..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="sm"
                autoFocus
              />
              <Button 
                variant="link" 
                className="text-secondary p-0 ms-2" 
                onClick={clearSearch}
              >
                <i className="bi bi-x-circle"></i>
              </Button>
            </Form.Group>
          </div>
        )}
      </div>

      {/* Модальне вікно з інформацією про користувача */}
      <Modal 
        show={showUserInfo} 
        onHide={() => setShowUserInfo(false)}
        centered
      >
        <Modal.Header>
          <Modal.Title>Про користувача</Modal.Title>
          <div className="d-flex align-items-center">
            <ThreeDotsVertical 
              size={32}
              className="cursor-pointer me-2" 
              onClick={handleEditContact}
            />
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setShowUserInfo(false)}
            />
          </div>
        </Modal.Header>
        <Modal.Body className="text-center pb-4">
          <div 
            className="user-avatar mb-3 mx-auto"
            style={{ 
              backgroundColor: getAvatarColor(otherUser?.username || ''),
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              color: 'white'
            }}
          >
            {getInitials(otherUser?.username || '')}
          </div>
          
          <h4>{chatName}</h4>
          
          <div className="user-info mt-4">
            <div className="info-item mb-3">
              <div className="text-muted mb-1">Ім'я користувача</div>
              <div>@{otherUser?.username}</div>
            </div>

            <div className="info-item">
              <div className="text-muted mb-1">Активність</div>
              <div>недавно</div>
            </div>
          </div>

          <div className="notification-settings mt-4 pt-3 border-top">
            <div className="d-flex justify-content-between align-items-center">
              <div>Сповіщення</div>
              <div className="form-check form-switch">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  role="switch" 
                  id="notificationSwitch"
                  defaultChecked
                />
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* Модальне вікно редагування контакту */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Редагувати ім'я чату</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Ім'я чату</Form.Label>
              <Form.Control
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Введіть ім'я чату"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Скасувати
          </Button>
          <Button variant="primary" onClick={handleSaveEdit}>
            Зберегти
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Модальне вікно профілю */}
      <ProfileModal
        show={showProfile}
        onHide={() => setShowProfile(false)}
        currentUser={currentUser}
      />

      {/* Контейнер для повідомлень */}
      <div className="flex-grow-1 messages-container overflow-auto p-3">
        {messages.map(message => (
          <Message
            key={message.id}
            message={message}
            isCurrentUser={String(currentUser.id) === String(message.sender.id)}
          />
        ))}
      </div>

      {/* Форма відправки повідомлення */}
      <div className="chat-footer p-3 border-top">
        <Form onSubmit={handleSendMessage}>
          <div className="d-flex">
            <Form.Control
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
            />
            <Button 
              variant="primary" 
              type="submit" 
              className="ms-2"
              disabled={sending || !newMessage.trim()}
            >
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </Form>
      </div>
    </Container>
  );
};

export default ConversationDetail;